import Link from "next/link";
import { Badge, EmptyState, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function ConversationsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { bot: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Conversations" description="Review visitor conversations, sources, feedback, unanswered questions, exports, and retention-sensitive data." />
      <Panel>
        {conversations.length === 0 ? <EmptyState title="No conversations yet" body="Widget and admin test chats will appear here after users ask questions." /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr className="border-b border-la-line"><th className="py-3 pr-3">Conversation</th><th className="py-3 pr-3">Bot</th><th className="py-3 pr-3">Status</th><th className="py-3 pr-3">Last message</th></tr></thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3 font-medium"><Link className="text-la-green hover:underline" href={`/admin/conversations/${conversation.id}`}>{conversation.id}</Link><div className="text-xs text-slate-500">{conversation.pageUrl || conversation.visitorId || "Anonymous"}</div></td>
                    <td className="py-3 pr-3">{conversation.bot.name}</td>
                    <td className="py-3 pr-3"><Badge tone={conversation.reviewed ? "good" : "neutral"}>{conversation.reviewed ? "reviewed" : "new"}</Badge></td>
                    <td className="py-3 pr-3 text-slate-600">{conversation.messages[0]?.content.slice(0, 120) || "No messages"}</td>
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

