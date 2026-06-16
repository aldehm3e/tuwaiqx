import { prisma } from "@/src/lib/db/prisma";

const activeBotWhere = {
  isActive: true,
  isArchived: false
};

export async function resolveActiveBot(botId: string) {
  const bot = await prisma.bot.findFirst({
    where: {
      OR: [{ id: botId }, { slug: botId }],
      ...activeBotWhere
    }
  });

  if (bot || botId !== "main") {
    return bot;
  }

  const activeBots = await prisma.bot.findMany({
    where: activeBotWhere,
    take: 2
  });

  return activeBots.length === 1 ? activeBots[0] : null;
}

export async function resolveActiveBotWithProviders(botId: string) {
  const bot = await prisma.bot.findFirst({
    where: {
      OR: [{ id: botId }, { slug: botId }],
      ...activeBotWhere
    },
    include: {
      modelProvider: true,
      embeddingProvider: true
    }
  });

  if (bot || botId !== "main") {
    return bot;
  }

  const activeBots = await prisma.bot.findMany({
    where: activeBotWhere,
    include: {
      modelProvider: true,
      embeddingProvider: true
    },
    take: 2
  });

  return activeBots.length === 1 ? activeBots[0] : null;
}
