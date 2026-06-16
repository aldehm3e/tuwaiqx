"use client";

import { useRef, useState } from "react";
import { CopyButton } from "@/src/components/admin/CopyButton";
import { Field, inputClass, secondaryButtonClass } from "@/src/components/admin/Ui";

type ProviderType = "OLLAMA" | "OPENAI_COMPATIBLE" | "MOCK";

type DetectionResponse = {
  message?: string;
  error?: string;
  models?: string[];
  chatModels?: string[];
  embeddingModels?: string[];
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

function responseErrorMessage(data: DetectionResponse) {
  const fieldErrors = data.details?.fieldErrors
    ? Object.entries(data.details.fieldErrors)
        .flatMap(([field, errors]) => (errors || []).map((error) => `${field}: ${error}`))
    : [];
  const details = [...(data.details?.formErrors || []), ...fieldErrors];
  return details.length ? details.join(" ") : data.error || "Model detection failed.";
}

function uniqueModels(data: DetectionResponse) {
  return Array.from(new Set([...(data.chatModels || []), ...(data.embeddingModels || []), ...(data.models || [])].filter(Boolean)));
}

export function ProviderModelFields({
  defaultName = "Ollama Local",
  defaultType = "OLLAMA",
  defaultBaseUrl = "http://ollama:11434",
  defaultChatModel = "",
  defaultEmbeddingModel = "",
  defaultIsEnabled = true,
  defaultIsDefaultChat = true,
  defaultIsDefaultEmbedding = true,
  savedProviderId,
  apiKeyHint = "Leave empty for local runtimes unless the runtime requires a key.",
  showEnabled = false
}: {
  defaultName?: string;
  defaultType?: ProviderType;
  defaultBaseUrl?: string | null;
  defaultChatModel?: string | null;
  defaultEmbeddingModel?: string | null;
  defaultIsEnabled?: boolean;
  defaultIsDefaultChat?: boolean;
  defaultIsDefaultEmbedding?: boolean;
  savedProviderId?: string;
  apiKeyHint?: string;
  showEnabled?: boolean;
}) {
  const typeRef = useRef<HTMLSelectElement>(null);
  const baseUrlRef = useRef<HTMLInputElement>(null);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const chatModelRef = useRef<HTMLInputElement>(null);
  const embeddingModelRef = useRef<HTMLInputElement>(null);
  const [detecting, setDetecting] = useState(false);
  const [detection, setDetection] = useState<DetectionResponse | null>(null);
  const detectedModels = detection ? uniqueModels(detection) : [];

  async function detectModels() {
    setDetecting(true);
    setDetection(null);
    const response = await fetch("/api/admin/providers/detect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        providerId: savedProviderId,
        type: typeRef.current?.value || defaultType,
        baseUrl: baseUrlRef.current?.value || "",
        apiKey: apiKeyRef.current?.value || ""
      })
    });
    const data = (await response.json().catch(() => ({}))) as DetectionResponse;
    setDetecting(false);

    if (!response.ok) {
      setDetection({ error: responseErrorMessage(data) });
      return;
    }

    setDetection(data);
  }

  function applyModel(ref: { current: HTMLInputElement | null }, model: string) {
    if (ref.current) {
      ref.current.value = model;
      ref.current.focus();
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input className={inputClass} name="name" required defaultValue={defaultName} />
        </Field>
        <Field label="Provider type" hint="A provider is the runtime or API that serves chat and/or embeddings. Use OpenAI-compatible for LocalAI, LM Studio, llama.cpp, vLLM, or SGLang.">
          <select ref={typeRef} className={inputClass} name="type" defaultValue={defaultType}>
            <option value="OLLAMA">Ollama API</option>
            <option value="OPENAI_COMPATIBLE">OpenAI-compatible API/runtime</option>
            <option value="MOCK">Mock</option>
          </select>
        </Field>
        <Field label="Base URL" hint="The runtime is the process that loads and runs model weights. Use Docker service names inside Docker, or host.docker.internal for host runtimes.">
          <input ref={baseUrlRef} className={inputClass} name="baseUrl" defaultValue={defaultBaseUrl || ""} />
        </Field>
        <Field label="API key" hint={apiKeyHint}>
          <input ref={apiKeyRef} className={inputClass} name="apiKey" type="password" autoComplete="off" />
        </Field>
        <Field label="Chat model" hint="Generates the final assistant answer. Use the exact chat model name reported by the selected runtime.">
          <input ref={chatModelRef} className={inputClass} name="chatModel" defaultValue={defaultChatModel || ""} placeholder="runtime chat model name" />
        </Field>
        <Field label="Embedding model" hint="Converts text into vectors for knowledge search. Re-index knowledge after changing it.">
          <input ref={embeddingModelRef} className={inputClass} name="embeddingModel" defaultValue={defaultEmbeddingModel || ""} placeholder="runtime embedding model name" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {showEnabled ? (
          <label className="flex items-center gap-2" title="Disabled providers stay saved but cannot be set as defaults.">
            <input name="isEnabled" value="true" type="checkbox" defaultChecked={defaultIsEnabled} />
            Enabled
          </label>
        ) : null}
        <label className="flex items-center gap-2" title="Use this provider for assistant answers by default.">
          <input name="isDefaultChat" value="true" type="checkbox" defaultChecked={defaultIsDefaultChat} />
          Default chat
        </label>
        <label className="flex items-center gap-2" title="Use this provider for knowledge embeddings by default.">
          <input name="isDefaultEmbedding" value="true" type="checkbox" defaultChecked={defaultIsDefaultEmbedding} />
          Default embeddings
        </label>
      </div>
      <div className="rounded-md border border-la-line bg-la-surface p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Model detection</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">Detect available model names from the current provider fields.</p>
          </div>
          <button className={secondaryButtonClass} disabled={detecting} type="button" onClick={() => void detectModels()}>
            {detecting ? "Detecting..." : "Detect models"}
          </button>
        </div>
        {detection?.error ? <p className="mt-3 text-sm text-red-600">{detection.error}</p> : null}
        {detection?.message && !detection.error ? <p className="mt-3 text-sm text-la-green">{detection.message}</p> : null}
        {detectedModels.length ? (
          <div className="mt-3 grid gap-2">
            {detectedModels.map((model) => (
              <div key={model} className="flex flex-wrap items-center gap-2 rounded-md border border-la-line bg-white px-2 py-2">
                <code className="min-w-0 flex-1 break-all text-xs text-slate-700">{model}</code>
                <CopyButton text={model} />
                <button className="rounded-md border border-la-line px-2 py-1 text-xs font-semibold hover:bg-la-surface" type="button" onClick={() => applyModel(chatModelRef, model)}>
                  Use as chat
                </button>
                <button className="rounded-md border border-la-line px-2 py-1 text-xs font-semibold hover:bg-la-surface" type="button" onClick={() => applyModel(embeddingModelRef, model)}>
                  Use as embedding
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
