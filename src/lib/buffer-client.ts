import type { Platform } from "@/types";

const BUFFER_GRAPHQL_ENDPOINT = "https://graph.bufferapp.com/graphql";

const CREATE_IDEA_MUTATION = `
  mutation CreateIdea($input: CreateIdeaInput!) {
    createIdea(input: $input) {
      ... on Idea {
        id
        content {
          title
          text
        }
      }
      ... on InvalidInputError {
        message
      }
      ... on UnexpectedError {
        message
      }
    }
  }
`;

interface BufferCreateIdeaResult {
  ideaId: string;
}

function platformToService(platform: Platform): string {
  switch (platform) {
    case "linkedin":
      return "linkedin";
    case "threads":
      return "threads";
    case "bluesky":
      return "bluesky";
  }
}

export async function pushIdeaToBuffer(
  content: string,
  platform: Platform,
  ideaType: string,
  sourceTitle: string
): Promise<BufferCreateIdeaResult> {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  const organizationId = process.env.BUFFER_ORGANIZATION_ID;

  if (!token || !organizationId) {
    throw new Error("Buffer API credentials not configured");
  }

  const title = `[${platform.charAt(0).toUpperCase() + platform.slice(1)}] ${ideaType}: ${sourceTitle}`;

  const response = await fetch(BUFFER_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: CREATE_IDEA_MUTATION,
      variables: {
        input: {
          organizationId,
          content: {
            title: title.slice(0, 200),
            text: content,
            services: [platformToService(platform)],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Buffer API returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors?.length > 0) {
    throw new Error(`Buffer GraphQL error: ${data.errors[0].message}`);
  }

  const result = data.data?.createIdea;

  if (result?.message) {
    throw new Error(`Buffer error: ${result.message}`);
  }

  if (!result?.id) {
    throw new Error("Unexpected Buffer API response: no idea ID returned");
  }

  return { ideaId: result.id };
}

export async function pushIdeasBatch(
  ideas: {
    content: string;
    platform: Platform;
    ideaType: string;
    sourceTitle: string;
  }[]
): Promise<{ index: number; ideaId?: string; error?: string }[]> {
  const results: { index: number; ideaId?: string; error?: string }[] = [];

  for (let i = 0; i < ideas.length; i++) {
    try {
      const result = await pushIdeaToBuffer(
        ideas[i].content,
        ideas[i].platform,
        ideas[i].ideaType,
        ideas[i].sourceTitle
      );
      results.push({ index: i, ideaId: result.ideaId });
    } catch (error) {
      results.push({
        index: i,
        error: error instanceof Error ? error.message : "Push failed",
      });
    }

    // Small delay between requests to avoid rate limiting
    if (i < ideas.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}
