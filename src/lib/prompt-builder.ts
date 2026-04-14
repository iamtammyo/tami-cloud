import type { Platform, ExtractedContent } from "@/types";
import {
  getPlatformConfig,
  getGlobalRules,
  getToneProfile,
} from "./config-loader";

export function buildSystemPrompt(
  platforms: Platform[],
  toneProfileName: string
): string {
  const globalRules = getGlobalRules();
  const toneProfile = getToneProfile(toneProfileName);

  const parts: string[] = [];

  parts.push(
    "You are a social media content strategist creating platform-specific posts from blog articles."
  );
  parts.push(
    "Your job is to generate ready-to-post content ideas that are specific, substantive, and human-sounding."
  );
  parts.push("");

  // Global anti-patterns
  parts.push("ABSOLUTE RULES — NEVER BREAK THESE:");
  for (const rule of globalRules.antiPatterns) {
    parts.push(`- ${rule}`);
  }
  parts.push("");

  // Brand voice
  parts.push("BRAND VOICE:");
  for (const attr of globalRules.brandVoiceDefaults) {
    parts.push(`- ${attr}`);
  }
  parts.push("");

  // Content principles
  parts.push("CONTENT PRINCIPLES:");
  for (const principle of globalRules.contentPrinciples) {
    parts.push(`- ${principle}`);
  }
  parts.push("");

  // Tone profile
  parts.push(`TONE PROFILE: ${toneProfile.name}`);
  parts.push(`${toneProfile.description}`);
  parts.push("Voice attributes:");
  for (const attr of toneProfile.voiceAttributes) {
    parts.push(`- ${attr}`);
  }
  parts.push("Example phrases to channel (don't copy literally):");
  for (const phrase of toneProfile.examplePhrases) {
    parts.push(`- "${phrase}"`);
  }
  parts.push("Phrases to avoid:");
  for (const phrase of toneProfile.avoidPhrases) {
    parts.push(`- "${phrase}"`);
  }
  parts.push("");

  // Per-platform instructions
  parts.push("PLATFORMS:");
  for (const platform of platforms) {
    const config = getPlatformConfig(platform);
    parts.push("---");
    parts.push(
      `${config.displayName.toUpperCase()} (max ${config.maxCharacters} characters per post)`
    );
    parts.push("");

    parts.push(
      `Generate exactly ${config.ideaTypes.reduce((sum, t) => sum + t.count, 0)} idea(s):`
    );
    for (const ideaType of config.ideaTypes) {
      parts.push(
        `${ideaType.count}x "${ideaType.label}" (type: "${ideaType.type}"): ${ideaType.description}`
      );
    }
    parts.push("");

    parts.push("Tone guidelines:");
    for (const guideline of config.toneGuidelines) {
      parts.push(`- ${guideline}`);
    }
    parts.push("");

    parts.push("Structure rules:");
    for (const rule of config.structureRules) {
      parts.push(`- ${rule}`);
    }
    parts.push("");

    if (config.hookFormula) {
      parts.push(`Hook formula: ${config.hookFormula}`);
      parts.push("");
    }

    parts.push(`Hashtag strategy: ${config.hashtagStrategy}`);
    parts.push("");
  }

  // Output format
  parts.push("OUTPUT FORMAT:");
  parts.push("Respond with ONLY a JSON array. No other text before or after.");
  parts.push("Each element in the array must have these fields:");
  parts.push('- "platform": one of ' + platforms.map((p) => `"${p}"`).join(", "));
  parts.push(
    '- "ideaType": the type string from the idea type definitions above'
  );
  parts.push('- "content": the full post text, ready to publish');
  parts.push("");
  parts.push("For thread-style posts (quick-tip-thread, mini-thread), separate each post in the thread with \\n---\\n");
  parts.push("");
  parts.push("Example output structure:");
  parts.push("```json");
  parts.push("[");
  parts.push('  { "platform": "linkedin", "ideaType": "thought-leadership", "content": "..." },');
  parts.push('  { "platform": "threads", "ideaType": "hot-take", "content": "..." }');
  parts.push("]");
  parts.push("```");

  return parts.join("\n");
}

export function buildUserPrompt(
  content: ExtractedContent,
  platforms: Platform[]
): string {
  const parts: string[] = [];

  parts.push(`SOURCE ARTICLE: "${content.title}"`);
  parts.push(`URL: ${content.url}`);
  if (content.author) {
    parts.push(`Author: ${content.author}`);
  }
  if (content.lastUpdated) {
    parts.push(`Last updated: ${content.lastUpdated}`);
  }
  parts.push("");

  parts.push("ARTICLE CONTENT:");
  for (const section of content.sections) {
    parts.push(`## ${section.heading}`);
    parts.push(section.content);
    parts.push("");
  }

  if (content.topInsights.length > 0) {
    parts.push("TOP INSIGHTS:");
    for (const insight of content.topInsights) {
      parts.push(`- ${insight}`);
    }
    parts.push("");
  }

  if (content.dataPoints.length > 0) {
    parts.push("DATA POINTS & STATISTICS:");
    for (const dp of content.dataPoints) {
      parts.push(`- ${dp}`);
    }
    parts.push("");
  }

  if (content.quotableLines.length > 0) {
    parts.push("QUOTABLE LINES:");
    for (const quote of content.quotableLines) {
      parts.push(`- "${quote}"`);
    }
    parts.push("");
  }

  parts.push(
    `Generate content ideas for: ${platforms.map((p) => p.toUpperCase()).join(", ")}`
  );
  parts.push(
    "Follow the platform-specific instructions from the system prompt exactly."
  );

  return parts.join("\n");
}
