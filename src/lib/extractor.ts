import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ExtractedContent, Section } from "@/types";

export async function extractBlogContent(
  url: string
): Promise<ExtractedContent> {
  const parsedUrl = new URL(url);

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RepurposeEngine/1.0; +https://github.com/iamtammyo/tami-cloud)",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = extractTitle($);
  if (!title) {
    throw new Error("Could not find article title on this page");
  }

  const author = extractAuthor($);
  const lastUpdated = extractDate($);
  const sections = extractSections($);

  if (sections.length === 0) {
    throw new Error("Could not find article content on this page");
  }

  const allText = sections.map((s) => s.content).join(" ");
  const dataPoints = extractDataPoints(allText);
  const quotableLines = extractQuotableLines(sections);

  const topInsights = extractTopInsights(sections);

  return {
    url,
    title,
    author,
    lastUpdated,
    sections,
    topInsights,
    dataPoints,
    quotableLines,
  };
}

function extractTitle($: cheerio.CheerioAPI): string | null {
  const h1 = $("h1").first().text().trim();
  if (h1) return h1;

  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle) return ogTitle.trim();

  const metaTitle = $("title").text().trim();
  if (metaTitle) return metaTitle;

  return null;
}

function extractAuthor($: cheerio.CheerioAPI): string | null {
  const metaAuthor = $('meta[name="author"]').attr("content");
  if (metaAuthor) return metaAuthor.trim();

  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  for (const data of jsonLd) {
    if (data.author) {
      if (typeof data.author === "string") return data.author;
      if (data.author.name) return data.author.name;
    }
  }

  const authorEl = $('[class*="author"] a, [rel="author"]').first().text().trim();
  if (authorEl) return authorEl;

  return null;
}

function extractDate($: cheerio.CheerioAPI): string | null {
  const articleDate = $('meta[property="article:published_time"]').attr(
    "content"
  );
  if (articleDate) return articleDate;

  const modifiedDate = $('meta[property="article:modified_time"]').attr(
    "content"
  );
  if (modifiedDate) return modifiedDate;

  const timeEl = $("time[datetime]").first().attr("datetime");
  if (timeEl) return timeEl;

  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).html() || "");
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  for (const data of jsonLd) {
    if (data.dateModified) return data.dateModified;
    if (data.datePublished) return data.datePublished;
  }

  return null;
}

function extractSections($: cheerio.CheerioAPI): Section[] {
  const sections: Section[] = [];

  // Find the main article body
  const articleBody =
    $("article").first().length > 0
      ? $("article").first()
      : $("main").first().length > 0
        ? $("main").first()
        : $('[class*="content"], [class*="post"], [class*="article"]').first();

  if (!articleBody.length) {
    return [];
  }

  // Collect all heading + content pairs
  const headings = articleBody.find("h2, h3");

  if (headings.length === 0) {
    // No headings found, treat the entire article as one section
    const fullText = articleBody
      .find("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 0)
      .join("\n\n");

    if (fullText) {
      sections.push({
        heading: "Main Content",
        content: fullText,
        keyInsights: extractKeyInsightsFromText($, articleBody),
        dataPoints: extractDataPoints(fullText),
        quotes: extractBlockquotes($, articleBody),
      });
    }
    return sections;
  }

  headings.each((i, headingEl) => {
    const heading = $(headingEl).text().trim();
    if (!heading) return;

    // Collect text between this heading and the next
    const contentParts: string[] = [];
    let sibling = $(headingEl).next();
    while (
      sibling.length &&
      !sibling.is("h2") &&
      !sibling.is("h3")
    ) {
      if (sibling.is("p, ul, ol, blockquote, div")) {
        const text = sibling.text().trim();
        if (text) contentParts.push(text);
      }
      sibling = sibling.next();
    }

    const content = contentParts.join("\n\n");
    if (!content) return;

    sections.push({
      heading,
      content,
      keyInsights: extractKeyInsightsFromContent(content),
      dataPoints: extractDataPoints(content),
      quotes: extractBlockquotesFromContent($, headingEl, sibling.get(0)),
    });
  });

  return sections;
}

function extractKeyInsightsFromText(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<AnyNode>
): string[] {
  const insights: string[] = [];

  // Look for bold/strong text as key insights
  container.find("strong, b").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 15 && text.length < 200) {
      insights.push(text);
    }
  });

  return insights.slice(0, 5);
}

function extractKeyInsightsFromContent(content: string): string[] {
  const insights: string[] = [];

  // Sentences that contain signal words
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  const signalWords = [
    "key",
    "important",
    "crucial",
    "essential",
    "finding",
    "found that",
    "shows that",
    "suggests",
    "according to",
    "research",
    "study",
  ];

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    if (signalWords.some((w) => lower.includes(w))) {
      insights.push(sentence.trim());
    }
  }

  return insights.slice(0, 3);
}

function extractDataPoints(text: string): string[] {
  const dataPoints: string[] = [];
  const patterns = [
    /\d+(?:\.\d+)?%\s+[^.!?]+[.!?]/g, // "43% of marketers..."
    /\$\d+(?:,\d{3})*(?:\.\d+)?[^.!?]*[.!?]/g, // "$1,000..."
    /\d+(?:,\d{3})+[^.!?]*[.!?]/g, // Large numbers "10,000..."
    /\d+x\s+[^.!?]+[.!?]/g, // "3x more..."
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const trimmed = match.trim();
        if (trimmed.length > 10 && trimmed.length < 300) {
          dataPoints.push(trimmed);
        }
      }
    }
  }

  // Deduplicate
  return [...new Set(dataPoints)].slice(0, 10);
}

function extractBlockquotes(
  $: cheerio.CheerioAPI,
  container: cheerio.Cheerio<AnyNode>
): string[] {
  const quotes: string[] = [];
  container.find("blockquote").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 10) {
      quotes.push(text);
    }
  });
  return quotes;
}

function extractBlockquotesFromContent(
  $: cheerio.CheerioAPI,
  startEl: AnyNode,
  endEl: AnyNode | undefined
): string[] {
  const quotes: string[] = [];
  let sibling = $(startEl).next();
  while (sibling.length && sibling.get(0) !== endEl) {
    if (sibling.is("blockquote")) {
      const text = sibling.text().trim();
      if (text.length > 10) {
        quotes.push(text);
      }
    }
    sibling = sibling.next();
  }
  return quotes;
}

function extractQuotableLines(sections: Section[]): string[] {
  const quotable: string[] = [];

  for (const section of sections) {
    // All blockquotes are quotable
    quotable.push(...section.quotes);

    // Find short, punchy sentences that work as standalone hooks
    const sentences = section.content.split(/[.!?]+/).filter((s) => {
      const trimmed = s.trim();
      return trimmed.length > 30 && trimmed.length < 150;
    });

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      // Look for sentences that sound like standalone insights
      if (
        /^(The |Most |Every |If you |When |What |People |This |It's |We )/.test(
          trimmed
        ) &&
        !trimmed.toLowerCase().includes("click here") &&
        !trimmed.toLowerCase().includes("read more")
      ) {
        quotable.push(trimmed);
      }
    }
  }

  return [...new Set(quotable)].slice(0, 10);
}

function extractTopInsights(sections: Section[]): string[] {
  const allInsights: string[] = [];

  for (const section of sections) {
    allInsights.push(...section.keyInsights);
  }

  // Also pull the first sentence of each section as a potential insight
  for (const section of sections) {
    const firstSentence = section.content.split(/[.!?]/)[0]?.trim();
    if (firstSentence && firstSentence.length > 20 && firstSentence.length < 200) {
      allInsights.push(firstSentence);
    }
  }

  return [...new Set(allInsights)].slice(0, 5);
}
