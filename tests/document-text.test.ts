import { describe, expect, it } from "vitest";
import { readableTextForIndexing } from "../src/lib/documents/text";

describe("readableTextForIndexing", () => {
  it("rejects scanned or blank PDFs instead of indexing zero chunks", () => {
    expect(() =>
      readableTextForIndexing({
        parsedText: "\n \f \n",
        parsedFromFile: true,
        filename: "rules.pdf",
        mimeType: "application/pdf"
      })
    ).toThrow(/No readable text could be extracted from this PDF/);
  });

  it("keeps real extracted text", () => {
    expect(
      readableTextForIndexing({
        parsedText: "  readable text  ",
        parsedFromFile: true,
        filename: "rules.pdf",
        mimeType: "application/pdf"
      })
    ).toBe("readable text");
  });

  it("allows title fallback only when no file buffer was parsed", () => {
    expect(
      readableTextForIndexing({
        fallbackTitle: "Manual title",
        parsedFromFile: false
      })
    ).toBe("Manual title");
  });
});
