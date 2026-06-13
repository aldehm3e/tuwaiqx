import { NextResponse } from "next/server";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";
import { ticketUpdateSchema } from "@/src/lib/validation/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRequest(request, "manage_tickets");
  if (guard.response) return guard.response;

  try {
    const { id } = await params;
    const input = ticketUpdateSchema.parse(await request.json());
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.assignedToId !== undefined ? { assignedToId: emptyToNull(input.assignedToId) } : {})
      }
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "ticket_updated",
      entity: "Ticket",
      entityId: ticket.id,
      metadata: {
        status: input.status || null,
        priority: input.priority || null,
        assignedToId: emptyToNull(input.assignedToId)
      }
    });

    return NextResponse.json({ message: "Ticket updated.", id: ticket.id });
  } catch (error) {
    return errorResponse(error);
  }
}
