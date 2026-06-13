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

    expect(messages[0].content).toContain("Answer only in English");
  });

  it("forces Arabic when the response language is Arabic", () => {
    const messages = buildRagMessages({
      botName: "Main Website Assistant",
      botSystemPrompt: "Be helpful.",
      question: "\u0645\u0627 \u0647\u064a \u0627\u0644\u062e\u062f\u0645\u0627\u062a\u061f",
      strictMode: true,
      allowGeneralAnswer: false,
      preferredLanguage: "ar",
      botLanguage: "en",
      maxAnswerLength: 500,
      chunks: [
        {
          title: "Services",
          documentId: "doc_1",
          chunkIndex: 0,
          score: 0.9,
          content: "The organization provides volunteer and donation services."
        }
      ]
    });

    expect(messages[0].content).toContain("Answer only in Arabic");
    expect(messages[0].content).toContain("Do not answer in English");
  });
});
