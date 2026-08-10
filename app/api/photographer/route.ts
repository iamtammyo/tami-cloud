import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
// Web search adds several round trips before the model answers.
export const maxDuration = 60;

const GENRES = [
  "portrait",
  "street",
  "landscape",
  "documentary",
  "fashion",
  "architecture",
  "wildlife",
  "still-life",
  "abstract",
  "macro",
  "travel",
  "fine-art",
  "photojournalism",
] as const;

const SOURCE_TIERS = ["institution", "personal", "press", "reference", "other"] as const;
type SourceTier = (typeof SOURCE_TIERS)[number];

/**
 * Domains that can't support a factual claim about a photographer: image
 * aggregators, stock libraries, marketplaces, fan wikis, and unsourced Q&A.
 * Deliberately short — `blocked_domains` and `allowed_domains` are mutually
 * exclusive, and an allowlist can't enumerate every small gallery or personal
 * site, so source *ranking* is done in the prompt instead.
 */
const BLOCKED_DOMAINS = [
  "pinterest.com",
  "pinterest.co.uk",
  "shutterstock.com",
  "gettyimages.com",
  "alamy.com",
  "istockphoto.com",
  "dreamstime.com",
  "123rf.com",
  "ebay.com",
  "etsy.com",
  "amazon.com",
  "fandom.com",
  "quora.com",
  "reddit.com",
  "ranker.com",
  "listverse.com",
];

const SYSTEM = `You are a photography historian compiling a reference card. Search the web first, then respond with JSON only — no prose, no markdown, no code fences.

SEARCH STRATEGY
Run 2-4 searches before answering. Rank what you find by source tier, and prefer a claim that appears in a higher tier:
1. institution — museums, public galleries, foundations, biennials, university collections, national archives
2. personal — the photographer's own website, studio site, or estate/archive
3. press — photography magazines, newspapers, and critical publications with named editors
4. reference — encyclopedias
Blogs, marketplaces, image aggregators, and social posts are not acceptable evidence for a fact.
Useful queries: "<name> photographer", "<name> gallery exhibition", "<name> photographer interview", "<name> archive", "<name> monograph".

SCHEMA
{
  "found": boolean (true only if your searches identify a real photographer by this name),
  "name": string (full name, correctly spelled and accented),
  "era": string (life dates like "1908-2004", or "1975-" for a living photographer; "unknown" if sources don't say),
  "country": string (country most associated with their work),
  "styles": string[] (1-3 values, ONLY from: ${GENRES.join(", ")}),
  "signature": string (one sentence, <=20 words, describing what their work looks like),
  "bio": string (2-3 sentences on their significance, key series, and influence),
  "wikipediaTitle": string (English Wikipedia article title with underscores, e.g. "Henri_Cartier-Bresson"; "" if they have no article),
  "quote": string (a quote about photography, verbatim from a source you actually read, <=25 words; "" if you did not read one),
  "website": string (their own site or estate/archive URL; "" if none found),
  "sources": [{"url": string, "title": string, "tier": "institution"|"personal"|"press"|"reference"|"other"}] (2-6 entries, best tier first),
  "note": string ("" if confident; otherwise a one-sentence caveat)
}

ACCURACY RULES — these matter more than completeness
- Report only what your searches actually support. If they don't identify a photographer by this name, set found:false and stop.
- Never fabricate dates, nationalities, quotes, or URLs.
- Every "sources" URL must be one that appeared in your search results. Do not construct or guess URLs.
- If the name matches several notable people, pick the photographer and say so in "note".
- If sources disagree on a fact, use the higher-tier source and note the disagreement.
- styles MUST come from the allowed list. Map close concepts (e.g. "conceptual" -> "fine-art", "war photography" -> "photojournalism").`;

type Body = { name?: string };

type ModelSource = { url: string; title: string; tier: SourceTier };

/** Hostname without `www.`, or null when the URL doesn't parse. */
function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Hostnames the model actually received from the search tool. Anything it
 * cites outside this set was not in its results, so we drop it rather than
 * show the user a URL the model may have invented.
 */
function searchedHosts(content: Anthropic.ContentBlock[]): Set<string> {
  const hosts = new Set<string>();
  for (const block of content) {
    if (block.type !== "web_search_tool_result") continue;
    // A successful result carries a list; an error carries a single object.
    if (!Array.isArray(block.content)) continue;
    for (const result of block.content) {
      const url = (result as { url?: unknown }).url;
      if (typeof url !== "string") continue;
      const host = hostOf(url);
      if (host) hosts.add(host);
    }
  }
  return hosts;
}

/** Concatenated text across every text block (web search interleaves them). */
function allText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Outermost balanced `{...}`, tolerating code fences and surrounding prose. */
function extractJson(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "A photographer name is required." }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Photographer: ${name}\n\nSearch the web, then return JSON exactly matching the schema.`,
    },
  ];

  let message: Anthropic.Message;
  // The server-side search loop can stop at `pause_turn`; re-send to resume.
  const MAX_CONTINUATIONS = 3;
  try {
    for (let attempt = 0; ; attempt++) {
      message = await client.messages.create({
        model: "claude-opus-5",
        // Thinking is on by default on Opus 5 and shares this budget with the
        // response, so leave headroom well beyond the JSON itself.
        max_tokens: 8000,
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 6,
            blocked_domains: BLOCKED_DOMAINS,
          },
        ],
        messages,
      });
      if (message.stop_reason !== "pause_turn") break;
      if (attempt >= MAX_CONTINUATIONS) break;
      messages.push({ role: "assistant", content: message.content });
    }
  } catch (err) {
    const detail =
      err instanceof Anthropic.APIError
        ? `${err.status ?? ""} ${err.name}: ${err.message}`.trim()
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[photographer] Anthropic call failed:", detail);
    return NextResponse.json({ error: `Claude API error — ${detail}` }, { status: 502 });
  }

  if (message.stop_reason === "refusal") {
    return NextResponse.json(
      { error: "That request was declined. Try a different photographer." },
      { status: 422 },
    );
  }

  if (message.stop_reason === "pause_turn") {
    return NextResponse.json(
      { error: "Research took too many steps. Try again, or use a fuller name." },
      { status: 504 },
    );
  }

  const raw = allText(message.content).trim();
  const json = extractJson(raw);
  if (!json) {
    console.error("[photographer] No JSON in response:", raw.slice(0, 500));
    return NextResponse.json({ error: "Model did not return JSON." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to parse model JSON." }, { status: 502 });
  }

  if (parsed.found === false) {
    return NextResponse.json(
      {
        error: `Searches didn't turn up a photographer called "${name}". Check the spelling, or try their full name.`,
      },
      { status: 404 },
    );
  }

  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  // Constrain styles to the app's genre enum so filtering can't break.
  const styles = (Array.isArray(parsed.styles) ? parsed.styles : [])
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toLowerCase().trim())
    .filter((s) => (GENRES as readonly string[]).includes(s))
    .slice(0, 3);
  if (styles.length === 0) styles.push("fine-art");

  // Keep only citations whose host the model genuinely saw in search results.
  const hosts = searchedHosts(message.content);
  const rawSources = Array.isArray(parsed.sources) ? parsed.sources : [];
  const seen = new Set<string>();
  const sources: ModelSource[] = [];
  for (const entry of rawSources) {
    if (!entry || typeof entry !== "object") continue;
    const url = str((entry as { url?: unknown }).url);
    const host = hostOf(url);
    if (!host || !hosts.has(host) || seen.has(url)) continue;
    seen.add(url);
    const tierRaw = str((entry as { tier?: unknown }).tier).toLowerCase();
    const tier: SourceTier = (SOURCE_TIERS as readonly string[]).includes(tierRaw)
      ? (tierRaw as SourceTier)
      : "other";
    sources.push({
      url,
      title: str((entry as { title?: unknown }).title, host),
      tier,
    });
    if (sources.length >= 6) break;
  }

  const resolvedName = str(parsed.name, name);
  const searchCount = message.usage?.server_tool_use?.web_search_requests ?? 0;

  return NextResponse.json({
    photographer: {
      id: `custom-${resolvedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
      name: resolvedName,
      era: str(parsed.era, "unknown"),
      country: str(parsed.country, "—"),
      styles,
      signature: str(parsed.signature),
      bio: str(parsed.bio),
      wikipediaTitle: str(parsed.wikipediaTitle, resolvedName.replace(/\s+/g, "_")),
      quote: str(parsed.quote) || undefined,
      website: str(parsed.website) || undefined,
      sources,
      searchCount,
      custom: true,
      note: str(parsed.note) || undefined,
    },
  });
}
