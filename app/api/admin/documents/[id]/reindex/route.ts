import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { enqueueDocumentIndex } from "@/src/lib/jobs/queue";
import { auditLog } from "@/src/lib/services/audit";

export async function POST(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const document = await prisma.document.findUniqueOrThrow({
      where: { id },
      select: { id: true, title: true }
    });

    const result = await enqueueDocumentIndex(id, { force: true });
    await auditLog({
      userId: guard.admin!.id,
      action: "document_reindex_queued",
      entity: "Document",
      entityId: id,
      metadata: { title: document.title }
    });
    revalidatePath("/admin/knowledge");
    revalidatePath(`/admin/knowledge/${id}`);

    return NextResponse.json({ message: "Document queued for re-indexing.", queued: result.queued ? 1 : 0 });
  } catch (error) {
    return errorResponse(error);
  }
}
