import { prisma } from "@/src/lib/db/prisma";
import type { RagContextChunk } from "@/src/lib/rag/prompt";

function normalizeQuestion(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function findDirectKnowledgeAnswer(input: {
  botId: string;
  question: string;
}): Promise<{ answer: string; sources: RagContextChunk[] } | null> {
  const normalizedQuestion = normalizeQuestion(input.question);
  if (!normalizedQuestion) {
    return null;
  }

  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      status: "approved",
      question: { not: null },
      OR: [{ botId: null }, { botId: input.botId }]
    },
    select: {
      id: true,
      botId: true,
      title: true,
      question: true,
      content: true,
      sourceUrl: true
    },
    orderBy: { updatedAt: "desc" },
    take: 1000
  });
  const entry = entries
    .sort((left, right) => Number(right.botId === input.botId) - Number(left.botId === input.botId))
    .find((candidate) => candidate.question && normalizeQuestion(candidate.question) === normalizedQuestion);

  if (!entry) {
    return null;
  }

  const document = await prisma.document.findFirst({
    where: {
      title: entry.title,
      sourceType: "faq",
      approved: true,
      status: "indexed",
      OR: [{ botId: null }, { botId: input.botId }]
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, sourceUrl: true }
  });

  return {
    answer: entry.content.trim(),
    sources: [
      {
        content: entry.content,
        title: entry.title,
        documentId: document?.id || entry.id,
        sourceUrl: document?.sourceUrl || entry.sourceUrl,
        pageNumber: null,
        chunkIndex: 0,
        score: 1
      }
    ]
  };
}
