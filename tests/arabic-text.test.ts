import { describe, expect, it } from "vitest";
import { repairArabicTextDirection } from "../src/lib/documents/arabic-text";

describe("repairArabicTextDirection", () => {
  it("repairs reversed Arabic PDF lines", () => {
    expect(
      repairArabicTextDirection("\u061f\u062a\u0627\u0645\u062f\u062e\u0644\u0627 \u0646\u0639 \u0629\u0644\u0626\u0633\u0623")
    ).toBe("\u0623\u0633\u0626\u0644\u0629 \u0639\u0646 \u0627\u0644\u062e\u062f\u0645\u0627\u062a\u061f");
  });

  it("keeps readable Arabic lines unchanged", () => {
    expect(
      repairArabicTextDirection("\u0623\u0633\u0626\u0644\u0629 \u0639\u0646 \u0627\u0644\u062e\u062f\u0645\u0627\u062a")
    ).toBe("\u0623\u0633\u0626\u0644\u0629 \u0639\u0646 \u0627\u0644\u062e\u062f\u0645\u0627\u062a");
  });

  it("repairs reversed Arabic words in mixed PDF lines", () => {
    expect(
      repairArabicTextDirection("\u0641\u064a \u0646\u0635\u062a \u0629\u0642\u064a\u062b\u0648\u0644\u0627: \u0645\u0627\u0639")
    ).toBe("\u0641\u064a \u0646\u0635\u062a \u0627\u0644\u0648\u062b\u064a\u0642\u0629: \u0639\u0627\u0645");
  });

  it("repairs common reversed legal-document terms", () => {
    expect(
      repairArabicTextDirection("\u0646\u0648\u0643\u062a \u0638\u0627\u0641\u0644\u0644\u0623\u0644")
    ).toBe("\u062a\u0643\u0648\u0646 \u0644\u0644\u0623\u0644\u0641\u0627\u0638");
  });

  it("cleans common Arabic PDF font fragments", () => {
    expect(
      repairArabicTextDirection(
        "\u0627\u0644\u0626\u062d\u0629 \u0646\u0642\u0644\n\u0629\u064a\u0640 \u0640\u0640\u0640\u0640\u0640\u0635\u062e\u0640 \u0640\u0640\u0640\u0640\u0640\u0634\u0644\u0627"
      )
    ).toBe("\u0644\u0627\u0626\u062d\u0629 \u0646\u0642\u0644\n\u0627\u0644\u0634\u062e\u0635\u064a\u0629");
  });

  it("preserves non-Arabic lines", () => {
    expect(repairArabicTextDirection("English line\n123")).toBe("English line\n123");
  });
});
