import { NextRequest, NextResponse } from "next/server";
import { logIdeaToNotion } from "@/lib/notion-client";
import type { NotionLogResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Notion integration not configured",
        } satisfies NotionLogResponse,
        { status: 501 }
      );
    }

    const body = await request.json();
    const { idea, sourceTitle, sourceUrl } = body;

    if (!idea || !sourceTitle || !sourceUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Idea, source title, and source URL are required",
        } satisfies NotionLogResponse,
        { status: 400 }
      );
    }

    const pageId = await logIdeaToNotion(idea, sourceTitle, sourceUrl);

    return NextResponse.json({
      success: true,
      pageId,
    } satisfies NotionLogResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to log to Notion";
    return NextResponse.json(
      { success: false, error: message } satisfies NotionLogResponse,
      { status: 500 }
    );
  }
}
