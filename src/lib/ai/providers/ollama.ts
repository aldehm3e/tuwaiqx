import type {
  AiProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelProviderConfig
} from "@/src/lib/ai/provider";

export class OllamaProvider implements AiProvider {
  name: string;
  private baseUrl: string;
  private chatModel: string;
  private embeddingModel: string;

  constructor(config: ModelProviderConfig) {
    this.name = config.name || "Ollama";
    this.baseUrl = (config.baseUrl || "http://localhost:11434").replace(/\/$/, "");
    this.chatModel = config.chatModel || "llama3.1";
    this.embeddingModel = config.embeddingModel || "nomic-embed-text";
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.chatModel,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.2,
          think: false,
          num_predict: Math.max(request.maxTokens ?? 800, 512)
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama chat failed: ${response.status}`);
    }

    const data = (await response.json()) as { message?: { content?: string } };
    return { content: data.message?.content?.trim() || "", raw: data };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: this.embeddingModel,
        prompt: request.input
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.status}`);
    }

    const data = (await response.json()) as { embedding?: number[] };
    if (!data.embedding?.length) {
      throw new Error("Ollama did not return an embedding.");
    }

    return { embedding: data.embedding, raw: data };
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, { method: "GET" });
      return {
        ok: response.ok,
        message: response.ok ? "Ollama connected" : `Ollama returned ${response.status}`
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Ollama connection failed"
      };
    }
  }
}
