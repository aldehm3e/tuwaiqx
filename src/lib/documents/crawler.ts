import * as cheerio from "cheerio";

export type CrawledPage = {
  url: string;
  title: string;
  text: string;
};

function normalizeUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return null;
  }
}

function extractText(html: string, url: string): CrawledPage {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, noscript").remove();
  const title = $("title").first().text().trim() || url;
  const text = $("body").text().replace(/\s+/g, " ").trim();
  return { url, title, text };
}

export async function crawlWebsite(input: {
  url: string;
  depth: number;
  sameDomain: boolean;
  maxPages?: number;
}) {
  const origin = new URL(input.url).origin;
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: input.url, depth: 0 }];
  const pages: CrawledPage[] = [];
  const maxPages = input.maxPages ?? 20;

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current.url)) {
      continue;
    }
    visited.add(current.url);

    const response = await fetch(current.url, {
      headers: { "user-agent": "TuwaiqX crawler (+self-hosted knowledge ingestion)" }
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
      continue;
    }
    const html = await response.text();
    const page = extractText(html, current.url);
    if (page.text.length > 100) {
      pages.push(page);
    }

    if (current.depth >= input.depth) {
      continue;
    }

    const $ = cheerio.load(html);
    $("a[href]").each((_index, element) => {
      const href = $(element).attr("href");
      if (!href) {
        return;
      }
      const normalized = normalizeUrl(href, current.url);
      if (!normalized || visited.has(normalized)) {
        return;
      }
      if (input.sameDomain && new URL(normalized).origin !== origin) {
        return;
      }
      queue.push({ url: normalized, depth: current.depth + 1 });
    });
  }

  return pages;
}

