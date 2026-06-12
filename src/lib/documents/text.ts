function isPdf(input: { filename?: string | null; mimeType?: string | null }) {
  return input.mimeType?.toLowerCase().includes("pdf") || input.filename?.toLowerCase().endsWith(".pdf");
}

export function readableTextForIndexing(input: {
  parsedText?: string | null;
  fallbackTitle?: string | null;
  parsedFromFile: boolean;
  filename?: string | null;
  mimeType?: string | null;
}) {
  const parsedText = input.parsedText?.trim() || "";
  if (input.parsedFromFile) {
    if (parsedText) {
      return parsedText;
    }

    const fileType = isPdf(input) ? "PDF" : "document";
    throw new Error(
      `No readable text could be extracted from this ${fileType}. If it is scanned or image-only, run OCR first or upload a text/OCR version.`
    );
  }

  const fallback = input.fallbackTitle?.trim() || "";
  if (!fallback) {
    throw new Error("No readable text could be extracted from this document.");
  }

  return fallback;
}
