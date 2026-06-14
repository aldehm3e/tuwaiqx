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
    this.chatModel = config.chatModel?.trim() || "";
    this.embeddingModel = config.embeddingModel?.trim() || "";
  }

  private timeoutMs(operation: "chat" | "embedding") {
    const envKey = operation === "chat" ? "OLLAMA_CHAT_TIMEOUT_MS" : "OLLAMA_EMBEDDING_TIMEOUT_MS";
    const fallback = operation === "chat" ? 360_000 : 120_000;
    const configured = Number(process.env[envKey]);
    return Number.isFinite(configured) && configured > 0 ? configured : fallback;
  }

  private chatMinPredict() {
    const configured = Number(process.env.OLLAMA_CHAT_MIN_PREDICT);
    return Number.isFinite(configured) && configured > 0 ? configured : 1024;
  }

  private async fetchJson(
    operation: "chat" | "embedding",
    endpoint: string,
    model: string,
    body: Record<string, unknown>
  ) {
    const timeoutMs = this.timeoutMs(operation);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const responseBody = await response.text();

      if (!response.ok) {
        throw this.ollamaError({
          operation,
          endpoint,
          model,
          status: response.status,
          body: responseBody
        });
      }

      return responseBody ? JSON.parse(responseBody) : {};
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.ollamaError({
          operation,
          endpoint,
          model,
          timeoutMs
        });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private ollamaError(input: {
    operation: "chat" | "embedding";
    endpoint: string;
    model: string;
    status?: number;
    body?: string;
    timeoutMs?: number;
  }) {
    const body = summarizeBody(input.body);
    const operationLabel = input.operation === "chat" ? "chat model" : "embedding model";
    const statusText = input.status ? `HTTP ${input.status}` : `timeout after ${input.timeoutMs}ms`;
    const details = body ? `: ${body}` : ".";
    const killed = /signal:\s*killed|process has terminated/i.test(body);
    const notFound = /not found|pull model|model.*missing/i.test(body);
    const timeout = Boolean(input.timeoutMs);
    const recommendation = killed
      ? " Ollama killed the model runner while loading or generating; this usually means Docker/Ollama does not have enough memory for this chat model. Increase Docker Desktop memory, use GPU support, or switch to a smaller chat model."
      : notFound
        ? " Pull the model in the Ollama container or correct the model name, including its tag."
        : timeout
          ? " Increase OLLAMA_CHAT_TIMEOUT_MS or OLLAMA_EMBEDDING_TIMEOUT_MS for slow local models, or use a smaller model."
          : "";

    const message = `Ollama ${operationLabel} "${input.model}" failed at ${input.endpoint} with ${statusText}${details}${recommendation}`;
    console.error("Ollama provider failure", {
      provider: this.name,
      operation: input.operation,
      endpoint: input.endpoint,
      model: input.model,
      status: input.status ?? null,
      timeoutMs: input.timeoutMs ?? null,
      responseBody: body || null
    });
    return new Error(message);
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const endpoint = `${this.baseUrl}/api/chat`;
    if (!this.chatModel) {
      throw new Error("Ollama chat model is not configured. Set a chat model in the provider settings or OLLAMA_CHAT_MODEL.");
    }

    const numPredict = Math.max(request.maxTokens ?? 800, this.chatMinPredict());
    const data = (await this.fetchJson("chat", endpoint, this.chatModel, {
      model: this.chatModel,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: numPredict
      }
    })) as { message?: { content?: string; thinking?: string }; done_reason?: string };
    const content = data.message?.content?.trim() || "";

    if (!content && data.message?.thinking && data.done_reason === "length") {
      const message = `Ollama chat model "${this.chatModel}" returned thinking tokens but no final answer because num_predict (${numPredict}) was exhausted. Increase OLLAMA_CHAT_MIN_PREDICT, increase the bot max answer length, or use a non-thinking/smaller chat model.`;
      console.error("Ollama chat returned no final content", {
        provider: this.name,
        endpoint,
        model: this.chatModel,
        doneReason: data.done_reason,
        numPredict,
        hasThinking: true
      });
      throw new Error(message);
    }

    return { content, raw: data };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const endpoint = `${this.baseUrl}/api/embeddings`;
    if (!this.embeddingModel) {
      throw new Error("Ollama embedding model is not configured. Set an embedding model in the provider settings or OLLAMA_EMBEDDING_MODEL.");
    }

    const data = (await this.fetchJson("embedding", endpoint, this.embeddingModel, {
      model: this.embeddingModel,
      prompt: request.input
    })) as { embedding?: number[] };
    if (!data.embedding?.length) {
      throw new Error(`Ollama embedding model "${this.embeddingModel}" did not return an embedding.`);
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

function summarizeBody(body?: string) {
  if (!body) {
    return "";
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown; message?: unknown };
    const parsedMessage = parsed.error || parsed.message;
    if (typeof parsedMessage === "string") {
      return parsedMessage.slice(0, 1200);
    }
  } catch {
    // Fall through to the plain response body.
  }

  return body.replace(/\s+/g, " ").trim().slice(0, 1200);
}
