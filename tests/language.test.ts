import { describe, expect, it } from "vitest";
import {
  detectQuestionLanguage,
  fallbackForLanguage,
  resolveResponseLanguage
} from "../src/lib/rag/language";

describe("chat response language", () => {
  it("detects Arabic questions", () => {
    expect(detectQuestionLanguage("\u0645\u0627 \u0647\u064a \u0627\u0644\u062e\u062f\u0645\u0627\u062a\u061f")).toBe("ar");
  });

  it("lets the question language override the widget language", () => {
    expect(
      resolveResponseLanguage({
        preferredLanguage: "en",
        botLanguage: "en",
        question: "\u0645\u0627 \u0647\u064a \u0627\u0644\u062e\u062f\u0645\u0627\u062a\u061f"
      })
    ).toBe("ar");
  });

  it("falls back to the selected language when the question language is unclear", () => {
    expect(
      resolveResponseLanguage({
        preferredLanguage: "ar",
        botLanguage: "en",
        question: "123"
      })
    ).toBe("ar");
  });

  it("localizes the default fallback for Arabic responses", () => {
    expect(
      fallbackForLanguage("I could not find that information in the approved knowledge base.", "ar")
    ).toContain("\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629");
  });
});
