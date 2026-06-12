import { Queue } from "bullmq";
import { getEnv } from "@/src/lib/config/env";

export const indexingQueue = new Queue("tuwaiqx-indexing", {
  connection: {
    url: getEnv().REDIS_URL
  }
});

export async function enqueueDocumentIndex(documentId: string) {
  return indexingQueue.add("index-document", { documentId }, { attempts: 3, backoff: { type: "exponential", delay: 5000 } });
}

