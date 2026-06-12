import { CrawlerForm } from "@/src/components/admin/Forms";
import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function CrawlerKnowledgePage() {
  const bots = await prisma.bot.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Website crawler" description="Fetch public pages, extract readable text, avoid infinite loops with depth and same-domain controls, and keep source URLs for citations." />
      <Panel>
        <CrawlerForm bots={bots} />
      </Panel>
    </div>
  );
}

