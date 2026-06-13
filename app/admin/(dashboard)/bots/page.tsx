import Link from "next/link";
import { DeleteAction } from "@/src/components/admin/DeleteAction";
import { Badge, EmptyState, PageHeader, Panel, buttonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function BotsPage() {
  const bots = await prisma.bot.findMany({
    where: { isArchived: false },
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
          <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bots.map((bot) => (
              <div key={bot.id} className="min-w-0 rounded-lg border border-la-line p-4 transition hover:border-la-green hover:bg-la-surface">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link className="block truncate font-semibold text-ink hover:text-la-green" href={`/admin/bots/${bot.id}`} title={bot.name}>{bot.name}</Link>
                    <p className="mt-1 truncate text-xs text-slate-500" title={`/${bot.slug}`}>/{bot.slug}</p>
                  </div>
                  <Badge tone={bot.isActive ? "good" : "warn"}>{bot.isActive ? "active" : "disabled"}</Badge>
                </div>
                <p className="mt-3 min-h-10 break-words text-sm leading-5 text-slate-600">{bot.description || bot.welcomeMessage}</p>
                <div className="mt-4 flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="shrink-0">{bot._count.documents} docs</span>
                  <span className="shrink-0">{bot._count.conversations} conversations</span>
                  <span className="min-w-0 max-w-full truncate" title={bot.modelProvider?.name || "default model"}>{bot.modelProvider?.name || "default model"}</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link className="text-sm font-medium text-la-green hover:underline" href={`/admin/bots/${bot.id}`}>Open</Link>
                  <DeleteAction
                    action={`/api/admin/bots/${bot.id}`}
                    label="Delete"
                    confirmMessage={`Delete ${bot.name}? Conversations for this bot will also be removed.`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
