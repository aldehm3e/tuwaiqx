import { NextResponse } from "next/server";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { reindexDocument } from "@/src/lib/documents/indexer";
import { auditLog } from "@/src/lib/services/audit";

export async function POST(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const document = await reindexDocument(id);
    await auditLog({
      userId: guard.admin!.id,
      action: "document_reindexed",
      entity: "Document",
      entityId: id,
      metadata: { title: document.title }
    });

    return NextResponse.json({ message: "Document re-indexed." });
  } catch (error) {
    return errorResponse(error);
  }
}
