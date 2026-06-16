import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { crawlWebsite } from "@/src/lib/documents/crawler";
import { createTextDocument } from "@/src/lib/documents/indexer";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { enqueueDocumentIndex } from "@/src/lib/jobs/queue";
import { crawlerSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const input = crawlerSchema.parse(await request.json());
    const pages = await crawlWebsite({
      url: input.url,
      depth: input.depth,
      sameDomain: input.sameDomain
    });
    const ids: string[] = [];
    for (const page of pages) {
      const document = await createTextDocument({
        botId: emptyToNull(input.botId),
        title: page.title,
        content: page.text,
        sourceType: "url",
        sourceUrl: page.url,
        approved: input.approved,
        createdById: guard.admin!.id
      });
      await enqueueDocumentIndex(document.id);
      ids.push(document.id);
    }
    await auditLog({
      userId: guard.admin!.id,
      action: "website_crawled",
      entity: "Document",
      metadata: { url: input.url, pages: pages.length }
    });
    return NextResponse.json({ message: `${ids.length} page(s) crawled. Indexing has been queued.`, ids });
  } catch (error) {
    return errorResponse(error);
  }
}
