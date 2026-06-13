import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";

export async function POST(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_bots");
  if (guard.response) return guard.response;

  const { id } = (await params) as { id: string };
  const source = await prisma.bot.findUniqueOrThrow({ where: { id } });
  const bot = await prisma.bot.create({
    data: {
      slug: `${source.slug}-copy-${Date.now().toString(36)}`,
      name: `${source.name} Copy`,
      description: source.description,
      avatarUrl: source.avatarUrl,
      welcomeMessage: source.welcomeMessage,
      fallbackMessage: source.fallbackMessage,
      systemPrompt: source.systemPrompt,
      primaryColor: source.primaryColor,
      language: source.language,
      direction: source.direction,
      strictMode: source.strictMode,
      showSources: source.showSources,
      allowGeneralAnswer: source.allowGeneralAnswer,
      maxAnswerLength: source.maxAnswerLength,
      temperature: source.temperature,
      modelProviderId: source.modelProviderId,
      embeddingProviderId: source.embeddingProviderId,
      isActive: false,
      position: source.position,
      quickActions: source.quickActions as Prisma.InputJsonValue
    }
  });
  await auditLog({
    userId: guard.admin!.id,
    action: "bot_duplicated",
    entity: "Bot",
    entityId: bot.id,
    metadata: { sourceBotId: source.id }
  });
  return NextResponse.json({ message: "Bot duplicated.", id: bot.id });
}
