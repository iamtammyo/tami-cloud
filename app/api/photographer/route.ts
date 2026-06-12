import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const GENRES = [
  "portrait", "street", "landscape", "documentary", "fashion", "architecture",
  "wildlife", "still-life", "abstract", "macro", "travel", "fine-art",
  "photojournalism",
] as const;

const MOODS = [
  "moody", "bright", "minimal", "dramatic", "intimate", "energetic",
  "melancholic", "serene",
] as const;

const SYSTEM = `You are a photography historian building a reference library entry.
Given a photographer's name, respond with JSON only — no prose, no markdown, no code fences.

Schema:
{
  "isPhotographer": boolean (false if this is not a real, notable photographer you are confident about),
  "name": string (canonical full name),
  "era": string ("YYYY–YYYY" for deceased, "YYYY–" for living; use an en dash),
  "country": string (primary nationality/base, short form like "USA", "Japan"),
  "styles": 1-4 entries from [${GENRES.map((g) => `"${g}"`).join(",")}], primary first,
  "moods": 1-3 entries from [${MOODS.map((m) => `"${m}"`).join(",")}] their work most evokes,
  "contemporary": boolean (their primary influence is from the 1990s onward and/or they are actively working),
  "signature": string (one sentence, <=18 words, describing their visual signature),
  "bio": string (1-2 sentences, <=45 words, concrete: key series/books/firsts),
  "wikipediaTitle": string (exact English Wikipedia article title with underscores, e.g. "Alex_Webb_(photographer)"),
  "quote": string (optional — ONLY include if a quote is widely and reliably attributed to them; otherwise omit the key)
}

Accuracy rules: if you are not confident the person is a real, documented photographer, set isPhotographer to false and leave other fields empty. Never invent dates, books, or quotes. If unsure of the Wikipedia title, give your best guess of the most likely title.`;

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
  if (!name || name.length > 80) {
    return NextResponse.json(
      { error: "A photographer name (<=80 chars) is required." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Build the library entry for: ${name}`,
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
    return NextResponse.json(
      { error: `Claude API error — ${detail}` },
      { status: 502 },
    );
  }

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json(
      { error: "No text response from model." },
      { status: 502 },
    );
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    return NextResponse.json(
      { error: "Model did not return JSON.", raw },
      { status: 502 },
    );
  }

  let parsed: {
    isPhotographer?: boolean;
    name?: string;
    era?: string;
    country?: string;
    styles?: string[];
    moods?: string[];
    contemporary?: boolean;
    signature?: string;
    bio?: string;
    wikipediaTitle?: string;
    quote?: string;
  };
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    return NextResponse.json(
      { error: "Failed to parse model JSON.", raw },
      { status: 502 },
    );
  }

  if (!parsed.isPhotographer) {
    return NextResponse.json(
      { error: `Couldn't verify "${name}" as a documented photographer.` },
      { status: 422 },
    );
  }

  const styles = (parsed.styles ?? []).filter((s): s is (typeof GENRES)[number] =>
    (GENRES as readonly string[]).includes(s),
  );
  const moods = (parsed.moods ?? []).filter((m): m is (typeof MOODS)[number] =>
    (MOODS as readonly string[]).includes(m),
  );
  if (!parsed.name || !parsed.signature || !parsed.bio || styles.length === 0) {
    return NextResponse.json(
      { error: "Model returned an incomplete profile.", raw },
      { status: 502 },
    );
  }

  return NextResponse.json({
    profile: {
      name: parsed.name,
      era: parsed.era ?? "",
      country: parsed.country ?? "",
      styles,
      moods,
      contemporary: !!parsed.contemporary,
      signature: parsed.signature,
      bio: parsed.bio,
      wikipediaTitle:
        parsed.wikipediaTitle ?? parsed.name.replace(/\s+/g, "_"),
      ...(parsed.quote ? { quote: parsed.quote } : {}),
    },
  });
}
