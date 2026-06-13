import { parse as parseCsv } from "csv-parse/sync";
import * as cheerio from "cheerio";
import ExcelJS from "exceljs";
import mammoth from "mammoth";
import { repairArabicTextDirection } from "./arabic-text";

export type ParsedDocument = {
  text: string;
  metadata?: Record<string, unknown>;
};

function ext(filename?: string | null) {
  return filename?.split(".").pop()?.toLowerCase() || "";
}

export async function parseDocument(input: {
  buffer: Buffer;
  mimeType?: string | null;
  filename?: string | null;
}): Promise<ParsedDocument> {
  const fileExt = ext(input.filename);
  const mime = input.mimeType || "";

  if (mime.includes("pdf") || fileExt === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(input.buffer);
    return { text: repairArabicTextDirection(data.text), metadata: { pages: data.numpages } };
  }

  if (
    mime.includes("wordprocessingml") ||
    mime.includes("msword") ||
    fileExt === "docx" ||
    fileExt === "doc"
  ) {
    const result = await mammoth.extractRawText({ buffer: input.buffer });
    return { text: result.value, metadata: { messages: result.messages } };
  }

  if (mime.includes("spreadsheet") || fileExt === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(input.buffer as unknown as ExcelJS.Buffer);
    const sheetNames: string[] = [];
    const text = workbook.worksheets
      .map((worksheet) => {
        sheetNames.push(worksheet.name);
        const rows: string[] = [];
        worksheet.eachRow((row) => {
          const values = Array.isArray(row.values) ? row.values.slice(1) : Object.values(row.values || {});
          rows.push(
            values
              .map((cell: unknown) => {
                if (cell == null) return "";
                if (typeof cell === "object" && "text" in cell) return String(cell.text);
                return String(cell);
              })
              .join(" | ")
          );
        });
        return `Sheet: ${worksheet.name}\n${rows.join("\n")}`;
      })
      .join("\n\n");
    return { text, metadata: { sheets: sheetNames } };
  }

  if (mime.includes("csv") || fileExt === "csv") {
    const records = parseCsv(input.buffer.toString("utf8"), { relax_column_count: true });
    return { text: records.map((row: string[]) => row.join(" | ")).join("\n") };
  }

  if (mime.includes("html") || fileExt === "html" || fileExt === "htm") {
    const $ = cheerio.load(input.buffer.toString("utf8"));
    $("script, style, noscript").remove();
    return { text: $("body").text().replace(/\s+/g, " ").trim() };
  }

  if (mime.includes("json") || fileExt === "json") {
    const parsed = JSON.parse(input.buffer.toString("utf8"));
    return { text: JSON.stringify(parsed, null, 2) };
  }

  return { text: input.buffer.toString("utf8") };
}
