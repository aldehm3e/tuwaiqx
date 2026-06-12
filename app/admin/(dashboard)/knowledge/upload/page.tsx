import { UploadKnowledgeForm } from "@/src/components/admin/Forms";
import { PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function UploadKnowledgePage() {
  const bots = await prisma.bot.findMany({ where: { isArchived: false }, orderBy: { name: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Upload documents" description="Upload PDF, DOCX, TXT, Markdown, HTML, CSV, XLSX, JSON and index them into approved chunks with source metadata." />
      <Panel>
        <UploadKnowledgeForm bots={bots} />
      </Panel>
    </div>
  );
}

