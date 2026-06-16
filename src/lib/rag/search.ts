import { prisma } from "@/src/lib/db/prisma";
import type { RagContextChunk } from "@/src/lib/rag/prompt";
import { isPgVectorAvailable, vectorLiteral } from "@/src/lib/rag/vector";

export async function searchKnowledge(input: {
  botId: string;
  query: string;
  embedding?: number[];
  topK?: number;
  threshold?: number;
}): Promise<RagContextChunk[]> {
  const topK = input.topK ?? 6;
  const threshold = input.threshold ?? 0.15;

  if (input.embedding?.length && (await isPgVectorAvailable())) {
    try {
      const vector = vectorLiteral(input.embedding);
      const embeddingDimension = input.embedding.length;
      const results = await prisma.$queryRawUnsafe<RagContextChunk[]>(
        `
        SELECT
          c."content",
          c."chunkIndex",
          d."title",
          d."id" AS "documentId",
          d."sourceUrl",
          NULL::integer AS "pageNumber",
          (1 - (c."embedding" <=> $1::vector))::float AS "score"
        FROM "DocumentChunk" c
        JOIN "Document" d ON d."id" = c."documentId"
        WHERE d."approved" = true
          AND d."status" = 'indexed'
          AND c."embedding" IS NOT NULL
          AND vector_dims(c."embedding") = $4
          AND (c."botId" IS NULL OR c."botId" = $2)
          AND (d."botId" IS NULL OR d."botId" = $2)
        ORDER BY c."embedding" <=> $1::vector
        LIMIT $3
        `,
        vector,
        input.botId,
        topK,
        embeddingDimension
      );

      const filtered = results.filter((result) => result.score >= threshold);
      if (filtered.length > 0) {
        return filtered;
      }
    } catch (error) {
      console.warn("Vector search failed; falling back to full-text search.", {
        botId: input.botId,
        embeddingDimension: input.embedding.length,
        error: error instanceof Error ? error.message : "Unknown vector search error"
      });
      // Full-text fallback below keeps chat usable if pgvector is unavailable or dimensions differ.
    }
  }

  if (input.query.trim()) {
    try {
      const fullTextResults = await prisma.$queryRawUnsafe<RagContextChunk[]>(
        `
        WITH q AS (
          SELECT websearch_to_tsquery('simple', $1) AS query
        )
        SELECT
          c."content",
          c."chunkIndex",
          d."title",
          d."id" AS "documentId",
          d."sourceUrl",
          NULL::integer AS "pageNumber",
          LEAST(
            0.95,
            0.45 + (
              ts_rank_cd(to_tsvector('simple', coalesce(c."content", '')), q.query) +
              (ts_rank_cd(to_tsvector('simple', coalesce(d."title", '')), q.query) * 0.5)
            )
          )::float AS "score"
        FROM "DocumentChunk" c
        JOIN "Document" d ON d."id" = c."documentId"
        CROSS JOIN q
        WHERE d."approved" = true
          AND d."status" = 'indexed'
          AND (c."botId" IS NULL OR c."botId" = $2)
          AND (d."botId" IS NULL OR d."botId" = $2)
          AND (
            to_tsvector('simple', coalesce(c."content", '')) @@ q.query OR
            to_tsvector('simple', coalesce(d."title", '')) @@ q.query
          )
        ORDER BY "score" DESC, c."chunkIndex" ASC
        LIMIT $3
        `,
        input.query,
        input.botId,
        topK
      );

      if (fullTextResults.length > 0) {
        return fullTextResults;
      }
    } catch (error) {
      console.warn("Full-text search failed; falling back to contains search.", {
        botId: input.botId,
        error: error instanceof Error ? error.message : "Unknown full-text search error"
      });
    }
  }

  const terms = input.query
    .split(/\s+/)
    .map((term) => term.trim().replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((term) => term.length > 2)
    .slice(0, 8);
  const fallbackTerms = terms.length > 0 ? terms : [input.query.slice(0, 80)];
  const chunks = await prisma.documentChunk.findMany({
    where: {
      AND: [
        { OR: [{ botId: null }, { botId: input.botId }] },
        {
          document: {
            approved: true,
            status: "indexed",
            OR: [{ botId: null }, { botId: input.botId }]
          }
        },
        {
          OR: fallbackTerms.flatMap((term) => [
            { content: { contains: term, mode: "insensitive" as const } },
            { document: { title: { contains: term, mode: "insensitive" as const } } }
          ])
        }
      ]
    },
    include: { document: true },
    take: Math.max(topK * 4, 20)
  });

  return chunks
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const title = chunk.document.title.toLowerCase();
      const matchedTerms = fallbackTerms.filter((term) => {
        const normalized = term.toLowerCase();
        return content.includes(normalized) || title.includes(normalized);
      });
      return {
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        title: chunk.document.title,
        documentId: chunk.documentId,
        sourceUrl: chunk.document.sourceUrl,
        pageNumber: null,
        score: Math.min(0.86, 0.32 + matchedTerms.length / Math.max(fallbackTerms.length, 1))
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);
}
