import { describe, expect, it } from "vitest";
import { buildRagMessages } from "../src/lib/rag/prompt";

describe("buildRagMessages", () => {
  it("includes strict-mode anti-hallucination instructions", () => {
    const messages = buildRagMessages({
      botName: "Main Website Assistant",
      botSystemPrompt: "Be helpful.",
      question: "What are office hours?",
      strictMode: true,
      allowGeneralAnswer: false,
      maxAnswerLength: 500,
      chunks: [
        {
          title: "Office hours",
          documentId: "doc_1",
          chunkIndex: 0,
          score: 0.9,
          content: "Open Sunday to Thursday."
        }
      ]
    });

    expect(messages[0].content).toContain("Answer only from the provided context");
    expect(messages[1].content).toContain("Open Sunday to Thursday");
  });

  it("uses a preferred response language when provided", () => {
    const messages = buildRagMessages({
      botName: "Main Website Assistant",
      botSystemPrompt: "Be helpful.",
      question: "What are office hours?",
      strictMode: false,
      allowGeneralAnswer: true,
      preferredLanguage: "en",
      botLanguage: "ar",
      maxAnswerLength: 500,
      chunks: []
    });

    expect(messages[0].content).toContain("Answer in English");
  });
});
