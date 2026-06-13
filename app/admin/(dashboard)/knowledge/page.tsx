import Link from "next/link";
import { DeleteAction } from "@/src/components/admin/DeleteAction";
import { ReindexAction } from "@/src/components/admin/ReindexAction";
import { Badge, EmptyState, PageHeader, Panel, buttonClass, secondaryButtonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export default async function KnowledgePage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { bot: true, _count: { select: { chunks: true } } }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge base"
        description="Upload files, add manual entries, crawl public pages, approve content, inspect chunks, and keep source citations attached."
        action={
          <>
            <ReindexAction
              action="/api/admin/documents/reindex"
              label="Re-index all"
              confirmMessage="Re-index all knowledge documents? This rebuilds chunks and embeddings with the current embedding provider."
            />
            <Link className={secondaryButtonClass} href="/admin/knowledge/manual">Manual entry</Link>
            <Link className={secondaryButtonClass} href="/admin/knowledge/crawler">Crawler</Link>
            <Link className={buttonClass} href="/admin/knowledge/upload">Upload</Link>
          </>
        }
      />
      <Panel>
        {documents.length === 0 ? (
          <EmptyState title="No documents indexed" body="Upload PDF, DOCX, TXT, Markdown, HTML, CSV, XLSX, JSON, or add manual FAQ/text entries." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr className="border-b border-la-line">
                  <th className="py-3 pr-3">Document</th>
                  <th className="py-3 pr-3">Bot</th>
                  <th className="py-3 pr-3">Type</th>
                  <th className="py-3 pr-3">Status</th>
                  <th className="py-3 pr-3">Chunks</th>
                  <th className="py-3 pr-3">Indexed</th>
                  <th className="py-3 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className="border-b border-la-line last:border-0">
                    <td className="py-3 pr-3 font-medium">
                      <Link className="text-la-green hover:underline" href={`/admin/knowledge/${document.id}`}>{document.title}</Link>
                      <div className="text-xs text-slate-500">{document.filename || document.sourceUrl}</div>
                    </td>
                    <td className="py-3 pr-3">{document.bot?.name || "All bots"}</td>
                    <td className="py-3 pr-3">{document.sourceType}</td>
                    <td className="py-3 pr-3"><Badge tone={document.status === "indexed" ? "good" : document.status === "failed" ? "danger" : "warn"}>{document.status}</Badge></td>
                    <td className="py-3 pr-3">{document._count.chunks}</td>
                    <td className="py-3 pr-3 text-slate-500">{document.indexedAt?.toLocaleString() || "Not yet"}</td>
                    <td className="py-3 pr-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ReindexAction
                          action={`/api/admin/documents/${document.id}/reindex`}
                          confirmMessage={`Re-index ${document.title}? This rebuilds its chunks and embeddings with the current embedding provider.`}
                        />
                        <DeleteAction
                          action={`/api/admin/documents/${document.id}`}
                          label="Delete"
                          confirmMessage={`Delete ${document.title}? Its indexed chunks will also be removed.`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
