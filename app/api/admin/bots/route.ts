import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { botSchema } from "@/src/lib/validation/schemas";
import { splitLines } from "@/src/lib/utils/forms";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_bots");
  if (guard.response) return guard.response;

  try {
    const input = botSchema.parse(await request.json());
    const bot = await prisma.bot.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: emptyToNull(input.description),
        avatarUrl: emptyToNull(input.avatarUrl),
        welcomeMessage: input.welcomeMessage,
        fallbackMessage: input.fallbackMessage,
        systemPrompt: input.systemPrompt,
        primaryColor: input.primaryColor,
        language: input.language,
        direction: input.direction,
        strictMode: input.strictMode,
        showSources: input.showSources,
        allowGeneralAnswer: input.allowGeneralAnswer,
        maxAnswerLength: input.maxAnswerLength,
        temperature: input.temperature,
        modelProviderId: emptyToNull(input.modelProviderId),
        embeddingProviderId: emptyToNull(input.embeddingProviderId),
        isActive: input.isActive,
        position: input.position,
        quickActions: splitLines(input.quickActions)
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "bot_created",
      entity: "Bot",
      entityId: bot.id
    });
    return NextResponse.json({ message: "Bot saved.", id: bot.id });
  } catch (error) {
    return errorResponse(error);
  }
}

