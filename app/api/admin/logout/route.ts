import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/auth/session";
import { getEnv } from "@/src/lib/config/env";

export async function POST() {
  const response = NextResponse.redirect(new URL("/admin/login", getEnv().APP_URL), { status: 303 });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}
