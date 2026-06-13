import { NextResponse } from "next/server";
import { providerFromDb } from "@/src/lib/ai/factory";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { errorResponse } from "@/src/lib/api/errors";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";

export async function PATCH(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const provider = await prisma.modelProvider.findUniqueOrThrow({ where: { id } });
    const health = await providerFromDb(provider).healthCheck();
    await prisma.modelProvider.update({
      where: { id },
      data: {
        lastHealthStatus: health.ok ? "ok" : "failed",
        lastHealthAt: new Date()
      }
    });
    await auditLog({
      userId: guard.admin!.id,
      action: "model_provider_health_checked",
      entity: "ModelProvider",
      entityId: id,
      metadata: { health: health.ok ? "ok" : "failed" }
    });

    return NextResponse.json({ message: health.message });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const providerCount = await prisma.modelProvider.count();
    if (providerCount <= 1) {
      return NextResponse.json({ error: "At least one provider must remain." }, { status: 400 });
    }

    const provider = await prisma.modelProvider.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, isDefaultChat: true, isDefaultEmbedding: true }
    });
    const settings = await prisma.appSettings.findFirst({
      select: { defaultChatProviderId: true, defaultEmbeddingProviderId: true }
    });
    const replacement = await prisma.modelProvider.findFirst({
      where: { id: { not: id }, isEnabled: true },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    const wasDefaultChat = settings?.defaultChatProviderId === id || provider.isDefaultChat;
    const wasDefaultEmbedding = settings?.defaultEmbeddingProviderId === id || provider.isDefaultEmbedding;

    await prisma.$transaction(async (tx) => {
      await tx.modelProvider.delete({ where: { id } });

      if (wasDefaultChat) {
        await tx.modelProvider.updateMany({ data: { isDefaultChat: false } });
        await tx.appSettings.updateMany({
          data: { defaultChatProviderId: replacement?.id ?? null }
        });
        if (replacement) {
          await tx.modelProvider.update({
            where: { id: replacement.id },
            data: { isDefaultChat: true }
          });
        }
      }

      if (wasDefaultEmbedding) {
        await tx.modelProvider.updateMany({ data: { isDefaultEmbedding: false } });
        await tx.appSettings.updateMany({
          data: { defaultEmbeddingProviderId: replacement?.id ?? null }
        });
        if (replacement) {
          await tx.modelProvider.update({
            where: { id: replacement.id },
            data: { isDefaultEmbedding: true }
          });
        }
      }
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "model_provider_deleted",
      entity: "ModelProvider",
      entityId: id,
      metadata: { name: provider.name }
    });

    return NextResponse.json({ message: "Provider deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
