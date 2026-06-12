import { NextResponse } from "next/server";
import { answerQuestion } from "@/src/lib/rag/answer";
import { corsHeaders } from "@/src/lib/api/cors";
import { errorResponse } from "@/src/lib/api/errors";
import { getClientIp, rateLimit } from "@/src/lib/security/rate-limit";
import { chatSchema } from "@/src/lib/validation/schemas";

export async function OPTIONS(request: Request) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const input = chatSchema.parse(json);
    const headers = await corsHeaders(request, input.pageUrl);
    if (!headers) {
      return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
    }

    const limited = rateLimit(`chat:${getClientIp(request)}:${input.botId}`, 40, 60_000);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers });
    }

    const answer = await answerQuestion(input);
    return NextResponse.json(answer, { headers });
  } catch (error) {
    return errorResponse(error);
  }
}

