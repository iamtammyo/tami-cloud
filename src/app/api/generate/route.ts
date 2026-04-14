import { NextRequest, NextResponse } from "next/server";
import { generateIdeas } from "@/lib/claude";
import { buildSystemPrompt } from "@/lib/prompt-builder";
import type { GenerateRequest, GenerateResponse } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Anthropic API key not configured",
        } satisfies GenerateResponse,
        { status: 501 }
      );
    }

    const body: GenerateRequest = await request.json();

    if (
      !body.extractedContent?.title ||
      !body.extractedContent?.sections?.length
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Extracted content with title and sections is required",
        } satisfies GenerateResponse,
        { status: 400 }
      );
    }

    const platforms =
      body.platforms?.length > 0
        ? body.platforms
        : (["linkedin", "threads", "bluesky"] as const);
    const toneProfile = body.toneProfile || "default";

    const systemPrompt = buildSystemPrompt([...platforms], toneProfile);
    const result = await generateIdeas(
      body.extractedContent,
      [...platforms],
      systemPrompt
    );

    return NextResponse.json({
      success: true,
      data: {
        sourceContent: body.extractedContent,
        ideas: result.ideas,
        generatedAt: new Date().toISOString(),
        modelUsed: "claude-sonnet-4-20250514",
        tokenUsage: result.usage,
      },
    } satisfies GenerateResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return NextResponse.json(
      { success: false, error: message } satisfies GenerateResponse,
      { status: 500 }
    );
  }
}
