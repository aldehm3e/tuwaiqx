import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens, hashContent } from "../src/lib/rag/chunk";

describe("chunkText", () => {
  it("splits long text with stable hashes and token estimates", () => {
    const text = Array.from({ length: 120 }, (_, index) => `Sentence ${index} has useful NGO policy text.`).join(" ");
    const chunks = chunkText(text, 260, 40);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].contentHash).toBe(hashContent(chunks[0].content));
    expect(chunks[0].tokenCount).toBe(estimateTokens(chunks[0].content));
  });

  it("returns no chunks for whitespace", () => {
    expect(chunkText("   \n\n  ")).toEqual([]);
  });
});

