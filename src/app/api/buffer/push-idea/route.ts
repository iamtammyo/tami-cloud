import { NextRequest, NextResponse } from "next/server";
import { pushIdeaToBuffer } from "@/lib/buffer-client";
import type { BufferPushResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BUFFER_ACCESS_TOKEN || !process.env.BUFFER_ORGANIZATION_ID) {
      return NextResponse.json(
        {
          success: false,
          error: "Buffer API credentials not configured",
        } satisfies BufferPushResponse,
        { status: 501 }
      );
    }

    const body = await request.json();
    const { idea } = body;

    if (!idea?.content || !idea?.platform) {
      return NextResponse.json(
        {
          success: false,
          error: "Idea content and platform are required",
        } satisfies BufferPushResponse,
        { status: 400 }
      );
    }

    const result = await pushIdeaToBuffer(
      idea.content,
      idea.platform,
      idea.ideaType || "general",
      idea.sourceTitle || "Blog Post"
    );

    return NextResponse.json({
      success: true,
      ideaId: result.ideaId,
    } satisfies BufferPushResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to push to Buffer";
    return NextResponse.json(
      { success: false, error: message } satisfies BufferPushResponse,
      { status: 500 }
    );
  }
}
