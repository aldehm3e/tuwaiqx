import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    name: "TuwaiqX",
    version: "0.1.0",
    license: "AGPL-3.0-or-later"
  });
}

