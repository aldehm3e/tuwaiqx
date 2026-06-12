import { Badge, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id },
    include: { bot: true, messages: { orderBy: { createdAt: "asc" } }, tickets: true }
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Conversation" description={`${conversation.bot.name} · ${conversation.pageUrl || "No page URL"}`} />
      <Panel>
        <div className="space-y-4">
          {conversation.messages.map((message) => (
            <div key={message.id} className="rounded-lg border border-la-line bg-la-surface p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Badge tone={message.role === "assistant" ? "good" : "neutral"}>{message.role}</Badge>
                <span className="text-xs text-slate-500">{message.createdAt.toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
              {Array.isArray(message.sourcesJson) && message.sourcesJson.length ? (
                <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-600">{JSON.stringify(message.sourcesJson, null, 2)}</pre>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
