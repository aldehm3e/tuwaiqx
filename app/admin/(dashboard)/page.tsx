import Link from "next/link";
import { BotTester } from "@/src/components/admin/BotTester";
import { Badge, EmptyState, PageHeader, Panel, StatCard, buttonClass, secondaryButtonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";
import { getSystemHealth } from "@/src/lib/system/health";

export default async function DashboardPage() {
  const [bots, documents, conversations, tickets, gaps, recentJobs, health] = await Promise.all([
    prisma.bot.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.document.findMany({ orderBy: { updatedAt: "desc" }, take: 8, include: { bot: true } }),
    prisma.conversation.count(),
    prisma.ticket.count({ where: { status: { in: ["open", "pending"] } } }),
    prisma.knowledgeGap.count({ where: { resolved: false } }),
    prisma.systemJob.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    getSystemHealth()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Manage the local bot system, knowledge indexing, model health, conversations, and handoff work from one self-hosted installation."
        action={
          <>
            <Link className={secondaryButtonClass} href="/admin/knowledge/upload">
              Upload documents
            </Link>
            <Link className={buttonClass} href="/admin/bots/new">
              Create bot
            </Link>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Bots" value={bots.length} tone="good" />
        <StatCard label="Documents" value={await prisma.document.count()} />
        <StatCard label="Conversations" value={conversations} />
        <StatCard label="Open tickets" value={tickets} tone={tickets > 0 ? "warn" : "neutral"} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <Panel>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Knowledge indexing</h2>
              <p className="text-sm text-slate-500">Recent uploads, parser state, and vector/full-text readiness.</p>
            </div>
            <Link className={secondaryButtonClass} href="/admin/knowledge">
              Open knowledge
            </Link>
          </div>
          {documents.length === 0 ? (
            <EmptyState title="No knowledge yet" body="Upload files or create manual knowledge entries to start answering with sources." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr className="border-b border-la-line">
                    <th className="py-3 pr-3">Title</th>
                    <th className="py-3 pr-3">Bot</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((document) => (
                    <tr key={document.id} className="border-b border-la-line last:border-0">
                      <td className="py-3 pr-3 font-medium">{document.title}</td>
                      <td className="py-3 pr-3 text-slate-600">{document.bot?.name || "All bots"}</td>
                      <td className="py-3 pr-3">
                        <Badge tone={document.status === "indexed" ? "good" : document.status === "failed" ? "danger" : "warn"}>
                          {document.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-3 text-slate-500">{document.updatedAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Test bot</h2>
            <p className="text-sm text-slate-500">Ask against indexed, approved knowledge and inspect returned sources.</p>
          </div>
          {bots.length ? <BotTester bots={bots.map((bot) => ({ id: bot.id, slug: bot.slug, name: bot.name }))} /> : <EmptyState title="Create a bot first" body="A bot connects model settings, prompts, knowledge, and the embeddable widget." />}
        </Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">System health</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(health.messages).map(([key, message]) => (
              <div key={key} className="rounded-md border border-la-line bg-la-surface p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold capitalize">{key}</span>
                  <Badge tone={health.checks[key as keyof typeof health.checks] ? "good" : "warn"}>
                    {health.checks[key as keyof typeof health.checks] ? "ready" : "check"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-600">{message}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Operational queue</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Unresolved knowledge gaps</span>
              <Badge tone={gaps > 0 ? "warn" : "good"}>{gaps}</Badge>
            </div>
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-md border border-la-line px-3 py-2">
                <span>{job.type}</span>
                <Badge tone={job.status === "succeeded" ? "good" : job.status === "failed" ? "danger" : "warn"}>{job.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

