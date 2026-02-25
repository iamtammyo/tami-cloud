import { getAnthropicClient } from "./anthropic";
import type { Post } from "@/types";

interface GeneratedTemplate {
  name: string;
  content: string;
  category: string;
  explanation: string;
  placeholders: string[];
}

export async function generateTemplatesFromPosts(posts: Post[]): Promise<GeneratedTemplate[]> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const postsDescription = posts
    .map(
      (p, i) =>
        `Post ${i + 1} (${p.platform}, ${p.engagementRate}% engagement, ${p.likes} likes, ${p.comments} comments, ${p.shares} shares, ${p.impressions} impressions):\n"""${p.content}"""`
    )
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an expert social media strategist. Analyze these successful social media posts and generate reusable content templates.

Here are the posts with their engagement metrics:

${postsDescription}

Instructions:
1. Identify the common patterns across these successful posts — look at hooks, structure, tone, calls to action, formatting, and content types.
2. Generate 3-5 reusable template frameworks that capture the essence of what makes these posts work.
3. Each template should use [bracket] placeholders for customizable elements, e.g. [topic], [statistic], [audience], [benefit], [personal experience].
4. Categorize each template into one of: hook, story, engagement, educational, promotional, thread.
5. Explain why each pattern works based on the engagement data.

Return your response as a JSON object with this exact structure:
{
  "templates": [
    {
      "name": "Template Name",
      "content": "The template text with [placeholder] elements",
      "category": "category_name",
      "explanation": "Why this pattern works",
      "placeholders": ["placeholder1", "placeholder2"]
    }
  ]
}

Return ONLY the JSON object, no other text.`,
      },
    ],
  });

  const textContent = response.content.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  // Extract JSON from the response (handle potential markdown code blocks)
  let jsonStr = textContent.text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonStr);
  return parsed.templates;
}
