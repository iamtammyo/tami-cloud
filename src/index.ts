#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getPost,
  getPublicationMetadata,
  listPosts,
  searchPosts,
} from "./substack.js";

const TOOLS: Tool[] = [
  {
    name: "list_posts",
    description:
      "List recent posts from a public Substack publication. Returns title, subtitle, post_date, canonical_url, slug, audience, and a truncated body preview.",
    inputSchema: {
      type: "object",
      properties: {
        publication: {
          type: "string",
          description:
            "Substack subdomain (e.g. 'platformer'), full host (e.g. 'www.platformer.news'), or any URL pointing at the publication.",
        },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 12 },
        offset: { type: "integer", minimum: 0, default: 0 },
        sort: { type: "string", enum: ["new", "top"], default: "new" },
      },
      required: ["publication"],
      additionalProperties: false,
    },
  },
  {
    name: "get_post",
    description:
      "Fetch a single Substack post in full, including body_html. Pass either a post URL or a (publication, slug) pair.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Direct post URL, e.g. https://www.platformer.news/p/some-slug",
        },
        publication: { type: "string" },
        slug: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_posts",
    description:
      "Substring-search a publication's archive (title/subtitle/description/preview). Substack has no documented per-publication search API, so this pages through the archive client-side.",
    inputSchema: {
      type: "object",
      properties: {
        publication: { type: "string" },
        query: { type: "string", minLength: 1 },
        limit: { type: "integer", minimum: 1, maximum: 50, default: 10 },
        max_scanned: {
          type: "integer",
          minimum: 1,
          maximum: 500,
          default: 200,
          description: "Maximum number of archive posts to scan before stopping.",
        },
      },
      required: ["publication", "query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_publication_metadata",
    description:
      "Get basic metadata about a Substack publication (name, subdomain, custom_domain, author, description) derived from its public archive.",
    inputSchema: {
      type: "object",
      properties: {
        publication: { type: "string" },
      },
      required: ["publication"],
      additionalProperties: false,
    },
  },
];

const server = new Server(
  { name: "substack-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  try {
    const result = await dispatch(name, args as Record<string, unknown>);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
});

async function dispatch(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_posts":
      return listPosts(requireString(args, "publication"), {
        limit: optionalNumber(args, "limit"),
        offset: optionalNumber(args, "offset"),
        sort: args.sort === "top" ? "top" : args.sort === "new" ? "new" : undefined,
      });
    case "get_post":
      return getPost({
        url: optionalString(args, "url"),
        publication: optionalString(args, "publication"),
        slug: optionalString(args, "slug"),
      });
    case "search_posts":
      return searchPosts(requireString(args, "publication"), requireString(args, "query"), {
        limit: optionalNumber(args, "limit"),
        maxScanned: optionalNumber(args, "max_scanned"),
      });
    case "get_publication_metadata":
      return getPublicationMetadata(requireString(args, "publication"));
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function requireString(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== "string" || v.length === 0) {
    throw new Error(`Missing required string argument: ${key}`);
  }
  return v;
}

function optionalString(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function optionalNumber(args: Record<string, unknown>, key: string): number | undefined {
  const v = args[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server runs until stdin closes.
}

main().catch((err) => {
  console.error("substack-mcp fatal:", err);
  process.exit(1);
});
