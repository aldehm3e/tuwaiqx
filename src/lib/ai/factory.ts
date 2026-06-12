import type { ModelProvider, ProviderType } from "@prisma/client";
import { getEnv } from "@/src/lib/config/env";
import type { AiProvider, ModelProviderConfig } from "@/src/lib/ai/provider";
import { MockProvider } from "@/src/lib/ai/providers/mock";
import { OllamaProvider } from "@/src/lib/ai/providers/ollama";
import { OpenAICompatibleProvider } from "@/src/lib/ai/providers/openai-compatible";
import { decryptSecret } from "@/src/lib/security/secrets";

export function createProvider(config: ModelProviderConfig): AiProvider {
  if (config.type === "OLLAMA") {
    return new OllamaProvider(config);
  }
  if (config.type === "OPENAI_COMPATIBLE") {
    return new OpenAICompatibleProvider(config);
  }
  return new MockProvider(config);
}

export function providerFromDb(provider: ModelProvider | null | undefined): AiProvider {
  if (!provider) {
    return defaultProviderFromEnv();
  }

  return createProvider({
    id: provider.id,
    name: provider.name,
    type: provider.type,
    baseUrl: provider.baseUrl,
    apiKey: decryptSecret(provider.apiKeyCiphertext),
    chatModel: provider.chatModel,
    embeddingModel: provider.embeddingModel
  });
}

export function defaultProviderFromEnv(): AiProvider {
  const env = getEnv();
  const typeMap: Record<string, ProviderType> = {
    ollama: "OLLAMA",
    "openai-compatible": "OPENAI_COMPATIBLE",
    mock: "MOCK"
  };
  const type = typeMap[env.DEFAULT_MODEL_PROVIDER] || "OLLAMA";
  if (type === "OPENAI_COMPATIBLE") {
    return new OpenAICompatibleProvider({
      name: "OpenAI-compatible",
      type,
      baseUrl: env.OPENAI_COMPATIBLE_BASE_URL,
      apiKey: env.OPENAI_COMPATIBLE_API_KEY,
      chatModel: env.OPENAI_COMPATIBLE_CHAT_MODEL,
      embeddingModel: env.OPENAI_COMPATIBLE_EMBEDDING_MODEL
    });
  }
  if (type === "MOCK") {
    return new MockProvider({ name: "Mock", type });
  }
  return new OllamaProvider({
    name: "Ollama",
    type,
    baseUrl: env.OLLAMA_BASE_URL,
    chatModel: env.OLLAMA_CHAT_MODEL,
    embeddingModel: env.OLLAMA_EMBEDDING_MODEL
  });
}
