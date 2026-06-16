import { Queue } from "bullmq";
import { getEnv } from "@/src/lib/config/env";
import { prisma } from "@/src/lib/db/prisma";

export const indexingQueueName = "tuwaiqx-indexing";

export type DocumentIndexJobData = {
  documentId: string;
  systemJobId: string;
};

export const supersededIndexingMessage = "Superseded by a newer indexing request.";

let indexingQueue: Queue<DocumentIndexJobData> | null = null;

function getIndexingQueue() {
  indexingQueue ??= new Queue<DocumentIndexJobData>(indexingQueueName, {
    connection: {
      url: getEnv().REDIS_URL,
      maxRetriesPerRequest: null
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: { age: 3600, count: 500 },
      removeOnFail: { age: 86_400, count: 1000 }
    }
  });

  return indexingQueue;
}

async function removeSupersededBullJobs(systemJobIds: string[]) {
  const queue = getIndexingQueue();
  await Promise.all(
    systemJobIds.map(async (systemJobId) => {
      try {
        const job = await queue.getJob(systemJobId);
        await job?.remove();
      } catch (error) {
        console.warn("Unable to remove superseded indexing queue job.", {
          systemJobId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    })
  );
}

export async function enqueueDocumentIndex(documentId: string, options: { force?: boolean } = {}) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { id: true, status: true }
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  if (document.status === "archived") {
    throw new Error("Archived documents cannot be indexed.");
  }

  const activeJobs = await prisma.systemJob.findMany({
    where: {
      type: "index_document",
      entityId: documentId,
      status: { in: ["queued", "running"] }
    },
    orderBy: { createdAt: "desc" }
  });
  const activeJob = activeJobs[0];

  if (activeJob && !options.force) {
    return { queued: false, systemJobId: activeJob.id, reason: "already_queued" as const };
  }

  if (options.force) {
    await removeSupersededBullJobs(activeJobs.map((job) => job.id));
    await prisma.systemJob.updateMany({
      where: {
        type: "index_document",
        entityId: documentId,
        status: { in: ["queued", "running"] }
      },
      data: {
        status: "failed",
        errorMessage: supersededIndexingMessage,
        finishedAt: new Date()
      }
    });
  }

  if (document.status === "parsing" || document.status === "indexing" || options.force) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "uploaded", errorMessage: null }
    });
  }

  const systemJob = await prisma.systemJob.create({
    data: {
      type: "index_document",
      status: "queued",
      entityId: documentId,
      progress: 0
    }
  });

  try {
    const job = await getIndexingQueue().add(
      "index-document",
      { documentId, systemJobId: systemJob.id },
      { jobId: systemJob.id }
    );
    return { queued: true, systemJobId: systemJob.id, bullJobId: job.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing queue unavailable.";
    await prisma.$transaction([
      prisma.systemJob.update({
        where: { id: systemJob.id },
        data: { status: "failed", errorMessage: message, finishedAt: new Date() }
      }),
      prisma.document.update({
        where: { id: documentId },
        data: { status: "failed", errorMessage: message }
      })
    ]);
    throw error;
  }
}
