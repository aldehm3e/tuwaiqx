import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/src/lib/db/prisma";
import { getAuthSecret } from "@/src/lib/config/env";

export const SESSION_COOKIE = "tuwaiqx_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

type SessionPayload = {
  userId: string;
  email: string;
  issuedAt: number;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

export function createSessionToken(payload: SessionPayload) {
  const encoded = base64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) {
    return null;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const expected = sign(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
  const ageSeconds = Math.floor(Date.now() / 1000) - payload.issuedAt;
  if (ageSeconds > MAX_AGE_SECONDS) {
    return null;
  }

  return payload;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS
  };
}

export function getSessionFromCookieHeader(cookieHeader: string | null) {
  const token = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.split("=")[1];
  return verifySessionToken(token);
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user?.isActive) {
    return null;
  }

  const userPermissions = new Set<string>();
  for (const userRole of user.roles) {
    const rolePermissions = userRole.role.permissions;
    if (Array.isArray(rolePermissions)) {
      for (const permission of rolePermissions) {
        if (typeof permission === "string") {
          userPermissions.add(permission);
        }
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    permissions: [...userPermissions],
    roles: user.roles.map((userRole) => userRole.role.name)
  };
}

export async function getCurrentAdminFromRequest(request: Request) {
  const session = getSessionFromCookieHeader(request.headers.get("cookie"));
  if (!session) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user?.isActive) {
    return null;
  }

  const userPermissions = new Set<string>();
  for (const userRole of user.roles) {
    const rolePermissions = userRole.role.permissions;
    if (Array.isArray(rolePermissions)) {
      for (const permission of rolePermissions) {
        if (typeof permission === "string") {
          userPermissions.add(permission);
        }
      }
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    permissions: [...userPermissions],
    roles: user.roles.map((userRole) => userRole.role.name)
  };
}
