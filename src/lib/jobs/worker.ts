import { Worker } from "bullmq";
import { getEnv } from "@/src/lib/config/env";
import { prisma } from "@/src/lib/db/prisma";
import { indexDocument } from "@/src/lib/documents/indexer";
import { indexingQueueName, supersededIndexingMessage, type DocumentIndexJobData } from "@/src/lib/jobs/queue";

async function shouldRunJob(systemJobId: string) {
  const systemJob = await prisma.systemJob.findUnique({
    where: { id: systemJobId },
    select: { status: true, errorMessage: true }
  });

  if (!systemJob) {
    throw new Error(`System job ${systemJobId} was not found.`);
  }

  if (systemJob.status === "failed" && systemJob.errorMessage === supersededIndexingMessage) {
    return false;
  }

  return systemJob.status === "queued" || systemJob.status === "running";
}

function hasRemainingAttempts(job: { attemptsMade: number; opts: { attempts?: number } }) {
  const attempts = job.opts.attempts ?? 1;
  return job.attemptsMade + 1 < attempts;
}

const worker = new Worker<DocumentIndexJobData>(
  indexingQueueName,
  async (job) => {
    if (job.name === "index-document") {
      if (!(await shouldRunJob(job.data.systemJobId))) {
        console.log(`Skipping inactive indexing job ${job.id} for document ${job.data.documentId}`);
        return;
      }

      console.log(`Indexing document ${job.data.documentId} from job ${job.id}`);
      try {
        await indexDocument(job.data.documentId, undefined, { systemJobId: job.data.systemJobId });
      } catch (error) {
        if (hasRemainingAttempts(job)) {
          await prisma.systemJob.update({
            where: { id: job.data.systemJobId },
            data: {
              status: "queued",
              errorMessage: error instanceof Error ? error.message : "Indexing failed; waiting for retry.",
              finishedAt: null
            }
          }).catch(() => undefined);
        }
        throw error;
      }
      return;
    }

    throw new Error(`Unknown indexing job: ${job.name}`);
  },
  {
    connection: {
      url: getEnv().REDIS_URL,
      maxRetriesPerRequest: null
    }
  }
);

worker.on("completed", (job) => {
  console.log(`Completed ${job.name} ${job.id} for document ${job.data.documentId}`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed ${job?.name} ${job?.id} for document ${job?.data.documentId}`, error);
});

process.on("SIGTERM", () => {
  void worker.close().then(() => process.exit(0));
});

process.on("SIGINT", () => {
  void worker.close().then(() => process.exit(0));
});
