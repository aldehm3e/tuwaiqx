import { NextResponse } from "next/server";
import { corsHeaders } from "@/src/lib/api/cors";
import { prisma } from "@/src/lib/db/prisma";

export async function OPTIONS(request: Request) {
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });
  return new Response(null, { status: 204, headers });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const botId = url.searchParams.get("botId") || "main";
  const headers = await corsHeaders(request);
  if (!headers) return NextResponse.json({ error: "Origin is not allowed." }, { status: 403 });

  const [settings, bot] = await Promise.all([
    prisma.appSettings.findFirst(),
    prisma.bot.findFirst({
      where: {
        OR: [{ id: botId }, { slug: botId }],
        isActive: true,
        isArchived: false
      }
    })
  ]);

  if (!bot) {
    return NextResponse.json({ error: "Bot not found." }, { status: 404, headers });
  }

  return NextResponse.json(
    {
      botId: bot.slug,
      name: bot.name,
      welcomeMessage: bot.welcomeMessage,
      avatarUrl: bot.avatarUrl,
      primaryColor: bot.primaryColor,
      direction: bot.direction,
      language: bot.language,
      position: bot.position,
      quickActions: bot.quickActions,
      showSources: bot.showSources,
      organizationName: settings?.organizationName || "Organization",
      sourceCodeUrl: settings?.sourceCodeUrl || process.env.SOURCE_CODE_URL || "https://github.com/aldehm3e/tuwaiqx"
    },
    { headers }
  );
}
