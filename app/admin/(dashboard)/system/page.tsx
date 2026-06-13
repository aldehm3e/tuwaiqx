import fs from "node:fs/promises";
import { Badge, PageHeader, Panel } from "@/src/components/admin/Ui";
import { getEnv } from "@/src/lib/config/env";
import { prisma } from "@/src/lib/db/prisma";
import { getSystemHealth } from "@/src/lib/system/health";

type ChecklistItem = {
  label: string;
  detail: string;
  passed: boolean;
  severity?: "warn" | "danger";
};

async function backupScriptsReady() {
  try {
    await Promise.all([fs.access("scripts/backup.sh"), fs.access("scripts/restore.sh")]);
    return true;
  } catch {
    return false;
  }
}

function checklistTone(item: ChecklistItem) {
  if (item.passed) return "good";
  return item.severity === "danger" ? "danger" : "warn";
}

function runtimeLabel(provider: { type: string; baseUrl: string | null }) {
  const baseUrl = provider.baseUrl?.toLowerCase() || "";
  if (provider.type === "OLLAMA") return "Ollama API";
  if (baseUrl.includes("localai")) return "LocalAI runtime";
  if (baseUrl.includes(":1234")) return "LM Studio runtime";
  if (baseUrl.includes(":8080")) return "llama.cpp or LocalAI runtime";
  if (baseUrl.includes(":8000")) return "vLLM runtime";
  if (baseUrl.includes(":30000")) return "SGLang runtime";
  if (provider.type === "OPENAI_COMPATIBLE") return "OpenAI-compatible runtime";
  return provider.type;
}

export default async function SystemPage() {
  const env = getEnv();
  const [health, settings, lastJob, allowedDomainCount, providerCount, activeBotCount, indexedDocumentCount, scriptsReady] = await Promise.all([
    getSystemHealth({ includeProviders: true }),
    prisma.appSettings.findFirstOrThrow(),
    prisma.systemJob.findFirst({ orderBy: { createdAt: "desc" } }),
    prisma.allowedDomain.count(),
    prisma.modelProvider.count({ where: { isEnabled: true } }),
    prisma.bot.count({ where: { isActive: true, isArchived: false } }),
    prisma.document.count({ where: { status: "indexed", approved: true } }),
    backupScriptsReady()
  ]);
  const isLocalUrl = /localhost|127\.0\.0\.1|\[::1\]/i.test(env.APP_URL);
  const checklist: ChecklistItem[] = [
    {
      label: "AUTH_SECRET set",
      detail: "Use a long persistent secret so sessions and encrypted provider keys survive restarts.",
      passed: env.AUTH_SECRET.length >= 32,
      severity: "danger"
    },
    {
      label: "HTTPS public URL",
      detail: isLocalUrl ? "Localhost is fine for development. Use HTTPS before exposing TuwaiqX publicly." : env.APP_URL,
      passed: env.APP_URL.startsWith("https://"),
      severity: "danger"
    },
    {
      label: "Allowed widget domains",
      detail: allowedDomainCount ? `${allowedDomainCount} domain(s) configured.` : "Add production website domains in Settings before embedding.",
      passed: allowedDomainCount > 0,
      severity: "danger"
    },
    {
      label: "Model provider healthy",
      detail: health.messages.model || "Retest the default model provider.",
      passed: health.checks.model,
      severity: "danger"
    },
    {
      label: "Default chat provider",
      detail: settings.defaultChatProviderId ? "Default chat provider selected." : "Select a default chat provider in Models.",
      passed: Boolean(settings.defaultChatProviderId),
      severity: "warn"
    },
    {
      label: "Default embedding provider",
      detail: settings.defaultEmbeddingProviderId ? "Default embedding provider selected." : "Select an embedding provider before indexing knowledge.",
      passed: Boolean(settings.defaultEmbeddingProviderId),
      severity: "warn"
    },
    {
      label: "Storage writable",
      detail: health.messages.storage || "Check local or S3-compatible storage configuration.",
      passed: health.checks.storage,
      severity: "danger"
    },
    {
      label: "Database and Redis ready",
      detail: `${health.messages.database}; ${health.messages.redis}`,
      passed: health.checks.database && health.checks.redis,
      severity: "danger"
    },
    {
      label: "Active bot exists",
      detail: activeBotCount ? `${activeBotCount} active bot(s).` : "Create and activate at least one bot.",
      passed: activeBotCount > 0,
      severity: "warn"
    },
    {
      label: "Approved indexed knowledge",
      detail: indexedDocumentCount ? `${indexedDocumentCount} approved indexed document(s).` : "Upload or add knowledge and wait for indexing.",
      passed: indexedDocumentCount > 0,
      severity: "warn"
    },
    {
      label: "Backup scripts available",
      detail: scriptsReady ? "backup.sh and restore.sh are present. Test restore on a separate server." : "Expected scripts/backup.sh and scripts/restore.sh.",
      passed: scriptsReady,
      severity: "warn"
    }
  ];
  const passedCount = checklist.filter((item) => item.passed).length;

  return (
    <div className="space-y-6">
      <PageHeader title="System" description="Self-hosting status, provider health, database/storage checks, source code link, license notice, and environment warnings." />
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(health.messages).map(([key, message]) => (
            <div key={key} className="rounded-lg border border-la-line p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold capitalize">{key}</h2>
                <Badge tone={health.checks[key as keyof typeof health.checks] ? "good" : "warn"}>{health.checks[key as keyof typeof health.checks] ? "ready" : "attention"}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Model and runtime health</h2>
          <p className="text-sm leading-6 text-slate-600">
            Checks every enabled provider, including Ollama and OpenAI-compatible local runtimes.
          </p>
        </div>
        {health.providers.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {health.providers.map((provider) => (
              <div key={provider.id} className="rounded-lg border border-la-line bg-la-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{provider.name}</h3>
                  </div>
                  <Badge tone={provider.ok ? "good" : "danger"}>{provider.ok ? "healthy" : "attention"}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{provider.message}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge>{runtimeLabel(provider)}</Badge>
                  {provider.isDefaultChat ? <Badge tone="good">chat default</Badge> : null}
                  {provider.isDefaultEmbedding ? <Badge tone="good">embedding default</Badge> : null}
                  {provider.chatModel ? <Badge>{provider.chatModel}</Badge> : null}
                  {provider.embeddingModel ? <Badge>{provider.embeddingModel}</Badge> : null}
                </div>
                {provider.baseUrl ? (
                  <code className="mt-3 block max-w-full overflow-x-auto rounded bg-white px-2 py-1.5 text-xs text-slate-700">
                    {provider.baseUrl}
                  </code>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            No enabled provider records are configured yet. Add one in Models, then retest it.
          </div>
        )}
      </Panel>
      <Panel>
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Production hardening checklist</h2>
          <p className="text-sm leading-6 text-slate-600">
            {passedCount} of {checklist.length} checks are ready. Clear the danger items before exposing a production install.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {checklist.map((item) => (
            <div key={item.label} className="rounded-lg border border-la-line bg-la-surface p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">{item.label}</h2>
                <Badge tone={checklistTone(item)}>{item.passed ? "ready" : "attention"}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <dl className="grid gap-4 md:grid-cols-2">
          <div><dt className="text-xs uppercase text-slate-500">Version</dt><dd className="mt-1 font-semibold">0.1.0</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">License</dt><dd className="mt-1 font-semibold">GNU AGPL-3.0-or-later</dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Source code</dt><dd className="mt-1"><a className="text-la-green underline" href={settings.sourceCodeUrl}>{settings.sourceCodeUrl}</a></dd></div>
          <div><dt className="text-xs uppercase text-slate-500">Last job</dt><dd className="mt-1 font-semibold">{lastJob ? `${lastJob.type} ${lastJob.status}` : "No jobs yet"}</dd></div>
        </dl>
      </Panel>
    </div>
  );
}
