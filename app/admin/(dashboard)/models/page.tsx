import type { ModelProvider } from "@prisma/client";
import { LocalModelUploadForm, ProviderForm } from "@/src/components/admin/Forms";
import { DeleteAction } from "@/src/components/admin/DeleteAction";
import { ProviderActions } from "@/src/components/admin/ProviderActions";
import { Badge, EmptyState, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";
import { localAiConfigKey, localAiRuntimeModelName, supportsLocalAiConfig } from "@/src/lib/models/storage";

function formatBytes(value: bigint) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) {
    return `${value.toString()} bytes`;
  }

  const units = ["bytes", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return unit === 0 ? `${size} ${units[unit]}` : `${size.toFixed(1)} ${units[unit]}`;
}

function serverModelPath(root: string, storageKey: string) {
  return `${root.replace(/\\/g, "/").replace(/\/$/, "")}/${storageKey}`;
}

function shortHash(hash: string) {
  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}

function healthTone(status: string | null) {
  if (status === "ok") return "good";
  if (status === "failed") return "danger";
  return "warn";
}

function hasLoopbackBaseUrl(value: string | null) {
  if (!value) return false;
  return /(^https?:\/\/)?(localhost|127\.0\.0\.1|\[::1\])/i.test(value);
}

function providerDiagnostics(provider: ModelProvider, settings: { defaultChatProviderId: string | null; defaultEmbeddingProviderId: string | null } | null) {
  const isDefaultChat = settings?.defaultChatProviderId === provider.id || provider.isDefaultChat;
  const isDefaultEmbedding = settings?.defaultEmbeddingProviderId === provider.id || provider.isDefaultEmbedding;
  const items: Array<{ tone: "good" | "warn" | "danger" | "neutral"; label: string }> = [];

  if (!provider.isEnabled) {
    items.push({ tone: "warn", label: "Disabled" });
  }
  if (provider.type !== "MOCK" && !provider.baseUrl) {
    items.push({ tone: "danger", label: "Base URL missing" });
  }
  if (provider.type !== "MOCK" && hasLoopbackBaseUrl(provider.baseUrl)) {
    items.push({ tone: "warn", label: "Docker URL check" });
  }
  if (isDefaultChat && !provider.chatModel) {
    items.push({ tone: "danger", label: "Chat model missing" });
  }
  if (isDefaultEmbedding && !provider.embeddingModel) {
    items.push({ tone: "danger", label: "Embedding model missing" });
  }
  if (provider.lastHealthStatus === "failed") {
    items.push({ tone: "danger", label: "Health failed" });
  } else if (!provider.lastHealthStatus) {
    items.push({ tone: "warn", label: "Not tested" });
  }
  if (!isDefaultChat && !isDefaultEmbedding) {
    items.push({ tone: "neutral", label: "Not default" });
  }

  return items.length ? items : [{ tone: "good" as const, label: "Ready" }];
}

export default async function ModelsPage() {
  const [providers, localModels, settings] = await Promise.all([
    prisma.modelProvider.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.localModelFile.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.appSettings.findFirst({
      select: {
        defaultChatProviderId: true,
        defaultEmbeddingProviderId: true
      }
    })
  ]);
  const defaultBaseUrl = process.env.OLLAMA_BASE_URL || "http://ollama:11434";
  const defaultChatModel = process.env.OLLAMA_CHAT_MODEL || "llama3.1";
  const defaultEmbeddingModel = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
  const modelStoragePath = process.env.MODEL_STORAGE_PATH || "./models";
  const localRuntimeBaseUrl = process.env.LOCAL_RUNTIME_BASE_URL || "http://localai:8080/v1";
  const defaultChatProvider = providers.find((provider) => provider.id === settings?.defaultChatProviderId || provider.isDefaultChat);
  const defaultEmbeddingProvider = providers.find((provider) => provider.id === settings?.defaultEmbeddingProviderId || provider.isDefaultEmbedding);
  const healthyProviders = providers.filter((provider) => provider.lastHealthStatus === "ok").length;
  const failedProviders = providers.filter((provider) => provider.lastHealthStatus === "failed").length;
  const untestedProviders = providers.filter((provider) => !provider.lastHealthStatus).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model providers"
        description="Connect Ollama, an external OpenAI-compatible API, or a local runtime such as LM Studio, llama.cpp, LocalAI, vLLM, or SGLang. TuwaiqX manages admin, bots, and knowledge; the runtime serves chat and embeddings."
      />
      <Panel>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Provider diagnostics</h2>
          <p className="text-sm leading-6 text-slate-600">Use this before uploading knowledge or testing bots. Chat and embeddings can use different providers, but both need reachable runtimes and exact model names.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Default chat</div>
            <div className="mt-2 font-semibold">{defaultChatProvider?.name || "Not selected"}</div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{defaultChatProvider?.chatModel || "Choose a provider and chat model."}</p>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Default embeddings</div>
            <div className="mt-2 font-semibold">{defaultEmbeddingProvider?.name || "Not selected"}</div>
            <p className="mt-1 text-xs leading-5 text-slate-600">{defaultEmbeddingProvider?.embeddingModel || "Choose an embedding provider before indexing."}</p>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Health state</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone={healthyProviders ? "good" : "neutral"}>{healthyProviders} healthy</Badge>
              <Badge tone={failedProviders ? "danger" : "neutral"}>{failedProviders} failed</Badge>
              <Badge tone={untestedProviders ? "warn" : "neutral"}>{untestedProviders} untested</Badge>
            </div>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Docker URL hint</div>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              Docker-to-host runtimes should use <code className="rounded bg-white px-1 py-0.5">host.docker.internal</code>. Docker services should use their service name.
            </p>
          </div>
        </div>
      </Panel>
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-la-line">
                  <th className="py-3 pr-3">Name</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Base URL</th>
                  <th className="py-3 pr-3">Models</th>
                  <th className="py-3 pr-3">Defaults</th>
                  <th className="py-3 pr-3">Health</th>
                  <th className="py-3 pr-3">Diagnostics</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3 font-medium">{provider.name}</td>
                    <td className="py-3 pr-3">{provider.type}</td>
                    <td className="py-3 pr-3 text-xs text-slate-600">{provider.baseUrl || "none"}</td>
                    <td className="py-3 pr-3 text-slate-600">
                      {provider.chatModel || "chat"} / {provider.embeddingModel || "embedding"}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-2">
                        {settings?.defaultChatProviderId === provider.id ? <Badge tone="good">chat</Badge> : null}
                        {settings?.defaultEmbeddingProviderId === provider.id ? <Badge tone="good">embed</Badge> : null}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <Badge tone={healthTone(provider.lastHealthStatus)}>{provider.lastHealthStatus || "not tested"}</Badge>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex max-w-xs flex-wrap gap-2">
                        {providerDiagnostics(provider, settings).map((item) => (
                          <Badge key={`${provider.id}-${item.label}`} tone={item.tone}>{item.label}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <ProviderActions id={provider.id} name={provider.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Add provider</h2>
          <div className="mb-4 rounded-md border border-la-line bg-la-surface p-3 text-sm leading-6 text-slate-600">
            Start the model runtime first, then add its API URL here. For local Windows runtimes, use the OpenAI-compatible API/runtime type and a base URL ending in
            <code className="rounded bg-white px-1 py-0.5">/v1</code>.
          </div>
          <ProviderForm
            defaultBaseUrl={defaultBaseUrl}
            defaultChatModel={defaultChatModel}
            defaultEmbeddingModel={defaultEmbeddingModel}
          />
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <Panel>
          <div className="mb-4 flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Uploaded local model files</h2>
            <p className="text-sm leading-6 text-slate-600">
              Stored under <code className="rounded bg-la-surface px-1 py-0.5">{modelStoragePath}</code> for local runtimes that load model files from disk. Uploading stores
              files only; it does not download or start a model server.
            </p>
          </div>
          {localModels.length === 0 ? (
            <EmptyState title="No local model files" body="Upload chat or embedding model files only when a separate local runtime will load them from the server filesystem." />
          ) : (
            <div className="divide-y divide-la-line">
              {localModels.map((model) => (
                <div key={model.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink">{model.name}</h3>
                        <Badge>{model.kind}</Badge>
                        <Badge tone={model.status === "ready" ? "good" : "neutral"}>{model.status}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        {model.filename}
                        <span className="text-xs uppercase text-slate-500"> - {model.format} - {formatBytes(model.sizeBytes)}</span>
                      </div>
                      {model.runtimeHint ? <div className="mt-1 text-xs text-slate-500">{model.runtimeHint}</div> : null}
                      <code className="mt-3 block max-w-full overflow-x-auto rounded-md bg-la-surface px-2 py-1.5 text-xs text-slate-700">
                        {serverModelPath(modelStoragePath, model.storageKey)}
                      </code>
                      {supportsLocalAiConfig(model.format) ? (
                        <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                          <div>
                            <span className="block font-medium text-ink">LocalAI model</span>
                            <code className="mt-1 block overflow-x-auto rounded bg-la-surface px-2 py-1 text-slate-700">
                              {localAiRuntimeModelName({ id: model.id, kind: model.kind })}
                            </code>
                          </div>
                          <div>
                            <span className="block font-medium text-ink">LocalAI config</span>
                            <code className="mt-1 block overflow-x-auto rounded bg-la-surface px-2 py-1 text-slate-700">
                              {serverModelPath(modelStoragePath, localAiConfigKey(model.id))}
                            </code>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2 text-xs text-slate-500" title={model.sha256}>
                        SHA-256 {shortHash(model.sha256)}
                      </div>
                    </div>
                    <DeleteAction
                      action={`/api/admin/model-files/${model.id}`}
                      confirmMessage={`Delete ${model.name}? The model file will be removed from server storage.`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Upload local model</h2>
          <div className="mb-4 rounded-md border border-la-line bg-la-surface p-3 text-sm leading-6 text-slate-600">
            This stores model files for a separately managed runtime. For Docker LocalAI, start
            <code className="rounded bg-white px-1 py-0.5">docker compose --profile local-models up -d</code>, then add an OpenAI-compatible/runtime provider at
            <code className="rounded bg-white px-1 py-0.5">{localRuntimeBaseUrl}</code>. For LM Studio or llama.cpp on Windows, add their local
            <code className="rounded bg-white px-1 py-0.5">/v1</code> API instead.
          </div>
          <LocalModelUploadForm />
        </Panel>
      </div>
    </div>
  );
}
