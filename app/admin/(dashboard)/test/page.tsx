import { BotTester } from "@/src/components/admin/BotTester";
import { EmptyState, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

function quickActions(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function TestPage() {
  const bots = await prisma.bot.findMany({ where: { isActive: true, isArchived: false }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Test bot" description="Run public chat behavior from the admin dashboard, including strict-mode fallback and source citations." />
      <Panel>
        {bots.length ? (
          <BotTester
            bots={bots.map((bot) => ({
              id: bot.id,
              slug: bot.slug,
              name: bot.name,
              welcomeMessage: bot.welcomeMessage,
              language: bot.language,
              direction: bot.direction,
              quickActions: quickActions(bot.quickActions)
            }))}
          />
        ) : (
          <EmptyState title="No active bots" body="Create and activate a bot before testing chat." />
        )}
      </Panel>
    </div>
  );
}
