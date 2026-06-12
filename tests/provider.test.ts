import { describe, expect, it } from "vitest";
import { MockProvider } from "../src/lib/ai/providers/mock";

describe("MockProvider", () => {
  it("returns deterministic embeddings", async () => {
    const provider = new MockProvider();
    const first = await provider.embed({ input: "volunteer policy" });
    const second = await provider.embed({ input: "volunteer policy" });

    expect(first.embedding).toEqual(second.embedding);
    expect(first.embedding).toHaveLength(128);
  });

  it("returns a chat response", async () => {
    const provider = new MockProvider();
    const response = await provider.complete({
      messages: [{ role: "user", content: "Hello" }]
    });
    expect(response.content).toContain("Mock answer");
  });
});

