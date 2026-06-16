import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { storeUpload } from "@/src/lib/documents/storage";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";
import { enqueueDocumentIndex } from "@/src/lib/jobs/queue";
import { splitLines } from "@/src/lib/utils/forms";

const allowedExtensions = new Set(["pdf", "doc", "docx", "txt", "md", "markdown", "html", "htm", "csv", "xlsx", "json"]);
const maxBytes = 25 * 1024 * 1024;

function extension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
  }

  const created: string[] = [];
  for (const file of files) {
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `${file.name} exceeds the 25 MB limit.` }, { status: 400 });
    }
    if (!allowedExtensions.has(extension(file.name))) {
      return NextResponse.json({ error: `${file.name} is not an allowed file type.` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = await storeUpload({ filename: file.name, mimeType: file.type || "application/octet-stream", buffer });
    const document = await prisma.document.create({
      data: {
        botId: (formData.get("botId") as string) || null,
        title: ((formData.get("title") as string) || file.name).trim(),
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        storageKey,
        sourceType: "upload",
        language: ((formData.get("language") as string) || "").trim() || null,
        approved: formData.get("approved") === "true",
        tags: splitLines(formData.get("tags") as string),
        createdById: guard.admin!.id
      }
    });
    created.push(document.id);
    await enqueueDocumentIndex(document.id);
    await auditLog({
      userId: guard.admin!.id,
      action: "document_uploaded",
      entity: "Document",
      entityId: document.id
    });
  }

  return NextResponse.json({ message: `${created.length} document(s) uploaded. Indexing has been queued.`, ids: created });
}
