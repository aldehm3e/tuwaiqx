import crypto from "node:crypto";

export type TextChunk = {
  content: string;
  contentHash: string;
  tokenCount: number;
};

function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

export function hashContent(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export function chunkText(text: string, chunkSize = 1400, overlap = 180): TextChunk[] {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let cursor = 0;
  while (cursor < normalized.length) {
    const end = Math.min(cursor + chunkSize, normalized.length);
    let sliceEnd = end;
    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const candidate = Math.max(paragraphBreak, sentenceBreak);
      if (candidate > cursor + chunkSize * 0.55) {
        sliceEnd = candidate + 1;
      }
    }

    const content = normalized.slice(cursor, sliceEnd).trim();
    if (content) {
      chunks.push({
        content,
        contentHash: hashContent(content),
        tokenCount: estimateTokens(content)
      });
    }

    if (sliceEnd >= normalized.length) {
      break;
    }
    cursor = Math.max(sliceEnd - overlap, cursor + 1);
  }

  return chunks;
}

