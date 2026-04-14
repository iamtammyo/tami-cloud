import { NextRequest, NextResponse } from "next/server";
import { extractBlogContent } from "@/lib/extractor";
import type { ExtractResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { success: false, error: "URL is required" } satisfies ExtractResponse,
        { status: 400 }
      );
    }

    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid URL format",
        } satisfies ExtractResponse,
        { status: 400 }
      );
    }

    const extracted = await extractBlogContent(body.url);

    return NextResponse.json({
      success: true,
      data: extracted,
    } satisfies ExtractResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Extraction failed";
    return NextResponse.json(
      { success: false, error: message } satisfies ExtractResponse,
      { status: 500 }
    );
  }
}
