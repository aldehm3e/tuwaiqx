import type { DocumentStatus } from "@prisma/client";
import Link from "next/link";
import { DeleteAction } from "@/src/components/admin/DeleteAction";
import { KnowledgeAutoRefresh } from "@/src/components/admin/KnowledgeAutoRefresh";
import { ReindexAction } from "@/src/components/admin/ReindexAction";
import { Badge, EmptyState, PageHeader, Panel, buttonClass, secondaryButtonClass } from "@/src/components/admin/Ui";
import { prisma } from "@/src/lib/db/prisma";

export const dynamic = "force-dynamic";

const statusMeta: Record<DocumentStatus, { label: string; progress: number; tone: "good" | "warn" | "danger" | "neutral"; detail: string }> = {
  uploaded: { label: "Uploaded", progress: 10, tone: "warn", detail: "Waiting for parser and indexer." },
  parsing: { label: "Parsing", progress: 25, tone: "warn", detail: "Extracting readable text." },
  parsed: { label: "Parsed", progress: 45, tone: "warn", detail: "Text extracted; indexing still required." },
  indexing: { label: "Indexing", progress: 70, tone: "warn", detail: "Creating chunks and embeddings." },
  indexed: { label: "Indexed", progress: 100, tone: "good", detail: "Ready for retrieval." },
  failed: { label: "Failed", progress: 100, tone: "danger", detail: "Needs admin action." },
  archived: { label: "Archived", progress: 100, tone: "neutral", detail: "Hidden from active retrieval." }
};

function statusCounts(documents: Array<{ status: DocumentStatus }>) {
  return documents.reduce(
    (counts, document) => {
      counts[document.status] += 1;
      return counts;
    },
    {
      uploaded: 0,
      parsing: 0,
      parsed: 0,
      indexing: 0,
      indexed: 0,
      failed: 0,
      archived: 0
    } satisfies Record<DocumentStatus, number>
  );
}

export default async function KnowledgePage() {
  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { bot: true, _count: { select: { chunks: true } } }
  });
  const counts = statusCounts(documents);
  const totalChunks = documents.reduce((sum, document) => sum + document._count.chunks, 0);
  const inProgress = counts.uploaded + counts.parsing + counts.parsed + counts.indexing;

  return (
    <div className="space-y-6">
      <KnowledgeAutoRefresh enabled={inProgress > 0} />
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
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Indexing visibility</h2>
          <p className="text-sm leading-6 text-slate-600">Track the upload-to-index pipeline. Indexed documents are ready for retrieval; failed or in-progress documents need attention before the bot can rely on them.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Ready</div>
            <div className="mt-2 text-2xl font-semibold">{counts.indexed}</div>
            <p className="mt-1 text-xs text-slate-600">{totalChunks} chunks searchable</p>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">In progress</div>
            <div className="mt-2 text-2xl font-semibold">{inProgress}</div>
            <p className="mt-1 text-xs text-slate-600">uploaded, parsing, parsed, or indexing</p>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Failed</div>
            <div className="mt-2 text-2xl font-semibold">{counts.failed}</div>
            <p className="mt-1 text-xs text-slate-600">open a document row to inspect the error</p>
          </div>
          <div className="rounded-lg border border-la-line bg-la-surface p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Archived</div>
            <div className="mt-2 text-2xl font-semibold">{counts.archived}</div>
            <p className="mt-1 text-xs text-slate-600">excluded from active answers</p>
          </div>
        </div>
      </Panel>
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
                  <th className="py-3 pr-3">Pipeline</th>
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
                    <td className="py-3 pr-3"><Badge tone={statusMeta[document.status].tone}>{statusMeta[document.status].label}</Badge></td>
                    <td className="py-3 pr-3">
                      <div className="min-w-44">
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500">
                          <span>{statusMeta[document.status].detail}</span>
                          <span>{statusMeta[document.status].progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-la-surface">
                          <div className="h-full rounded-full bg-la-green" style={{ width: `${statusMeta[document.status].progress}%` }} />
                        </div>
                        {document.errorMessage ? <p className="mt-2 max-w-xs text-xs leading-5 text-red-700">{document.errorMessage}</p> : null}
                      </div>
                    </td>
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
