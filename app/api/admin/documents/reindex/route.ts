import { NextResponse } from "next/server";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { reindexDocument } from "@/src/lib/documents/indexer";
import { auditLog } from "@/src/lib/services/audit";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const documents = await prisma.document.findMany({
      where: { status: { not: "archived" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true }
    });
    let reindexed = 0;
    const failed: Array<{ id: string; title: string; error: string }> = [];

    for (const document of documents) {
      try {
        await reindexDocument(document.id);
        reindexed += 1;
      } catch (error) {
        failed.push({
          id: document.id,
          title: document.title,
          error: error instanceof Error ? error.message : "Re-index failed"
        });
      }
    }

    await auditLog({
      userId: guard.admin!.id,
      action: "documents_reindexed",
      entity: "Document",
      metadata: { requested: documents.length, reindexed, failed: failed.length }
    });

    const message = failed.length
      ? `${reindexed} document(s) re-indexed. ${failed.length} failed.`
      : `${reindexed} document(s) re-indexed.`;

    return NextResponse.json({ message, reindexed, failed });
  } catch (error) {
    return errorResponse(error);
  }
}
