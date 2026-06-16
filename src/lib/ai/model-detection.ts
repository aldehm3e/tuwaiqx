import type { ModelProviderConfig } from "@/src/lib/ai/provider";

export type DetectedModels = {
  models: string[];
  chatModels: string[];
  embeddingModels: string[];
  message: string;
};

const DETECTION_TIMEOUT_MS = 15_000;

function baseUrlOrThrow(baseUrl?: string | null) {
  const trimmed = baseUrl?.trim().replace(/\/$/, "");
  if (!trimmed) {
    throw new Error("Base URL is missing. Start the runtime and enter its API URL.");
  }
  return trimmed;
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

async function fetchJson(endpoint: string, headers?: HeadersInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DETECTION_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      headers,
      method: "GET",
      signal: controller.signal
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("Authentication failed. Check the provider API key.");
    }
    if (!response.ok) {
      throw new Error(`Provider returned HTTP ${response.status} while detecting models.`);
    }

    return (await response.json()) as unknown;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Provider unreachable. Model detection timed out. Check the base URL and runtime network.");
    }
    if (error instanceof TypeError) {
      throw new Error("Provider unreachable. Check the base URL, runtime status, and Docker networking.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractOllamaModels(data: unknown) {
  if (!data || typeof data !== "object" || !Array.isArray((data as { models?: unknown }).models)) {
    throw new Error("Unexpected response format from Ollama model detection.");
  }

  return uniqueSorted(
    (data as { models: Array<{ name?: unknown; model?: unknown }> }).models.flatMap((model) => {
      const name = typeof model.name === "string" ? model.name : "";
      const id = typeof model.model === "string" ? model.model : "";
      return [name, id];
    })
  );
}

function extractOpenAiModels(data: unknown) {
  const modelData = data && typeof data === "object" ? (data as { data?: unknown; models?: unknown }).data ?? (data as { models?: unknown }).models : undefined;
  if (!Array.isArray(modelData)) {
    throw new Error("Unexpected response format from OpenAI-compatible model detection.");
  }

  return uniqueSorted(
    modelData.flatMap((model) => {
      if (typeof model === "string") {
        return [model];
      }
      if (!model || typeof model !== "object") {
        return [];
      }
      const id = typeof (model as { id?: unknown }).id === "string" ? (model as { id: string }).id : "";
      const name = typeof (model as { name?: unknown }).name === "string" ? (model as { name: string }).name : "";
      return [id, name];
    })
  );
}

export async function detectProviderModels(config: ModelProviderConfig): Promise<DetectedModels> {
  if (config.type === "MOCK") {
    return {
      models: ["mock-chat", "mock-embedding"],
      chatModels: ["mock-chat"],
      embeddingModels: ["mock-embedding"],
      message: "Mock provider does not need model detection."
    };
  }

  if (config.type === "OLLAMA") {
    const models = extractOllamaModels(await fetchJson(`${baseUrlOrThrow(config.baseUrl)}/api/tags`));
    return {
      models,
      chatModels: models,
      embeddingModels: models,
      message: models.length ? `Detected ${models.length} Ollama model(s).` : "Ollama returned no models."
    };
  }

  const headers = {
    ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {})
  };
  const models = extractOpenAiModels(await fetchJson(`${baseUrlOrThrow(config.baseUrl)}/models`, headers));

  return {
    models,
    chatModels: models,
    embeddingModels: models,
    message: models.length ? `Detected ${models.length} model(s).` : "Provider returned no models."
  };
}
