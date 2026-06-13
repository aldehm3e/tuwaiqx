import { NextResponse } from "next/server";
import { z } from "zod";
import { corsHeaders } from "@/src/lib/api/cors";
import { errorResponse } from "@/src/lib/api/errors";
import { prisma } from "@/src/lib/db/prisma";

const feedbackSchema = z.object({
  messageId: z.string(),
  feedback: z.enum(["helpful", "not_helpful"])
});

export async function OPTIONS(request: Request) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  let headers: Awaited<ReturnType<typeof corsHeaders>> | null = null;
  try {
    const input = feedbackSchema.parse(await request.json());
    headers = await corsHeaders(request);
    if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
    await prisma.message.update({
      where: { id: input.messageId },
      data: { feedback: input.feedback }
    });
    return NextResponse.json({ message: "Feedback saved." }, { headers });
  } catch (error) {
    headers ||= await corsHeaders(request);
    return errorResponse(error, 400, headers || undefined);
  }
}
