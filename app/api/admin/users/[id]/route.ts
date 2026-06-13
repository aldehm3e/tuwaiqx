import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";

const userStatusSchema = z.object({
  isActive: z.boolean()
});

type UserWithRoles = {
  roles: Array<{
    role: {
      permissions: unknown;
    };
  }>;
};

function canManageUsers(user: UserWithRoles) {
  return user.roles.some((userRole) => {
    const permissions = userRole.role.permissions;
    return Array.isArray(permissions) && permissions.includes("manage_users");
  });
}

async function assertCanChangeUserAccess(userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new Error("You cannot change your own account access.");
  }

  const user = await prisma.adminUser.findUniqueOrThrow({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  });

  if (!user.isActive) {
    return user;
  }

  if (canManageUsers(user)) {
    const remainingManagers = await prisma.adminUser.findMany({
      where: {
        id: { not: userId },
        isActive: true
      },
      include: { roles: { include: { role: true } } }
    });

    if (!remainingManagers.some(canManageUsers)) {
      throw new Error("At least one active user with user-management permission must remain.");
    }
  }

  return user;
}

export async function PATCH(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_users");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const input = userStatusSchema.parse(await request.json());

    if (!input.isActive) {
      await assertCanChangeUserAccess(id, guard.admin!.id);
    }

    const user = await prisma.adminUser.update({
      where: { id },
      data: { isActive: input.isActive }
    });

    await auditLog({
      userId: guard.admin!.id,
      action: input.isActive ? "admin_user_enabled" : "admin_user_disabled",
      entity: "AdminUser",
      entityId: user.id
    });

    return NextResponse.json({ message: input.isActive ? "User enabled." : "User disabled.", id: user.id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_users");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const target = await assertCanChangeUserAccess(id, guard.admin!.id);
    await prisma.adminUser.delete({ where: { id } });

    await auditLog({
      userId: guard.admin!.id,
      action: "admin_user_deleted",
      entity: "AdminUser",
      entityId: target.id,
      metadata: {
        email: target.email,
        name: target.name
      }
    });

    return NextResponse.json({ message: "User deleted.", id: target.id });
  } catch (error) {
    return errorResponse(error);
  }
}
