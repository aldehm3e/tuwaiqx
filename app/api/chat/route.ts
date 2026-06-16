import { NextResponse } from "next/server";
import { answerQuestion } from "@/src/lib/rag/answer";
import { corsHeaders } from "@/src/lib/api/cors";
import { errorResponse } from "@/src/lib/api/errors";
import { getEnv } from "@/src/lib/config/env";
import { applyRateLimitHeaders, getClientIp, rateLimit } from "@/src/lib/security/rate-limit";
import { chatSchema } from "@/src/lib/validation/schemas";

export async function OPTIONS(request: Request) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export async function POST(request: Request) {
  let headers: Headers | null = null;
  try {
    const json = await request.json();
    const input = chatSchema.parse(json);
    const cors = await corsHeaders(request, input.pageUrl);
    if (!cors) {
      return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
    }
    headers = new Headers(cors);

    const env = getEnv();
    const limited = await rateLimit(`chat:${getClientIp(request)}:${input.botId}`, env.CHAT_RATE_LIMIT_REQUESTS, env.CHAT_RATE_LIMIT_WINDOW_MS);
    headers = applyRateLimitHeaders(new Headers(headers), limited);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429, headers });
    }

    const answer = await answerQuestion(input);
    return NextResponse.json(answer, { headers });
  } catch (error) {
    headers ||= new Headers((await corsHeaders(request)) || undefined);
    return errorResponse(error, 400, headers || undefined);
  }
}
