import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { createTextDocument } from "@/src/lib/documents/indexer";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { enqueueDocumentIndex } from "@/src/lib/jobs/queue";
import { manualKnowledgeSchema } from "@/src/lib/validation/schemas";
import { splitLines } from "@/src/lib/utils/forms";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_knowledge");
  if (guard.response) return guard.response;

  try {
    const input = manualKnowledgeSchema.parse(await request.json());
    const content = input.sourceType === "faq" && input.question ? `Question: ${input.question}\n\nAnswer: ${input.content}` : input.content;
    const document = await createTextDocument({
      botId: emptyToNull(input.botId),
      title: input.title,
      content,
      sourceType: input.sourceType,
      sourceUrl: emptyToNull(input.sourceUrl),
      approved: input.approved,
      createdById: guard.admin!.id
    });
    await enqueueDocumentIndex(document.id);
    await prisma.knowledgeEntry.create({
      data: {
        botId: emptyToNull(input.botId),
        title: input.title,
        question: emptyToNull(input.question),
        content: input.content,
        sourceUrl: emptyToNull(input.sourceUrl),
        tags: splitLines(input.tags),
        status: input.approved ? "approved" : "draft"
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "manual_knowledge_created",
      entity: "Document",
      entityId: document.id
    });
    return NextResponse.json({ message: "Knowledge saved. Indexing has been queued.", id: document.id });
  } catch (error) {
    return errorResponse(error);
  }
}
