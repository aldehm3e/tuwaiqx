import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { ticketSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_tickets");
  if (guard.response) return guard.response;

  try {
    const input = ticketSchema.parse(await request.json());
    const ticket = await prisma.ticket.create({
      data: {
        conversationId: emptyToNull(input.conversationId),
        botId: emptyToNull(input.botId),
        requesterName: emptyToNull(input.requesterName),
        requesterEmail: emptyToNull(input.requesterEmail),
        requesterPhone: emptyToNull(input.requesterPhone),
        subject: input.subject,
        message: input.message,
        priority: input.priority
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "ticket_created",
      entity: "Ticket",
      entityId: ticket.id
    });
    return NextResponse.json({ message: "Ticket created.", id: ticket.id });
  } catch (error) {
    return errorResponse(error);
  }
}

