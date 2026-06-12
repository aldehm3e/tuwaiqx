import Link from "next/link";
import { BotTester } from "@/src/components/admin/BotTester";
import { Badge, PageHeader, Panel, secondaryButtonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function BotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bot = await prisma.bot.findUniqueOrThrow({
    where: { id },
    include: { modelProvider: true, embeddingProvider: true, _count: { select: { documents: true, conversations: true } } }
  });
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <PageHeader
        title={bot.name}
        description={bot.description || `Widget slug: ${bot.slug}`}
        action={<Link className={secondaryButtonClass} href="/admin/embed">Embed code</Link>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_28rem]">
        <Panel>
          <div className="grid gap-4 md:grid-cols-3">
            <div><div className="text-xs text-slate-500">Status</div><Badge tone={bot.isActive ? "good" : "warn"}>{bot.isActive ? "active" : "disabled"}</Badge></div>
            <div><div className="text-xs text-slate-500">Documents</div><div className="text-lg font-semibold">{bot._count.documents}</div></div>
            <div><div className="text-xs text-slate-500">Conversations</div><div className="text-lg font-semibold">{bot._count.conversations}</div></div>
          </div>
          <div className="mt-6 rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-sm font-semibold">Embed snippet</div>
            <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs text-slate-700">{`<script src="${appUrl}/widget.js" data-bot-id="${bot.slug}"></script>`}</pre>
          </div>
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Prompt</h2>
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-la-line bg-white p-4 text-sm leading-6 text-slate-700">{bot.systemPrompt}</p>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Test bot</h2>
          <BotTester bots={[{ id: bot.id, slug: bot.slug, name: bot.name }]} />
        </Panel>
      </div>
    </div>
  );
}
