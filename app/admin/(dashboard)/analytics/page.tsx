import { PageHeader, Panel, StatCard } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function AnalyticsPage() {
  const [conversations, messages, feedbackHelpful, feedbackNotHelpful, gaps, tickets, bots] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.count({ where: { feedback: "helpful" } }),
    prisma.message.count({ where: { feedback: "not_helpful" } }),
    prisma.knowledgeGap.count({ where: { resolved: false } }),
    prisma.ticket.count(),
    prisma.bot.findMany({ include: { _count: { select: { conversations: true } } }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Local analytics stored in your database. No external analytics dependency." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total conversations" value={conversations} />
        <StatCard label="Messages" value={messages} />
        <StatCard label="Knowledge gaps" value={gaps} tone={gaps ? "warn" : "good"} />
        <StatCard label="Tickets" value={tickets} />
      </div>
      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Conversations by bot</h2>
        <div className="space-y-2">
          {bots.map((bot) => (
            <div key={bot.id} className="flex items-center justify-between rounded-md border border-la-line p-3 text-sm">
              <span>{bot.name}</span>
              <span className="font-semibold">{bot._count.conversations}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Feedback</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Helpful" value={feedbackHelpful} tone="good" />
          <StatCard label="Not helpful" value={feedbackNotHelpful} tone="warn" />
        </div>
      </Panel>
    </div>
  );
}

