import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { enqueueDocumentIndex } from "@/src/lib/jobs/queue";
import { auditLog } from "@/src/lib/services/audit";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const documents = await prisma.document.findMany({
      where: {
        status: { not: "archived" }
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true }
    });
    const documentIds = documents.map((document) => document.id);

    if (!documents.length) {
      return NextResponse.json({ message: "No active documents to re-index.", queued: 0 });
    }

    let queued = 0;
    for (const documentId of documentIds) {
      const result = await enqueueDocumentIndex(documentId, { force: true });
      if (result.queued) {
        queued += 1;
      }
    }

    await auditLog({
      userId: guard.admin!.id,
      action: "documents_reindex_queued",
      entity: "Document",
      metadata: { requested: documents.length, queued }
    });
    revalidatePath("/admin/knowledge");

    return NextResponse.json({
      message: `${queued} document(s) queued for re-indexing.`,
      queued
    });
  } catch (error) {
    return errorResponse(error);
  }
}
