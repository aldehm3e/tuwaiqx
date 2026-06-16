import { prisma } from "@/src/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { providerFromDb } from "@/src/lib/ai/factory";
import { getEnv } from "@/src/lib/config/env";
import { parseDocument } from "@/src/lib/documents/parse";
import { readStoredObject, storeUpload } from "@/src/lib/documents/storage";
import { readableTextForIndexing } from "@/src/lib/documents/text";
import { chunkText } from "@/src/lib/rag/chunk";
import { isPgVectorAvailable, vectorLiteral } from "@/src/lib/rag/vector";

type IndexDocumentOptions = {
  systemJobId?: string;
};

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(workers);
}

function textFilename(title: string) {
  const safeTitle = title.trim() || "knowledge";
  return `${safeTitle.slice(0, 60)}.txt`;
}

export async function indexDocument(documentId: string, buffer?: Buffer, options: IndexDocumentOptions = {}) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { bot: { include: { embeddingProvider: true, modelProvider: true } } }
  });
  if (!document) {
    if (options.systemJobId) {
      await prisma.systemJob.update({
        where: { id: options.systemJobId },
        data: {
          status: "failed",
          errorMessage: "Document not found.",
          finishedAt: new Date()
        }
      }).catch(() => undefined);
    }
    throw new Error("Document not found.");
  }

  const claimed = await prisma.document.updateMany({
    where: {
      id: documentId,
      status: { notIn: ["parsing", "indexing"] }
    },
    data: { status: "parsing", errorMessage: null }
  });

  if (claimed.count === 0) {
    const message = "Document indexing is already running for this document.";
    if (options.systemJobId) {
      await prisma.systemJob.update({
        where: { id: options.systemJobId },
        data: { status: "failed", errorMessage: message, finishedAt: new Date() }
      }).catch(() => undefined);
    } else {
      await prisma.systemJob.create({
        data: {
          type: "index_document",
          status: "failed",
          entityId: documentId,
          progress: 0,
          errorMessage: message,
          startedAt: new Date(),
          finishedAt: new Date()
        }
      });
    }
    throw new Error(message);
  }

  let jobId: string | undefined;

  try {
    await prisma.systemJob.updateMany({
      where: {
        type: "index_document",
        entityId: documentId,
        status: "running",
        ...(options.systemJobId ? { id: { not: options.systemJobId } } : {})
      },
      data: {
        status: "failed",
        errorMessage: "Superseded by a newer indexing attempt.",
        finishedAt: new Date()
      }
    });

    const job = options.systemJobId
      ? await prisma.systemJob.update({
          where: { id: options.systemJobId },
          data: {
            status: "running",
            progress: 5,
            errorMessage: null,
            startedAt: new Date(),
            finishedAt: null
          }
        })
      : await prisma.systemJob.create({
          data: {
            type: "index_document",
            status: "running",
            entityId: documentId,
            progress: 5,
            startedAt: new Date()
          }
        });
    jobId = job.id;

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "parsing", errorMessage: null }
    });
    await prisma.systemJob.update({
      where: { id: job.id },
      data: { progress: 15 }
    });

    const sourceBuffer = buffer || (document.storageKey ? await readStoredObject(document.storageKey) : undefined);
    const parsed =
      sourceBuffer &&
      (await parseDocument({
        buffer: sourceBuffer,
        filename: document.filename,
        mimeType: document.mimeType
      }));

    const text = readableTextForIndexing({
      parsedText: parsed?.text,
      fallbackTitle: document.title,
      parsedFromFile: Boolean(sourceBuffer),
      filename: document.filename,
      mimeType: document.mimeType
    });
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "indexing" }
    });
    await prisma.systemJob.update({
      where: { id: job.id },
      data: { progress: 35 }
    });

    await prisma.documentChunk.deleteMany({ where: { documentId } });
    const chunks = chunkText(text);
    if (!chunks.length) {
      throw new Error("No readable text could be extracted from this document.");
    }
    const settings = await prisma.appSettings.findFirst({
      select: { defaultEmbeddingProviderId: true }
    });
    const defaultEmbeddingProvider = settings?.defaultEmbeddingProviderId
      ? await prisma.modelProvider.findUnique({ where: { id: settings.defaultEmbeddingProviderId } })
      : null;
    const provider = providerFromDb(document.bot?.embeddingProvider || defaultEmbeddingProvider || document.bot?.modelProvider);
    const canStoreEmbeddings = await isPgVectorAvailable();
    const embeddingConcurrency = getEnv().EMBEDDING_CONCURRENCY;
    const progressInterval = Math.max(1, Math.ceil(chunks.length / 10));
    const savedChunks: Array<{ id: string; content: string; chunkIndex: number }> = [];

    for (const [index, chunk] of chunks.entries()) {
      const savedChunk = await prisma.documentChunk.create({
        data: {
          documentId,
          botId: document.botId,
          chunkIndex: index,
          content: chunk.content,
          contentHash: chunk.contentHash,
          tokenCount: chunk.tokenCount,
          metadataJson: (parsed?.metadata || {}) as Prisma.InputJsonObject
        }
      });
      savedChunks.push({ id: savedChunk.id, content: chunk.content, chunkIndex: index });

      if ((index + 1) % progressInterval === 0 || index === chunks.length - 1) {
        await prisma.systemJob.update({
          where: { id: job.id },
          data: { progress: Math.min(55, 35 + Math.round(((index + 1) / chunks.length) * 20)) }
        });
      }
    }

    if (canStoreEmbeddings) {
      let embeddedChunks = 0;
      await runWithConcurrency(savedChunks, embeddingConcurrency, async (savedChunk) => {
        try {
          const embedding = (await provider.embed({ input: savedChunk.content })).embedding;
          await prisma.$executeRawUnsafe(
            `UPDATE "DocumentChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
            vectorLiteral(embedding),
            savedChunk.id
          );
        } catch (error) {
          console.warn("Embedding failed; full-text fallback remains available.", {
            documentId,
            chunkIndex: savedChunk.chunkIndex,
            provider: provider.name,
            error: error instanceof Error ? error.message : "Unknown embedding error"
          });
        }

        embeddedChunks += 1;
        if (embeddedChunks % progressInterval === 0 || embeddedChunks === savedChunks.length) {
          await prisma.systemJob.update({
            where: { id: job.id },
            data: { progress: Math.min(95, 55 + Math.round((embeddedChunks / savedChunks.length) * 40)) }
          });
        }
      });
    } else {
      await prisma.systemJob.update({
        where: { id: job.id },
        data: { progress: 95 }
      });
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "indexed", indexedAt: new Date(), errorMessage: null }
    });
    await prisma.systemJob.update({
      where: { id: job.id },
      data: { status: "succeeded", progress: 100, finishedAt: new Date() }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Indexing failed";
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed", errorMessage: message }
    });
    if (jobId) {
      await prisma.systemJob.update({
        where: { id: jobId },
        data: { status: "failed", errorMessage: message, finishedAt: new Date() }
      }).catch(() => undefined);
    }
    throw error;
  }
}

export async function createTextDocument(input: {
  botId?: string | null;
  title: string;
  content: string;
  sourceType: "manual" | "faq" | "url";
  sourceUrl?: string | null;
  approved?: boolean;
  createdById?: string;
}) {
  const buffer = Buffer.from(input.content, "utf8");
  const filename = textFilename(input.title);
  const storageKey = await storeUpload({
    filename,
    mimeType: "text/plain",
    buffer
  });

  const document = await prisma.document.create({
    data: {
      botId: input.botId || null,
      title: input.title,
      filename,
      mimeType: "text/plain",
      sizeBytes: buffer.length,
      storageKey,
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl || null,
      status: "uploaded",
      approved: input.approved ?? true,
      createdById: input.createdById
    }
  });

  return document;
}

export async function indexTextDocument(input: Parameters<typeof createTextDocument>[0]) {
  const document = await createTextDocument(input);
  await indexDocument(document.id, Buffer.from(input.content, "utf8"));
  return document;
}

export async function reindexDocument(documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
        select: { content: true }
      }
    }
  });

  if (!document) {
    throw new Error("Document not found.");
  }

  const buffer = document.storageKey
    ? await readStoredObject(document.storageKey)
    : Buffer.from(document.chunks.map((chunk) => chunk.content).join("\n\n"), "utf8");

  if (!buffer.length) {
    throw new Error("No stored file or indexed text is available for this document.");
  }

  await indexDocument(documentId, buffer);
  return document;
}
