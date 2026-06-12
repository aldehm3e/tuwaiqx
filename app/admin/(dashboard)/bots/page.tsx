import Link from "next/link";
import { Badge, EmptyState, PageHeader, Panel, buttonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function BotsPage() {
  const bots = await prisma.bot.findMany({
    orderBy: { createdAt: "desc" },
    include: { modelProvider: true, _count: { select: { documents: true, conversations: true } } }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bots"
        description="Create multiple assistants for main websites, admissions, donations, volunteers, support desks, and other public organization workflows."
        action={<Link className={buttonClass} href="/admin/bots/new">Create bot</Link>}
      />
      <Panel>
        {bots.length === 0 ? (
          <EmptyState title="No bots yet" body="Create the first website assistant, then assign approved knowledge and copy its widget embed code." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bots.map((bot) => (
              <Link key={bot.id} href={`/admin/bots/${bot.id}`} className="rounded-lg border border-la-line p-4 transition hover:border-la-green hover:bg-la-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{bot.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">/{bot.slug}</p>
                  </div>
                  <Badge tone={bot.isActive ? "good" : "warn"}>{bot.isActive ? "active" : "disabled"}</Badge>
                </div>
                <p className="mt-3 min-h-10 text-sm leading-5 text-slate-600">{bot.description || bot.welcomeMessage}</p>
                <div className="mt-4 flex gap-2 text-xs text-slate-500">
                  <span>{bot._count.documents} docs</span>
                  <span>{bot._count.conversations} conversations</span>
                  <span>{bot.modelProvider?.name || "default model"}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

