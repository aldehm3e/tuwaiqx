import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/src/lib/auth/session";
import { rolePermissions } from "@/src/lib/auth/permissions";
import { hashPassword } from "@/src/lib/auth/password";
import { getEnv } from "@/src/lib/config/env";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";
import { errorResponse } from "@/src/lib/api/errors";
import { encryptSecret } from "@/src/lib/security/secrets";
import { setupSchema } from "@/src/lib/validation/schemas";
import { splitLines } from "@/src/lib/utils/forms";

function setupProviderDefaults(input: ReturnType<typeof setupSchema.parse>) {
  if (input.providerType === "MOCK") {
    return {
      baseUrl: "",
      chatModel: input.providerChatModel || "mock-chat",
      embeddingModel: input.providerEmbeddingModel || "mock-embedding"
    };
  }

  if (!input.providerBaseUrl) {
    throw new Error("Provider base URL is required for this provider type.");
  }

  return {
    baseUrl: input.providerBaseUrl,
    chatModel: input.providerChatModel || (input.providerType === "OLLAMA" ? "llama3.1" : "gpt-4o-mini"),
    embeddingModel:
      input.providerEmbeddingModel ||
      (input.providerType === "OLLAMA" ? "nomic-embed-text" : "text-embedding-3-small")
  };
}

export async function POST(request: Request) {
  try {
    const existing = await prisma.appSettings.findFirst();
    if (existing?.setupCompletedAt) {
      return NextResponse.json({ error: "Setup has already been completed." }, { status: 409 });
    }

    const input = setupSchema.parse(await request.json());
    const env = getEnv();
    const providerDefaults = setupProviderDefaults(input);

    const result = await prisma.$transaction(async (tx) => {
      await tx.role.createMany({
        data: Object.entries(rolePermissions).map(([name, permissions]) => ({
          name,
          description: `${name} role`,
          permissions
        })),
        skipDuplicates: true
      });

      const ownerRole = await tx.role.findUniqueOrThrow({ where: { name: "Owner" } });
      const passwordHash = await hashPassword(input.adminPassword);
      const admin = await tx.adminUser.create({
        data: {
          email: input.adminEmail.toLowerCase(),
          name: input.adminName || null,
          passwordHash,
          roles: {
            create: {
              roleId: ownerRole.id
            }
          }
        }
      });

      const provider = await tx.modelProvider.create({
        data: {
          name: input.providerName,
          type: input.providerType,
          baseUrl: providerDefaults.baseUrl || null,
          chatModel: providerDefaults.chatModel,
          embeddingModel: providerDefaults.embeddingModel,
          apiKeyCiphertext: encryptSecret(input.providerApiKey || ""),
          isDefaultChat: true,
          isDefaultEmbedding: true
        }
      });

      const settings = await tx.appSettings.create({
        data: {
          organizationName: input.organizationName,
          websiteUrl: input.websiteUrl,
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          defaultLanguage: input.defaultLanguage,
          defaultDirection: input.defaultDirection,
          sourceCodeUrl: env.SOURCE_CODE_URL,
          defaultChatProviderId: provider.id,
          defaultEmbeddingProviderId: provider.id,
          setupCompletedAt: new Date()
        }
      });

      const domains = splitLines(input.allowedDomains);
      if (domains.length) {
        await tx.allowedDomain.createMany({
          data: domains.map((domain) => ({ domain })),
          skipDuplicates: true
        });
      }

      await tx.bot.create({
        data: {
          slug: "main",
          name: "Main Website Assistant",
          description: "Primary public website assistant.",
          welcomeMessage: `Hello. I can help with ${input.organizationName} information.`,
          systemPrompt: "You are a helpful organization assistant. Answer only with approved organization knowledge when strict mode is enabled.",
          primaryColor: input.primaryColor,
          language: input.defaultLanguage,
          direction: input.defaultDirection,
          modelProviderId: provider.id,
          embeddingProviderId: provider.id,
          strictMode: true,
          showSources: true
        }
      });

      return { admin, settings };
    });

    await auditLog({
      userId: result.admin.id,
      action: "setup_completed",
      entity: "AppSettings",
      entityId: result.settings.id
    });

    const response = NextResponse.json({ message: "Setup completed." });
    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken({
        userId: result.admin.id,
        email: result.admin.email,
        issuedAt: Math.floor(Date.now() / 1000)
      }),
      sessionCookieOptions()
    );
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
