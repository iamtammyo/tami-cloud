import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `You are a thoughtful photography critic and educator helping an amateur photographer learn.
Given a single photograph, analyze it and respond with JSON only — no prose, no markdown, no code fences.

Schema:
{
  "genre": one of ["portrait","street","landscape","documentary","fashion","architecture","wildlife","still-life","abstract","macro","travel","fine-art","photojournalism"],
  "subjects": string[] (2-5 short noun phrases of what's in frame),
  "mood": one of ["moody","bright","minimal","dramatic","intimate","energetic","melancholic","serene"],
  "palette": string[] (3-5 plain-English color names dominating the image, e.g. "warm amber","slate blue"),
  "composition": string (1-2 sentences on framing, leading lines, balance, rule of thirds, etc.),
  "lighting": string (1-2 sentences on quality/direction/contrast of light),
  "technique": string (1-2 sentences on apparent technical choices — DOF, shutter, focal length feel),
  "strengths": string[] (2-3 bullets, each <=14 words),
  "improvements": string[] (2-3 concrete, kind suggestions, each <=18 words),
  "similarPhotographers": string[] (2-4 well-known photographers whose published style this evokes, full names),
  "oneLine": string (a single evocative sentence describing the image, <=20 words)
}

Be specific and grounded in what you actually see. Never invent EXIF. Keep the tone warm, like a mentor.`;

type Body = { imageBase64?: string; mediaType?: string };

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

  const { imageBase64, mediaType } = body;
  if (!imageBase64 || !mediaType) {
    return NextResponse.json(
      { error: "imageBase64 and mediaType are required." },
      { status: 400 },
    );
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
  if (!allowed.includes(mediaType as (typeof allowed)[number])) {
    return NextResponse.json(
      { error: `Unsupported mediaType. Must be one of ${allowed.join(", ")}.` },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1200,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as (typeof allowed)[number],
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze this photograph and return JSON exactly matching the schema.",
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No text response from model." }, { status: 502 });
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

  try {
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    return NextResponse.json({ analysis: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to parse model JSON.", raw },
      { status: 502 },
    );
  }
}
