import { prisma } from "@/src/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { providerFromDb } from "@/src/lib/ai/factory";
import { parseDocument } from "@/src/lib/documents/parse";
import { chunkText } from "@/src/lib/rag/chunk";
import { isPgVectorAvailable, vectorLiteral } from "@/src/lib/rag/vector";

export async function indexDocument(documentId: string, buffer?: Buffer) {
  const job = await prisma.systemJob.create({
    data: {
      type: "index_document",
      status: "running",
      entityId: documentId,
      startedAt: new Date()
    }
  });

  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { bot: { include: { embeddingProvider: true, modelProvider: true } } }
    });
    if (!document) {
      throw new Error("Document not found.");
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "parsing", errorMessage: null }
    });

    const parsed =
      buffer &&
      (await parseDocument({
        buffer,
        filename: document.filename,
        mimeType: document.mimeType
      }));

    const text = parsed?.text || document.title;
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "indexing" }
    });

    await prisma.documentChunk.deleteMany({ where: { documentId } });
    const chunks = chunkText(text);
    const provider = providerFromDb(document.bot?.embeddingProvider || document.bot?.modelProvider);
    const canStoreEmbeddings = await isPgVectorAvailable();

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

      if (canStoreEmbeddings) {
        try {
          const embedding = (await provider.embed({ input: chunk.content })).embedding;
          await prisma.$executeRawUnsafe(
            `UPDATE "DocumentChunk" SET "embedding" = $1::vector WHERE "id" = $2`,
            vectorLiteral(embedding),
            savedChunk.id
          );
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Embedding failed; full-text fallback remains available.", error);
          }
        }
      }
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
    await prisma.systemJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: message, finishedAt: new Date() }
    });
    throw error;
  }
}

export async function indexTextDocument(input: {
  botId?: string | null;
  title: string;
  content: string;
  sourceType: "manual" | "faq" | "url";
  sourceUrl?: string | null;
  approved?: boolean;
  createdById?: string;
}) {
  const document = await prisma.document.create({
    data: {
      botId: input.botId || null,
      title: input.title,
      filename: `${input.title.slice(0, 60)}.txt`,
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(input.content),
      sourceType: input.sourceType,
      sourceUrl: input.sourceUrl || null,
      status: "uploaded",
      approved: input.approved ?? true,
      createdById: input.createdById
    }
  });

  await indexDocument(document.id, Buffer.from(input.content, "utf8"));
  return document;
}
