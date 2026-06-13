import { prisma } from "@/src/lib/db/prisma";
import { providerFromDb } from "@/src/lib/ai/factory";
import { findDirectKnowledgeAnswer } from "@/src/lib/rag/direct-answer";
import { fallbackForLanguage, resolveResponseLanguage } from "@/src/lib/rag/language";
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

function ticketSubject(question: string) {
  const normalized = question.replace(/\s+/g, " ").trim() || "Visitor request";
  const prefix = "Chat handoff: ";
  const maxQuestionLength = 200 - prefix.length;
  return `${prefix}${normalized.length > maxQuestionLength ? `${normalized.slice(0, maxQuestionLength - 3)}...` : normalized}`;
}

function ticketMessage(input: { question: string; answer: string }) {
  return [`Visitor question:`, input.question, "", `Assistant response:`, input.answer].join("\n").slice(0, 4000);
}

function wantsHumanHandoff(message: string) {
  const arabicTriggers = [
    "\u062a\u0630\u0643\u0631\u0629",
    "\u0645\u0648\u0638\u0641",
    "\u0645\u0645\u062b\u0644",
    "\u0634\u062e\u0635",
    "\u0625\u0646\u0633\u0627\u0646",
    "\u0627\u0646\u0633\u0627\u0646",
    "\u0628\u0634\u0631",
    "\u062a\u0648\u0627\u0635\u0644\u0648\u0627 \u0645\u0639\u064a",
    "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u064a",
    "\u0643\u0644\u0645\u0646\u064a",
    "\u0643\u0644\u0645\u0648\u0646\u064a",
    "\u0627\u0644\u062f\u0639\u0645 \u0627\u0644\u0641\u0646\u064a",
    "\u0641\u0631\u064a\u0642 \u0627\u0644\u062f\u0639\u0645",
    "\u062e\u062f\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
    "\u0627\u0631\u0641\u0639 \u0637\u0644\u0628"
  ];

  return (
    /\b(human|person|agent|representative|ticket|handoff|contact me|call me|support team)\b/i.test(message) ||
    arabicTriggers.some((trigger) => message.includes(trigger))
  );
}

function handoffAnswer(language?: "en" | "ar") {
  return language === "ar"
    ? "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u062a\u0630\u0643\u0631\u0629 \u062f\u0639\u0645 \u0644\u0647\u0630\u0647 \u0627\u0644\u0645\u062d\u0627\u062f\u062b\u0629 \u062d\u062a\u0649 \u064a\u062a\u0645\u0643\u0646 \u0627\u0644\u0641\u0631\u064a\u0642 \u0645\u0646 \u0645\u0631\u0627\u062c\u0639\u062a\u0647\u0627 \u0648\u0645\u062a\u0627\u0628\u0639\u062a\u0647\u0627."
    : "I created a support ticket for this conversation so the team can review and follow up.";
}

export async function answerQuestion(input: {
  botId: string;
  conversationId?: string;
  visitorId?: string;
  language?: "en" | "ar";
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

  const responseLanguage = resolveResponseLanguage({
    preferredLanguage: input.language,
    botLanguage: bot.language,
    question: input.message
  });
  const fallbackMessage = fallbackForLanguage(bot.fallbackMessage, responseLanguage);
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
  const shouldCreateHandoffTicket = !directAnswer?.answer && wantsHumanHandoff(input.message);
  let answer = directAnswer?.answer;

  if (!answer && shouldCreateHandoffTicket) {
    answer = handoffAnswer(responseLanguage);
  }

  if (!answer) {
    const embeddingProvider = providerFromDb(bot.embeddingProvider || defaultEmbeddingProvider || bot.modelProvider);
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
      ? fallbackMessage
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
              preferredLanguage: responseLanguage,
              maxAnswerLength: bot.maxAnswerLength
            }),
            temperature: bot.temperature,
            maxTokens: Math.max(128, Math.ceil(bot.maxAnswerLength / 4))
          })
        ).content || fallbackMessage;
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
        handoffSuggested: shouldFallback || shouldCreateHandoffTicket
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

  if (shouldFallback || shouldCreateHandoffTicket) {
    if (!savedConversation.handoffSuggested) {
      await prisma.conversation.update({
        where: { id: savedConversation.id },
        data: { handoffSuggested: true }
      });
    }
  }

  if (shouldFallback) {
    await prisma.knowledgeGap.create({
      data: {
        botId: bot.id,
        conversationId: savedConversation.id,
        question: input.message
      }
    });
  }

  if (shouldFallback || shouldCreateHandoffTicket) {
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        conversationId: savedConversation.id,
        status: { in: ["open", "pending"] }
      },
      select: { id: true }
    });

    if (!existingTicket) {
      await prisma.ticket.create({
        data: {
          conversationId: savedConversation.id,
          botId: bot.id,
          subject: ticketSubject(input.message),
          message: ticketMessage({ question: input.message, answer }),
          priority: "normal"
        }
      });
    }
  }

  return {
    conversationId: savedConversation.id,
    messageId: assistantMessage.id,
    answer,
    sources: bot.showSources ? savedSources : [],
    handoffSuggested: shouldFallback || shouldCreateHandoffTicket
  };
}
