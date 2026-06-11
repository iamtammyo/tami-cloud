import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

type CameraContext = {
  fullName: string;
  detailed: boolean;
  controls?: {
    aperture: string;
    shutterSpeed: string;
    iso: string;
    exposureCompensation: string;
    modes: string;
    signature?: string;
  };
};

type ExifContext = {
  cameraMake?: string;
  cameraModel?: string;
  lensModel?: string;
  focalLength?: number;
  aperture?: number;
  shutterSeconds?: number;
  iso?: number;
};

function formatExifForPrompt(exif: ExifContext): string {
  const parts: string[] = [];
  const cam = [exif.cameraMake, exif.cameraModel].filter(Boolean).join(" ");
  if (cam) parts.push(`camera: ${cam}`);
  if (exif.lensModel) parts.push(`lens: ${exif.lensModel}`);
  if (typeof exif.focalLength === "number") parts.push(`focal length: ${Math.round(exif.focalLength)}mm`);
  if (typeof exif.aperture === "number") parts.push(`aperture: f/${exif.aperture >= 10 ? Math.round(exif.aperture) : exif.aperture.toFixed(1).replace(/\.0$/, "")}`);
  if (typeof exif.shutterSeconds === "number") {
    const s = exif.shutterSeconds;
    parts.push(`shutter: ${s >= 1 ? `${s}s` : `1/${Math.round(1 / s)}s`}`);
  }
  if (typeof exif.iso === "number") parts.push(`ISO ${Math.round(exif.iso)}`);
  return parts.join(", ");
}

const BASE_SYSTEM = `You are a thoughtful photography critic and educator helping an amateur photographer learn.
Given a single photograph, analyze it and respond with JSON only — no prose, no markdown, no code fences.

Schema:
{
  "genre": one of ["portrait","street","landscape","documentary","fashion","architecture","wildlife","still-life","abstract","macro","travel","fine-art","photojournalism"],
  "subjects": string[] (2-5 short noun phrases of what's in frame),
  "mood": one of ["moody","bright","minimal","dramatic","intimate","energetic","melancholic","serene"],
  "palette": string[] (3-5 plain-English color names dominating the image, e.g. "warm amber","slate blue"),
  "paletteHex": string[] (CSS hex codes matching "palette" entries in order, e.g. "#b4762a"),
  "composition": string (1-2 sentences on framing, leading lines, balance, rule of thirds, etc.),
  "lighting": string (1-2 sentences on quality/direction/contrast of light),
  "technique": string (1-2 sentences on apparent technical choices — DOF, shutter, focal length feel),
  "strengths": string[] (2-3 bullets, each <=14 words),
  "improvements": string[] (2-3 concrete, kind suggestions, each <=18 words),
  "similarPhotographers": string[] (2-4 well-known photographers whose published style this evokes, full names),
  "oneLine": string (a single evocative sentence describing the image, <=20 words),
  "cameraTips": string[] (0-3 actionable, body-specific instructions; see CAMERA section below)
}

Be specific and grounded in what you actually see. When EXIF is provided, ground the "technique" field in the actual numbers (don't guess; use them). Keep the tone warm, like a mentor.`;

function buildSystemPrompt(
  camera: CameraContext | null,
  skillLevel: string | null,
  mainSubjects: string[],
  exif: ExifContext | null,
): string {
  let extra = "";
  if (exif) {
    const line = formatExifForPrompt(exif);
    if (line) {
      extra += `\n\nEXIF: ${line}. Use these actual settings in your "technique" field rather than guessing. If suggesting changes, anchor them to what they actually shot.`;
    }
  }
  if (camera) {
    if (camera.detailed && camera.controls) {
      extra += `\n\nCAMERA: The photographer shoots with a ${camera.fullName}. When you suggest technique changes, phrase the relevant ones in 1–3 "cameraTips" entries using exact dial/button names from their camera. Reference its real controls:
- Aperture: ${camera.controls.aperture}
- Shutter speed: ${camera.controls.shutterSpeed}
- ISO: ${camera.controls.iso}
- Exposure compensation: ${camera.controls.exposureCompensation}
- Modes: ${camera.controls.modes}${
        camera.controls.signature ? `\n- Signature feature: ${camera.controls.signature}` : ""
      }
Each cameraTip should be one sentence (<=22 words), action-oriented, and concrete (e.g. "Turn the aperture ring on your lens to f/2.8 to soften the background"). Do not repeat advice that's already in 'improvements'. If no body-specific tip is helpful, return an empty array.`;
    } else {
      extra += `\n\nCAMERA: The photographer shoots with a ${camera.fullName}. Reference the camera by name in 1–2 "cameraTips" entries when relevant, but stay general about controls since exact dial layout is unknown.`;
    }
  } else {
    extra += `\n\nCAMERA: The photographer hasn't told us their camera. Return cameraTips as an empty array.`;
  }
  if (skillLevel) {
    extra += `\n\nSKILL LEVEL: ${skillLevel}. Adjust the depth of explanation accordingly — a beginner needs vocabulary defined; an advanced shooter wants nuance, not basics.`;
  }
  if (mainSubjects.length > 0) {
    extra += `\n\nUSUAL SUBJECTS: ${mainSubjects.join(", ")}. Keep this in mind as context, but do not force comparisons.`;
  }
  return BASE_SYSTEM + extra;
}

type Body = {
  imageBase64?: string;
  mediaType?: string;
  camera?: CameraContext | null;
  skillLevel?: string | null;
  mainSubjects?: string[];
  exif?: ExifContext | null;
};

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

  const { imageBase64, mediaType, camera, skillLevel, mainSubjects, exif } = body;
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

  const system = buildSystemPrompt(
    camera ?? null,
    skillLevel ?? null,
    Array.isArray(mainSubjects) ? mainSubjects : [],
    exif ?? null,
  );

  const client = new Anthropic({ apiKey });

  let message: Anthropic.Message;
  try {
    message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1300,
      system,
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
  } catch (err) {
    const detail =
      err instanceof Anthropic.APIError
        ? `${err.status ?? ""} ${err.name}: ${err.message}`.trim()
        : err instanceof Error
          ? err.message
          : String(err);
    console.error("[analyze] Anthropic call failed:", detail);
    return NextResponse.json(
      { error: `Claude API error — ${detail}` },
      { status: 502 },
    );
  }

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
