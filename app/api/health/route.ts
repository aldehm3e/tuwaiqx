import { NextResponse } from "next/server";
import { getSystemHealth } from "@/src/lib/system/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getSystemHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
