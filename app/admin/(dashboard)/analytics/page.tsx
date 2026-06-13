import Link from "next/link";
import { Badge, EmptyState, PageHeader, Panel, StatCard } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

function preview(value: string, maxLength = 180) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}

export default async function AnalyticsPage() {
  const [conversations, messages, feedbackHelpful, feedbackNotHelpful, gaps, tickets, bots, feedbackMessages] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.message.count({ where: { feedback: "helpful" } }),
    prisma.message.count({ where: { feedback: "not_helpful" } }),
    prisma.knowledgeGap.count({ where: { resolved: false } }),
    prisma.ticket.count(),
    prisma.bot.findMany({ include: { _count: { select: { conversations: true } } }, orderBy: { name: "asc" } }),
    prisma.message.findMany({
      where: { feedback: { in: ["helpful", "not_helpful"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        conversation: {
          include: {
            bot: true
          }
        }
      }
    })
  ]);
  const feedbackQuestions = await Promise.all(
    feedbackMessages.map((message) =>
      prisma.message.findFirst({
        where: {
          conversationId: message.conversationId,
          role: "user",
          createdAt: { lt: message.createdAt }
        },
        orderBy: { createdAt: "desc" },
        select: { content: true }
      })
    )
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" />
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
      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Recent feedback</h2>
        {feedbackMessages.length === 0 ? (
          <EmptyState title="No feedback yet" body="Visitor helpful and not helpful votes will appear here after they rate bot answers." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-la-line">
                  <th className="py-3 pr-3">Rating</th>
                  <th className="py-3 pr-3">Bot</th>
                  <th className="py-3 pr-3">Question</th>
                  <th className="py-3 pr-3">Answer</th>
                  <th className="py-3 pr-3">Conversation</th>
                </tr>
              </thead>
              <tbody>
                {feedbackMessages.map((message, index) => (
                  <tr key={message.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3">
                      <Badge tone={message.feedback === "helpful" ? "good" : "warn"}>
                        {message.feedback === "helpful" ? "Helpful" : "Not helpful"}
                      </Badge>
                      <div className="mt-1 text-xs text-slate-500">{message.createdAt.toLocaleString()}</div>
                    </td>
                    <td className="py-3 pr-3">{message.conversation.bot.name}</td>
                    <td className="max-w-xs py-3 pr-3 text-slate-700">{preview(feedbackQuestions[index]?.content || "No prior user question")}</td>
                    <td className="max-w-sm py-3 pr-3 text-slate-700">{preview(message.content)}</td>
                    <td className="py-3 pr-3">
                      <Link className="font-medium text-la-green hover:underline" href={`/admin/conversations/${message.conversationId}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
