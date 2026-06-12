import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function errorResponse(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.flatten() },
      { status: 422 }
    );
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Request failed" },
    { status }
  );
}

export function emptyToNull(value?: string | null) {
  return value && value.trim() ? value.trim() : null;
}

