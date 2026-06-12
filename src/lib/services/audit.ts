import { prisma } from "@/src/lib/db/prisma";

export async function auditLog(input: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: (input.metadata ?? {}) as object,
      ipAddress: input.ipAddress ?? undefined
    }
  });
}

