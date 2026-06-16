"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CopyButton } from "@/src/components/admin/CopyButton";
import { ProviderModelFields } from "@/src/components/admin/ProviderModelFields";
import { SmartForm } from "@/src/components/admin/SmartForm";

type ProviderType = "OLLAMA" | "OPENAI_COMPATIBLE" | "MOCK";

type ActionResponse = {
  error?: string;
  message?: string;
  latencyMs?: number;
  provider?: string;
  model?: string | null;
  textPreview?: string;
  dimension?: number;
  models?: string[];
  chatModels?: string[];
  embeddingModels?: string[];
};

type ProviderAction = "health" | "testChat" | "testEmbedding" | "detectModels" | "enable" | "disable" | "setDefaultChat" | "setDefaultEmbedding";

const actionButtonClass =
  "rounded-md border border-la-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-la-surface disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

function detectedModels(data: ActionResponse) {
  return Array.from(new Set([...(data.chatModels || []), ...(data.embeddingModels || []), ...(data.models || [])].filter(Boolean)));
}

function actionMessage(action: ProviderAction, data: ActionResponse) {
  if (action === "testChat") {
    return `${data.message || "Chat test complete."} ${data.model || "model"} in ${data.latencyMs ?? "?"}ms${data.textPreview ? `: ${data.textPreview}` : ""}`;
  }
  if (action === "testEmbedding") {
    return `${data.message || "Embedding test complete."} ${data.model || "model"} returned ${data.dimension ?? "?"} dimensions in ${data.latencyMs ?? "?"}ms.`;
  }
  if (action === "health") {
    return `${data.message || "Health checked."}${typeof data.latencyMs === "number" ? ` (${data.latencyMs}ms)` : ""}`;
  }
  return data.message || "Done.";
}

export function ProviderActions({
  id,
  name,
  type,
  baseUrl,
  chatModel,
  embeddingModel,
  isEnabled,
  isDefaultChat,
  isDefaultEmbedding
}: {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl: string | null;
  chatModel: string | null;
  embeddingModel: string | null;
  isEnabled: boolean;
  isDefaultChat: boolean;
  isDefaultEmbedding: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<ProviderAction | "delete" | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState<string[]>([]);

  async function runAction(action: ProviderAction) {
    setLoading(action);
    setMessage("");
    setError("");
    if (action !== "detectModels") {
      setModels([]);
    }
    const response = await fetch(`/api/admin/providers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = (await response.json().catch(() => ({}))) as ActionResponse;
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Provider action failed.");
      return;
    }

    if (action === "detectModels") {
      setModels(detectedModels(data));
    }

    setMessage(actionMessage(action, data));
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete ${name}? Bots using this provider will fall back to the installation default.`)) {
      return;
    }

    setLoading("delete");
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/providers/${id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setLoading(null);

    if (!response.ok) {
      setError(data.error || "Delete failed.");
      return;
    }

    router.refresh();
  }

  const disableBlocked = isEnabled && (isDefaultChat || isDefaultEmbedding);

  return (
    <div className="min-w-[18rem]">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={actionButtonClass}
          disabled={loading !== null}
          type="button"
          onClick={() => void runAction("health")}
        >
          {loading === "health" ? "Testing..." : "Retest"}
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null || !chatModel}
          title={chatModel ? "Send a short chat prompt to this provider." : "Add a chat model before testing chat."}
          type="button"
          onClick={() => void runAction("testChat")}
        >
          {loading === "testChat" ? "Testing..." : "Test chat"}
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null || !embeddingModel}
          title={embeddingModel ? "Generate a small embedding with this provider." : "Add an embedding model before testing embeddings."}
          type="button"
          onClick={() => void runAction("testEmbedding")}
        >
          {loading === "testEmbedding" ? "Testing..." : "Test embedding"}
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null}
          type="button"
          onClick={() => void runAction("detectModels")}
        >
          {loading === "detectModels" ? "Detecting..." : "Detect models"}
        </button>
        <button className={actionButtonClass} disabled={loading !== null} type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null || disableBlocked}
          title={disableBlocked ? "Default providers cannot be disabled. Set another provider as default first." : undefined}
          type="button"
          onClick={() => void runAction(isEnabled ? "disable" : "enable")}
        >
          {loading === "disable" || loading === "enable" ? "Saving..." : isEnabled ? "Disable" : "Enable"}
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null || !isEnabled || isDefaultChat}
          title={!isEnabled ? "Enable this provider before setting it as default." : undefined}
          type="button"
          onClick={() => void runAction("setDefaultChat")}
        >
          Set chat default
        </button>
        <button
          className={actionButtonClass}
          disabled={loading !== null || !isEnabled || isDefaultEmbedding}
          title={!isEnabled ? "Enable this provider before setting it as default." : undefined}
          type="button"
          onClick={() => void runAction("setDefaultEmbedding")}
        >
          Set embedding default
        </button>
        <button
          className={dangerButtonClass}
          disabled={loading !== null}
          type="button"
          onClick={() => void remove()}
        >
          {loading === "delete" ? "Deleting..." : "Delete"}
        </button>
      </div>
      {models.length ? (
        <div className="mt-2 grid gap-1 rounded-md border border-la-line bg-la-surface p-2">
          {models.map((model) => (
            <div key={model} className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 break-all text-xs text-slate-700">{model}</code>
              <CopyButton text={model} />
            </div>
          ))}
        </div>
      ) : null}
      {message ? <div className="mt-2 text-xs leading-5 text-la-green">{message}</div> : null}
      {error ? <div className="mt-2 text-xs leading-5 text-red-600">{error}</div> : null}
      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-label={`Edit ${name}`}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Edit provider</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">API keys are not displayed. Leave the key blank to keep the existing encrypted value.</p>
              </div>
              <button className={actionButtonClass} type="button" onClick={() => setEditing(false)}>
                Close
              </button>
            </div>
            <SmartForm action={`/api/admin/providers/${id}`} method="PUT" submitLabel="Save changes" className="space-y-4">
              <ProviderModelFields
                apiKeyHint="Leave blank to keep the existing encrypted key. Enter a new key to rotate it."
                defaultBaseUrl={baseUrl || ""}
                defaultChatModel={chatModel || ""}
                defaultEmbeddingModel={embeddingModel || ""}
                defaultIsDefaultChat={isDefaultChat}
                defaultIsDefaultEmbedding={isDefaultEmbedding}
                defaultIsEnabled={isEnabled}
                defaultName={name}
                defaultType={type}
                savedProviderId={id}
                showEnabled
              />
            </SmartForm>
          </div>
        </div>
      ) : null}
    </div>
  );
}
