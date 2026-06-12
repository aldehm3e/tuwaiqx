import { Worker } from "bullmq";
import { getEnv } from "@/src/lib/config/env";
import { indexDocument } from "@/src/lib/documents/indexer";

const worker = new Worker(
  "tuwaiqx-indexing",
  async (job) => {
    if (job.name === "index-document") {
      await indexDocument(job.data.documentId);
    }
  },
  {
    connection: {
      url: getEnv().REDIS_URL
    }
  }
);

worker.on("completed", (job) => {
  console.log(`Completed ${job.name} ${job.id}`);
});

worker.on("failed", (job, error) => {
  console.error(`Failed ${job?.name} ${job?.id}`, error);
});

