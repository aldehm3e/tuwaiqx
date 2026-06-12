import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { settingsSchema } from "@/src/lib/validation/schemas";
import { splitLines } from "@/src/lib/utils/forms";

export async function PUT(request: Request) {
  const guard = await requireAdminRequest(request, "manage_system");
  if (guard.response) return guard.response;

  try {
    const input = settingsSchema.parse(await request.json());
    const settings = await prisma.appSettings.findFirstOrThrow();
    await prisma.$transaction(async (tx) => {
      await tx.appSettings.update({
        where: { id: settings.id },
        data: {
          organizationName: input.organizationName,
          websiteUrl: input.websiteUrl,
          logoUrl: emptyToNull(input.logoUrl),
          faviconUrl: emptyToNull(input.faviconUrl),
          primaryColor: input.primaryColor,
          secondaryColor: input.secondaryColor,
          defaultLanguage: input.defaultLanguage,
          defaultDirection: input.defaultDirection,
          supportEmail: emptyToNull(input.supportEmail),
          sourceCodeUrl: input.sourceCodeUrl,
          privacyPolicyUrl: emptyToNull(input.privacyPolicyUrl),
          termsUrl: emptyToNull(input.termsUrl),
          dataRetentionDays: input.dataRetentionDays
        }
      });
      await tx.allowedDomain.deleteMany();
      const domains = splitLines(input.allowedDomains);
      if (domains.length) {
        await tx.allowedDomain.createMany({
          data: domains.map((domain) => ({ domain })),
          skipDuplicates: true
        });
      }
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "settings_updated",
      entity: "AppSettings",
      entityId: settings.id
    });
    return NextResponse.json({ message: "Settings saved." });
  } catch (error) {
    return errorResponse(error);
  }
}

