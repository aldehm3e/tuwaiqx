import { Badge, PageHeader, Panel } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function KnowledgeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await prisma.document.findUniqueOrThrow({
    where: { id },
    include: { bot: true, chunks: { orderBy: { chunkIndex: "asc" }, take: 20 } }
  });

  return (
    <div className="space-y-6">
      <PageHeader title={document.title} description={document.sourceUrl || document.filename || "Knowledge document"} />
      <Panel>
        <div className="grid gap-4 md:grid-cols-4">
          <div><div className="text-xs text-slate-500">Status</div><Badge tone={document.status === "indexed" ? "good" : document.status === "failed" ? "danger" : "warn"}>{document.status}</Badge></div>
          <div><div className="text-xs text-slate-500">Bot</div><div className="font-semibold">{document.bot?.name || "All bots"}</div></div>
          <div><div className="text-xs text-slate-500">Approved</div><div className="font-semibold">{document.approved ? "Yes" : "No"}</div></div>
          <div><div className="text-xs text-slate-500">Indexed</div><div className="font-semibold">{document.indexedAt?.toLocaleString() || "Not yet"}</div></div>
        </div>
        {document.errorMessage ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{document.errorMessage}</p> : null}
      </Panel>
      <Panel>
        <h2 className="mb-4 text-lg font-semibold">Chunk preview</h2>
        <div className="space-y-3">
          {document.chunks.map((chunk) => (
            <div key={chunk.id} className="rounded-md border border-la-line bg-la-surface p-4">
              <div className="mb-2 text-xs font-semibold text-slate-500">Chunk {chunk.chunkIndex} · {chunk.tokenCount || 0} tokens</div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{chunk.content}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
