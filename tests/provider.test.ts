import { afterEach, describe, expect, it, vi } from "vitest";
import { OllamaProvider } from "../src/lib/ai/providers/ollama";
import { MockProvider } from "../src/lib/ai/providers/mock";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

describe("OllamaProvider", () => {
  it("includes chat failure details from Ollama without losing model tags", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "llama-server process has terminated: signal: killed" }), {
          status: 500,
          headers: { "content-type": "application/json" }
        })
      )
    );
    const provider = new OllamaProvider({
      name: "Ollama Local",
      type: "OLLAMA",
      baseUrl: "http://ollama:11434",
      chatModel: "qwen3:30b",
      embeddingModel: "bge-m3"
    });

    await expect(provider.complete({ messages: [{ role: "user", content: "hello" }] })).rejects.toThrow(
      /Ollama chat model "qwen3:30b".*HTTP 500.*signal: killed.*memory/i
    );
  });

  it("reports embedding model failures separately from chat failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "model 'missing-embed' not found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        })
      )
    );
    const provider = new OllamaProvider({
      name: "Ollama Local",
      type: "OLLAMA",
      baseUrl: "http://ollama:11434",
      chatModel: "qwen3:30b",
      embeddingModel: "missing-embed"
    });

    await expect(provider.embed({ input: "hello" })).rejects.toThrow(
      /Ollama embedding model "missing-embed".*HTTP 404.*not found/i
    );
  });

  it("reports when a thinking model exhausts the response budget before final content", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            message: { content: "", thinking: "reasoning tokens" },
            done_reason: "length"
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" }
          }
        )
      )
    );
    const provider = new OllamaProvider({
      name: "Ollama Local",
      type: "OLLAMA",
      baseUrl: "http://ollama:11434",
      chatModel: "qwen3:30b",
      embeddingModel: "bge-m3"
    });

    await expect(provider.complete({ messages: [{ role: "user", content: "hello" }], maxTokens: 64 })).rejects.toThrow(
      /qwen3:30b.*thinking tokens.*no final answer.*num_predict \(1024\).*OLLAMA_CHAT_MIN_PREDICT/i
    );
  });
});
