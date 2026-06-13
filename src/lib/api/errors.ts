import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown, status = 400, headers?: HeadersInit) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 422, headers }
    );
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Request failed" },
    { status, headers }
  );
}

export function emptyToNull(value?: string | null) {
  return value && value.trim() ? value.trim() : null;
}
