import { NextRequest, NextResponse } from "next/server";
import { pushIdeasBatch } from "@/lib/buffer-client";
import type { BufferBatchPushResponse } from "@/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BUFFER_ACCESS_TOKEN || !process.env.BUFFER_ORGANIZATION_ID) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          error: "Buffer API credentials not configured",
        },
        { status: 501 }
      );
    }

    const body = await request.json();
    const { ideas } = body;

    if (!Array.isArray(ideas) || ideas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          results: [],
          error: "An array of ideas is required",
        },
        { status: 400 }
      );
    }

    const results = await pushIdeasBatch(ideas);

    const allSucceeded = results.every((r) => r.ideaId);

    return NextResponse.json({
      success: allSucceeded,
      results,
    } satisfies BufferBatchPushResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Batch push failed";
    return NextResponse.json(
      { success: false, results: [], error: message },
      { status: 500 }
    );
  }
}
