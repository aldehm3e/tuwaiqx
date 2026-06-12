import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { hashPassword } from "@/src/lib/auth/password";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().or(z.literal("")),
  password: z.string().min(10),
  roleId: z.string().min(1)
});

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_users");
  if (guard.response) return guard.response;

  try {
    const input = userSchema.parse(await request.json());
    const user = await prisma.adminUser.create({
      data: {
        email: input.email.toLowerCase(),
        name: emptyToNull(input.name),
        passwordHash: await hashPassword(input.password),
        roles: { create: { roleId: input.roleId } }
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "admin_user_created",
      entity: "AdminUser",
      entityId: user.id
    });
    return NextResponse.json({ message: "User created.", id: user.id });
  } catch (error) {
    return errorResponse(error);
  }
}

