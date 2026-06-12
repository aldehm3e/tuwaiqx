import { ManualKnowledgeForm } from "@/src/components/admin/Forms";
import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function ManualKnowledgePage() {
  const bots = await prisma.bot.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Manual knowledge" description="Add text or FAQ knowledge without uploading files. Entries are indexed immediately and can be assigned to one bot or all bots." />
      <Panel>
        <ManualKnowledgeForm bots={bots} />
      </Panel>
    </div>
  );
}

