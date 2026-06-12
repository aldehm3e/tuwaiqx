import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { formSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const input = formSchema.parse(await request.json());
    const form = await prisma.form.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: emptyToNull(input.description),
        submitLabel: input.submitLabel,
        botId: emptyToNull(input.botId),
        webhookUrl: emptyToNull(input.webhookUrl),
        emailNotification: emptyToNull(input.emailNotification),
        fields: {
          createMany: {
            data: [
              { label: "Name", name: "name", type: "text", required: true, order: 0 },
              { label: "Email", name: "email", type: "email", required: true, order: 1 },
              { label: "Message", name: "message", type: "textarea", required: true, order: 2 }
            ]
          }
        }
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "form_created",
      entity: "Form",
      entityId: form.id
    });
    return NextResponse.json({ message: "Form created.", id: form.id });
  } catch (error) {
    return errorResponse(error);
  }
}

