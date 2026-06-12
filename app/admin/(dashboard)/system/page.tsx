import { Badge, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";
import { getSystemHealth } from "@/src/lib/system/health";

export default async function SystemPage() {
  const [health, settings, lastJob] = await Promise.all([
    getSystemHealth(),
    prisma.appSettings.findFirstOrThrow(),
    prisma.systemJob.findFirst({ orderBy: { createdAt: "desc" } })
  ]);

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

