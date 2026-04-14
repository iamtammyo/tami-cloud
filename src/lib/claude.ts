import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { ExtractedContent, GeneratedIdea, Platform } from "@/types";
import { buildUserPrompt } from "./prompt-builder";

const client = new Anthropic();

interface RawIdea {
  platform: Platform;
  ideaType: string;
  content: string;
}

export async function generateIdeas(
  content: ExtractedContent,
  platforms: Platform[],
  systemPrompt: string
): Promise<{
  ideas: GeneratedIdea[];
  usage: { inputTokens: number; outputTokens: number };
}> {
  const userPrompt = buildUserPrompt(content, platforms);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.7,
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const rawIdeas = parseJsonResponse(textContent.text);

  const ideas: GeneratedIdea[] = rawIdeas.map((raw) => ({
    id: randomUUID(),
    platform: raw.platform,
    ideaType: raw.ideaType as GeneratedIdea["ideaType"],
    content: raw.content,
    characterCount: raw.content.length,
    sourceUrl: content.url,
    generatedAt: new Date().toISOString(),
    edited: false,
    editedContent: null,
    pushStatus: "pending",
    bufferIdeaId: null,
    pushError: null,
  }));

  return {
    ideas,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}

function parseJsonResponse(text: string): RawIdea[] {
  // Try to extract JSON from code fences first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;

  try {
    const parsed = JSON.parse(jsonStr.trim());
    if (!Array.isArray(parsed)) {
      throw new Error("Response is not a JSON array");
    }
    return validateRawIdeas(parsed);
  } catch (firstError) {
    // If code fence extraction failed, try the raw text
    if (fenceMatch) {
      try {
        const parsed = JSON.parse(text.trim());
        if (Array.isArray(parsed)) {
          return validateRawIdeas(parsed);
        }
      } catch {
        // Fall through to error
      }
    }
    throw new Error(
      `Failed to parse Claude response as JSON: ${firstError instanceof Error ? firstError.message : "Unknown error"}`
    );
  }
}

function validateRawIdeas(parsed: unknown[]): RawIdea[] {
  const validPlatforms = ["linkedin", "threads", "bluesky"];
  const ideas: RawIdea[] = [];

  for (const item of parsed) {
    if (
      typeof item === "object" &&
      item !== null &&
      "platform" in item &&
      "ideaType" in item &&
      "content" in item
    ) {
      const raw = item as Record<string, unknown>;
      if (
        typeof raw.platform === "string" &&
        validPlatforms.includes(raw.platform) &&
        typeof raw.ideaType === "string" &&
        typeof raw.content === "string"
      ) {
        ideas.push({
          platform: raw.platform as Platform,
          ideaType: raw.ideaType,
          content: raw.content,
        });
      }
    }
  }

  if (ideas.length === 0) {
    throw new Error("No valid ideas found in Claude response");
  }

  return ideas;
}
