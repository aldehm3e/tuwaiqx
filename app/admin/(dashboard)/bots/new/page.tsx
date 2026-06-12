import { BotForm } from "@/src/components/admin/Forms";
import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function NewBotPage() {
  const providers = await prisma.modelProvider.findMany({ where: { isEnabled: true }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Create bot" description="Configure prompt, strict mode, provider selection, widget color, direction, and source display." />
      <Panel>
        <BotForm providers={providers} />
      </Panel>
    </div>
  );
}

