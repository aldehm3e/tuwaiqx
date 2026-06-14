import type {
  AiProvider,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelProviderConfig
} from "@/src/lib/ai/provider";

export class OpenAICompatibleProvider implements AiProvider {
  name: string;
  private baseUrl: string;
  private apiKey?: string | null;
  private chatModel: string;
  private embeddingModel: string;

  constructor(config: ModelProviderConfig) {
    this.name = config.name || "OpenAI-compatible";
    this.baseUrl = (config.baseUrl || "").replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.chatModel = config.chatModel?.trim() || "";
    this.embeddingModel = config.embeddingModel?.trim() || "";
  }

  private headers() {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {})
    };
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.baseUrl) {
      throw new Error("OpenAI-compatible base URL is not configured.");
    }
    if (!this.chatModel) {
      throw new Error("OpenAI-compatible chat model is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: this.chatModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        max_tokens: request.maxTokens ?? 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible chat failed: ${response.status}`);
    }

    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { content: data.choices?.[0]?.message?.content?.trim() || "", raw: data };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.baseUrl) {
      throw new Error("OpenAI-compatible base URL is not configured.");
    }
    if (!this.embeddingModel) {
      throw new Error("OpenAI-compatible embedding model is not configured.");
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        model: this.embeddingModel,
        input: request.input
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI-compatible embedding failed: ${response.status}`);
    }

    const data = (await response.json()) as { data?: Array<{ embedding?: number[] }> };
    const embedding = data.data?.[0]?.embedding;
    if (!embedding?.length) {
      throw new Error("OpenAI-compatible endpoint did not return an embedding.");
    }

    return { embedding, raw: data };
  }

  async healthCheck() {
    try {
      if (!this.baseUrl) {
        return { ok: false, message: "Base URL is missing" };
      }
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.headers()
      });
      return {
        ok: response.ok,
        message: response.ok ? "Provider connected" : `Provider returned ${response.status}`
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : "Provider connection failed"
      };
    }
  }
}
