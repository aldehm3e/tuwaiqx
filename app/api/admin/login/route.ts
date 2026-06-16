import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/src/lib/auth/session";
import { verifyPassword } from "@/src/lib/auth/password";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";
import { applyRateLimitHeaders, getClientIp, rateLimit } from "@/src/lib/security/rate-limit";
import { errorResponse } from "@/src/lib/api/errors";
import { loginSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = await rateLimit(`login:${ip}`, 10, 60_000);
    const headers = applyRateLimitHeaders(new Headers(), limited);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many login attempts." }, { status: 429, headers });
    }

    const input = loginSchema.parse(await request.json());
    const user = await prisma.adminUser.findUnique({
      where: { email: input.email.toLowerCase() }
    });

    if (!user?.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    await auditLog({
      userId: user.id,
      action: "login",
      entity: "AdminUser",
      entityId: user.id,
      ipAddress: ip
    });

    const response = NextResponse.json({ message: "Logged in." }, { headers });
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken({
        userId: user.id,
        email: user.email,
        issuedAt: Math.floor(Date.now() / 1000)
      }),
      sessionCookieOptions()
    );
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
