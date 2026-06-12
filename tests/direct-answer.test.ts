import { describe, expect, it, vi } from "vitest";
import { findDirectKnowledgeAnswer } from "../src/lib/rag/direct-answer";

const db = vi.hoisted(() => ({
  documentFindFirst: vi.fn(),
  knowledgeEntryFindMany: vi.fn()
}));

vi.mock("@/src/lib/db/prisma", () => ({
  prisma: {
    document: {
      findFirst: db.documentFindFirst
    },
    knowledgeEntry: {
      findMany: db.knowledgeEntryFindMany
    }
  }
}));

describe("findDirectKnowledgeAnswer", () => {
  it("returns the stored answer for an exact Arabic question", async () => {
    db.knowledgeEntryFindMany.mockResolvedValue([
      {
        id: "entry-variant",
        botId: null,
        title: "تحية",
        question: "سلام، سلام عليكم، هلا، كيفك",
        content: "ياهلا فيك",
        sourceUrl: null
      },
      {
        id: "entry-exact",
        botId: null,
        title: "تحية عامة",
        question: "السلام عليكم",
        content: "وعليكم السلام ورحمة الله وبركاته",
        sourceUrl: null
      }
    ]);
    db.documentFindFirst.mockResolvedValue({ id: "doc-exact", sourceUrl: null });

    const result = await findDirectKnowledgeAnswer({
      botId: "bot-1",
      question: "السلام عليكم"
    });

    expect(result?.answer).toBe("وعليكم السلام ورحمة الله وبركاته");
    expect(result?.sources[0]).toMatchObject({
      documentId: "doc-exact",
      score: 1,
      title: "تحية عامة"
    });
  });

  it("prefers a bot-specific exact answer over an all-bots answer", async () => {
    db.knowledgeEntryFindMany.mockResolvedValue([
      {
        id: "entry-global",
        botId: null,
        title: "Global greeting",
        question: "hello",
        content: "Hello from all bots",
        sourceUrl: null
      },
      {
        id: "entry-bot",
        botId: "bot-1",
        title: "Bot greeting",
        question: "hello",
        content: "Hello from this bot",
        sourceUrl: null
      }
    ]);
    db.documentFindFirst.mockResolvedValue(null);

    const result = await findDirectKnowledgeAnswer({
      botId: "bot-1",
      question: "hello"
    });

    expect(result?.answer).toBe("Hello from this bot");
    expect(result?.sources[0].documentId).toBe("entry-bot");
  });
});
