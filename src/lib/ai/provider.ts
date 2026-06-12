export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatCompletionResponse = {
  content: string;
  raw?: unknown;
};

export type EmbeddingRequest = {
  input: string;
};

export type EmbeddingResponse = {
  embedding: number[];
  raw?: unknown;
};

export type ModelProviderConfig = {
  id?: string;
  name: string;
  type: "OLLAMA" | "OPENAI_COMPATIBLE" | "MOCK";
  baseUrl?: string | null;
  apiKey?: string | null;
  chatModel?: string | null;
  embeddingModel?: string | null;
};

export interface ChatProvider {
  name: string;
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}

export interface EmbeddingProvider {
  name: string;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}

export type AiProvider = ChatProvider & EmbeddingProvider;

