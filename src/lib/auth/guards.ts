import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentAdminFromRequest } from "@/src/lib/auth/session";
import type { Permission } from "@/src/lib/auth/permissions";
import { hasPermission } from "@/src/lib/auth/permissions";

export async function requireAdminPage(permission?: Permission) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  if (permission && !hasPermission(admin.permissions, permission)) {
    redirect("/admin/not-authorized");
  }

  return admin;
}

export async function requireAdminRequest(request: Request, permission?: Permission) {
  const admin = await getCurrentAdminFromRequest(request);
  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 })
    };
  }

  if (permission && !hasPermission(admin.permissions, permission)) {
    return {
      admin,
      response: NextResponse.json({ error: "Your role is not allowed to perform this action." }, { status: 403 })
    };
  }

  return { admin, response: null };
}
