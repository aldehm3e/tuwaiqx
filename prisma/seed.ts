import { prisma } from "@/src/lib/db/prisma";
import { hashPassword } from "@/src/lib/auth/password";
import { rolePermissions } from "@/src/lib/auth/permissions";
import { getEnv } from "@/src/lib/config/env";
import { indexTextDocument } from "@/src/lib/documents/indexer";

async function main() {
  const env = getEnv();

  for (const [name, permissions] of Object.entries(rolePermissions)) {
    await prisma.role.upsert({
      where: { name },
      update: { permissions },
      create: {
        name,
        description: `${name} role`,
        permissions
      }
    });
  }

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { name: "Owner" } });
  const ownerEmail = process.env.FIRST_RUN_ADMIN_EMAIL || "owner@peaceful-aid.example";
  const ownerPassword = process.env.FIRST_RUN_ADMIN_PASSWORD || "change-this-demo-password";

  const owner = await prisma.adminUser.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: "Peaceful Aid Owner",
      passwordHash: await hashPassword(ownerPassword),
      roles: { create: { roleId: ownerRole.id } }
    }
  });

  const ollama = await prisma.modelProvider.upsert({
    where: { id: "seed-ollama-provider" },
    update: {
      baseUrl: env.OLLAMA_BASE_URL,
      chatModel: env.OLLAMA_CHAT_MODEL,
      embeddingModel: env.OLLAMA_EMBEDDING_MODEL,
      isDefaultChat: true,
      isDefaultEmbedding: true
    },
    create: {
      id: "seed-ollama-provider",
      name: "Ollama Local",
      type: "OLLAMA",
      baseUrl: env.OLLAMA_BASE_URL,
      chatModel: env.OLLAMA_CHAT_MODEL,
      embeddingModel: env.OLLAMA_EMBEDDING_MODEL,
      isDefaultChat: true,
      isDefaultEmbedding: true
    }
  });

  const settings = await prisma.appSettings.findFirst();
  if (!settings) {
    await prisma.appSettings.create({
      data: {
        organizationName: "Peaceful Aid NGO",
        websiteUrl: "https://peaceful-aid.example",
        primaryColor: "#0f7b55",
        secondaryColor: "#2563eb",
        defaultLanguage: "en",
        defaultDirection: "ltr",
        supportEmail: "support@peaceful-aid.example",
        sourceCodeUrl: env.SOURCE_CODE_URL,
        defaultChatProviderId: ollama.id,
        defaultEmbeddingProviderId: ollama.id,
        setupCompletedAt: new Date()
      }
    });
  }

  await prisma.allowedDomain.upsert({
    where: { domain: "peaceful-aid.example" },
    update: {},
    create: { domain: "peaceful-aid.example" }
  });

  const mainBot = await prisma.bot.upsert({
    where: { slug: "main" },
    update: {},
    create: {
      slug: "main",
      name: "Main Website Assistant",
      description: "Answers public questions about Peaceful Aid NGO.",
      welcomeMessage: "Hello. I can help with Peaceful Aid programs, volunteering, and donations.",
      fallbackMessage: "I could not find that information in the approved Peaceful Aid knowledge base.",
      systemPrompt: "You are Peaceful Aid NGO's public website assistant. Be concise and cite approved sources.",
      primaryColor: "#0f7b55",
      modelProviderId: ollama.id,
      embeddingProviderId: ollama.id,
      strictMode: true,
      showSources: true
    }
  });

  const volunteerBot = await prisma.bot.upsert({
    where: { slug: "volunteer" },
    update: {},
    create: {
      slug: "volunteer",
      name: "Volunteer Assistant",
      description: "Helps volunteers understand requirements and application steps.",
      welcomeMessage: "I can help you learn how to volunteer with Peaceful Aid.",
      fallbackMessage: "I could not find that volunteer detail in the approved knowledge base.",
      systemPrompt: "You help prospective volunteers. Use approved knowledge and suggest a human handoff when needed.",
      primaryColor: "#2563eb",
      modelProviderId: ollama.id,
      embeddingProviderId: ollama.id,
      strictMode: true,
      showSources: true
    }
  });

  const donationBot = await prisma.bot.upsert({
    where: { slug: "donation" },
    update: {},
    create: {
      slug: "donation",
      name: "Donation Assistant",
      description: "Explains donation programs and where to find the external donation page.",
      welcomeMessage: "I can explain Peaceful Aid donation options.",
      fallbackMessage: "I could not find that donation detail in the approved knowledge base.",
      systemPrompt: "You explain donation information. Do not process payments; direct users to approved external donation links.",
      primaryColor: "#0f7b55",
      modelProviderId: ollama.id,
      embeddingProviderId: ollama.id,
      strictMode: true,
      showSources: true
    }
  });

  const supportBot = await prisma.bot.upsert({
    where: { slug: "support" },
    update: {},
    create: {
      slug: "support",
      name: "Support Assistant",
      description: "Helps visitors find contact and urgent support information.",
      welcomeMessage: "I can help you find Peaceful Aid support options.",
      fallbackMessage: "I could not find that support detail in the approved knowledge base.",
      systemPrompt: "You explain support options using approved knowledge and suggest a human handoff when needed.",
      primaryColor: "#0f7b55",
      modelProviderId: ollama.id,
      embeddingProviderId: ollama.id,
      strictMode: true,
      showSources: true
    }
  });

  const existingDocs = await prisma.document.count();
  if (existingDocs === 0) {
    await indexTextDocument({
      botId: mainBot.id,
      title: "Peaceful Aid public programs",
      sourceType: "manual",
      approved: true,
      createdById: owner.id,
      content:
        "Peaceful Aid NGO provides food support, school supplies, winter clothing, and community workshops. The public office is open Sunday through Thursday from 9:00 to 16:00. For urgent support requests, visitors should use the contact form or email support@peaceful-aid.example."
    });
    await indexTextDocument({
      botId: volunteerBot.id,
      title: "Volunteer FAQ",
      sourceType: "faq",
      approved: true,
      createdById: owner.id,
      content:
        "Question: How can I volunteer?\n\nAnswer: Volunteers can apply through the volunteer application form. New volunteers attend a one-hour orientation and choose either event support, logistics, translation, or community outreach."
    });
    await indexTextDocument({
      botId: donationBot.id,
      title: "Donation information",
      sourceType: "manual",
      approved: true,
      createdById: owner.id,
      content:
        "Peaceful Aid accepts in-kind donations such as sealed food, school supplies, blankets, and hygiene kits. Monetary donations are handled through the organization's external donation page at https://peaceful-aid.example/donate. TuwaiqX does not process payments."
    });
    await indexTextDocument({
      botId: supportBot.id,
      title: "Support contact information",
      sourceType: "manual",
      approved: true,
      createdById: owner.id,
      content:
        "Visitors who need urgent support should use the contact form or email support@peaceful-aid.example. The public office is open Sunday through Thursday from 9:00 to 16:00."
    });
    await indexTextDocument({
      botId: mainBot.id,
      title: "معلومات عربية عن المؤسسة",
      sourceType: "manual",
      approved: true,
      createdById: owner.id,
      content:
        "تقدم منظمة Peaceful Aid مساعدات غذائية ومستلزمات مدرسية وملابس شتوية وورش عمل مجتمعية. ساعات العمل من الأحد إلى الخميس من الساعة 9 صباحا حتى 4 مساء. يمكن طلب المساعدة عبر نموذج التواصل أو البريد الإلكتروني support@peaceful-aid.example."
    });
  }

  await prisma.form.upsert({
    where: { slug: "volunteer-application" },
    update: {},
    create: {
      slug: "volunteer-application",
      name: "Volunteer Application",
      description: "Apply to volunteer with Peaceful Aid NGO.",
      submitLabel: "Apply",
      botId: volunteerBot.id,
      fields: {
        createMany: {
          data: [
            { label: "Name", name: "name", type: "text", required: true, order: 0 },
            { label: "Email", name: "email", type: "email", required: true, order: 1 },
            { label: "Phone", name: "phone", type: "phone", required: false, order: 2 },
            { label: "Why do you want to volunteer?", name: "message", type: "textarea", required: true, order: 3 }
          ]
        }
      }
    }
  });

  console.log("Seed data ready.");
  console.log(`Demo owner: ${ownerEmail}`);
  if (!process.env.FIRST_RUN_ADMIN_PASSWORD) {
    console.log("Demo password: change-this-demo-password");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
