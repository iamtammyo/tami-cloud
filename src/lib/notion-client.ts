import { Client } from "@notionhq/client";
import type { GeneratedIdea } from "@/types";

function getNotionClient(): Client {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("Notion API key not configured");
  }
  return new Client({ auth: apiKey });
}

export async function logIdeaToNotion(
  idea: GeneratedIdea,
  sourceTitle: string,
  sourceUrl: string
): Promise<string> {
  const notion = getNotionClient();
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    throw new Error("Notion database ID not configured");
  }

  const content = idea.editedContent || idea.content;

  // Notion rich_text has a 2000 character limit per block
  const truncatedContent =
    content.length > 2000 ? content.slice(0, 1997) + "..." : content;

  const response = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: `[${idea.platform}] ${idea.ideaType}: ${sourceTitle}`.slice(0, 200),
            },
          },
        ],
      },
      "Source Article": {
        url: sourceUrl,
      },
      Platform: {
        select: { name: idea.platform },
      },
      "Idea Type": {
        select: { name: idea.ideaType },
      },
      Status: {
        select: {
          name: idea.pushStatus === "pushed" ? "Pushed to Buffer" : "Generated",
        },
      },
      "Generated Text": {
        rich_text: [
          {
            text: { content: truncatedContent },
          },
        ],
      },
      "Date Generated": {
        date: { start: idea.generatedAt.split("T")[0] },
      },
    },
  });

  return response.id;
}
