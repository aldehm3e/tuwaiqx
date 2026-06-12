import { prisma } from "@/src/lib/db/prisma";
import { providerFromDb } from "@/src/lib/ai/factory";
import { findDirectKnowledgeAnswer } from "@/src/lib/rag/direct-answer";
import { buildRagMessages } from "@/src/lib/rag/prompt";
import { searchKnowledge } from "@/src/lib/rag/search";

export type ChatAnswer = {
  conversationId: string;
  messageId: string;
  answer: string;
  sources: Array<{
    title: string;
    documentId: string;
    sourceUrl?: string | null;
    pageNumber?: number | null;
    chunkIndex: number;
    score: number;
  }>;
  handoffSuggested: boolean;
};

export async function answerQuestion(input: {
  botId: string;
  conversationId?: string;
  visitorId?: string;
  message: string;
  pageUrl?: string;
}): Promise<ChatAnswer> {
  const startedAt = Date.now();
  const bot = await prisma.bot.findFirst({
    where: {
      OR: [{ id: input.botId }, { slug: input.botId }],
      isActive: true,
      isArchived: false
    },
    include: {
      modelProvider: true,
      embeddingProvider: true
    }
  });

  if (!bot) {
    throw new Error("Bot was not found or is inactive.");
  }

  const settings = await prisma.appSettings.findFirst();
  const [defaultChatProvider, defaultEmbeddingProvider] = await Promise.all([
    settings?.defaultChatProviderId
      ? prisma.modelProvider.findUnique({ where: { id: settings.defaultChatProviderId } })
      : null,
    settings?.defaultEmbeddingProviderId
      ? prisma.modelProvider.findUnique({ where: { id: settings.defaultEmbeddingProviderId } })
      : null
  ]);
  const directAnswer = await findDirectKnowledgeAnswer({ botId: bot.id, question: input.message });
  let chunks = directAnswer?.sources || [];
  let shouldFallback = false;
  let answer = directAnswer?.answer;

  if (!answer) {
    const embeddingProvider = providerFromDb(bot.embeddingProvider || bot.modelProvider || defaultEmbeddingProvider);
    const chatProvider = providerFromDb(bot.modelProvider || defaultChatProvider);

    let embedding: number[] | undefined;
    try {
      embedding = (await embeddingProvider.embed({ input: input.message })).embedding;
    } catch {
      embedding = undefined;
    }

    const contextOnly = bot.strictMode || !bot.allowGeneralAnswer;
    chunks = await searchKnowledge({
      botId: bot.id,
      query: input.message,
      embedding,
      topK: 6,
      threshold: contextOnly ? 0.18 : 0.08
    });

    const hasContext = chunks.length > 0;
    shouldFallback = contextOnly && !hasContext;
    answer = shouldFallback
      ? bot.fallbackMessage
      : (
          await chatProvider.complete({
            messages: buildRagMessages({
              organizationName: settings?.organizationName,
              botName: bot.name,
              botSystemPrompt: bot.systemPrompt,
              question: input.message,
              chunks,
              strictMode: bot.strictMode,
              allowGeneralAnswer: bot.allowGeneralAnswer,
              botLanguage: bot.language,
              maxAnswerLength: bot.maxAnswerLength
            }),
            temperature: bot.temperature,
            maxTokens: Math.max(128, Math.ceil(bot.maxAnswerLength / 4))
          })
        ).content || bot.fallbackMessage;
  }

  const conversation =
    input.conversationId &&
    (await prisma.conversation.findFirst({
      where: { id: input.conversationId, botId: bot.id }
    }));

  const savedConversation =
    conversation ||
    (await prisma.conversation.create({
      data: {
        botId: bot.id,
        visitorId: input.visitorId,
        pageUrl: input.pageUrl,
        handoffSuggested: shouldFallback
      }
    }));

  await prisma.message.create({
    data: {
      conversationId: savedConversation.id,
      role: "user",
      content: input.message
    }
  });

  const savedSources = chunks.map(({ content: _content, ...source }) => source);
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId: savedConversation.id,
      role: "assistant",
      content: answer,
      sourcesJson: savedSources,
      responseMs: Date.now() - startedAt
    }
  });

  if (shouldFallback) {
    await prisma.knowledgeGap.create({
      data: {
        botId: bot.id,
        conversationId: savedConversation.id,
        question: input.message
      }
    });
  }

  return {
    conversationId: savedConversation.id,
    messageId: assistantMessage.id,
    answer,
    sources: bot.showSources ? savedSources : [],
    handoffSuggested: shouldFallback
  };
}
