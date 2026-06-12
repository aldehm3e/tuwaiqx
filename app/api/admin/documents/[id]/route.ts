import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { removeStoredObject } from "@/src/lib/documents/storage";
import { auditLog } from "@/src/lib/services/audit";
import { errorResponse } from "@/src/lib/api/errors";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRequest(_request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const { id } = await params;
    const document = await prisma.document.findUniqueOrThrow({
      where: { id },
      select: { id: true, storageKey: true, title: true }
    });

    await prisma.document.delete({ where: { id } });
    await removeStoredObject(document.storageKey);
    await auditLog({
      userId: guard.admin!.id,
      action: "document_deleted",
      entity: "Document",
      entityId: document.id,
      metadata: { title: document.title }
    });

    return NextResponse.json({ message: "Document deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
