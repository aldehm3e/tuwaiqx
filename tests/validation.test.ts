import { describe, expect, it } from "vitest";
import { botSchema, chatSchema, setupSchema } from "../src/lib/validation/schemas";

describe("validation schemas", () => {
  it("rejects invalid bot slugs", () => {
    expect(() =>
      botSchema.parse({
        slug: "Main Bot",
        name: "Main Bot",
        welcomeMessage: "Hi",
        fallbackMessage: "Fallback",
        systemPrompt: "Prompt",
        primaryColor: "#0f7b55",
        language: "en",
        direction: "ltr"
      })
    ).toThrow();
  });

  it("limits public chat message size", () => {
    expect(() =>
      chatSchema.parse({ botId: "main", message: "x".repeat(5000) })
    ).toThrow();
  });

  it("accepts setup input", () => {
    const parsed = setupSchema.parse({
      adminEmail: "admin@example.org",
      adminPassword: "very-long-password",
      organizationName: "Example NGO",
      websiteUrl: "https://example.org"
    });
    expect(parsed.defaultDirection).toBe("ltr");
  });
});

