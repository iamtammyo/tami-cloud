import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 45;

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

const SYSTEM = `You are a photography historian. Given a photographer's name, return a factual reference-card entry as JSON only — no prose, no markdown, no code fences.

Schema:
{
  "found": boolean (true only if you genuinely know this photographer's published work; false if unsure or the name is ambiguous),
  "name": string (their full name, correctly spelled and accented),
  "era": string (life dates like "1908–2004", or "1975–" for living photographers; "unknown" if you can't recall),
  "country": string (country most associated with their work),
  "styles": string[] (1-3 values, ONLY from: ${GENRES.join(", ")}),
  "signature": string (one sentence, <=20 words, describing what their work looks like),
  "bio": string (2-3 sentences on their significance, key series, and influence),
  "wikipediaTitle": string (your best guess at their English Wikipedia article title, underscores for spaces, e.g. "Henri_Cartier-Bresson"),
  "quote": string (a well-documented quote of theirs about photography, <=20 words; empty string if you don't know one verbatim),
  "note": string (empty if confident; otherwise a one-sentence caveat about what you're unsure of)
}

Accuracy rules — these matter more than completeness:
- If you do not genuinely know this photographer, set found:false and leave other fields as best-effort or empty. Do NOT invent a biography.
- Never fabricate dates, nationalities, or quotes. If you don't know a quote verbatim, return "".
- If the name matches multiple people, pick the photographer and say so in "note".
- styles MUST come from the allowed list. Map close concepts (e.g. "conceptual" -> "fine-art", "war photography" -> "photojournalism").`;

type Body = { name?: string };

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

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Photographer: ${name}\n\nReturn JSON exactly matching the schema.`,
        },
      ],
    });
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

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text response from model." }, { status: 502 });
  }

  const raw = textBlock.text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    return NextResponse.json({ error: "Model did not return JSON." }, { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Failed to parse model JSON." }, { status: 502 });
  }

  if (parsed.found === false) {
    return NextResponse.json(
      {
        error: `I don't have reliable information about "${name}". Check the spelling, or try their full name.`,
      },
      { status: 404 },
    );
  }

  // Constrain styles to the allowed genre list so filtering/grouping never breaks.
  const rawStyles = Array.isArray(parsed.styles) ? parsed.styles : [];
  const styles = rawStyles
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toLowerCase().trim())
    .filter((s) => (GENRES as readonly string[]).includes(s))
    .slice(0, 3);

  if (styles.length === 0) styles.push("fine-art");

  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;

  const resolvedName = str(parsed.name, name);

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
      custom: true,
      note: str(parsed.note) || undefined,
    },
  });
}
