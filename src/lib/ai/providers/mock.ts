import type {
  AiProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelProviderConfig
} from "@/src/lib/ai/provider";

function hashText(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export class MockProvider implements AiProvider {
  name: string;

  constructor(config: ModelProviderConfig = { name: "Mock", type: "MOCK" }) {
    this.name = config.name;
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const userMessage = [...request.messages].reverse().find((message) => message.role === "user");
    return {
      content: `Mock answer: ${userMessage?.content.slice(0, 220) || "No question was provided."}`
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const vector = Array.from({ length: 128 }, (_, index) => {
      const seed = hashText(`${request.input}:${index}`);
      return (seed % 10_000) / 10_000;
    });
    return { embedding: vector };
  }

  async healthCheck() {
    return { ok: true, message: "Mock provider ready" };
  }
}

