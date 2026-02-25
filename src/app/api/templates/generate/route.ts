import { NextRequest, NextResponse } from "next/server";
import { generateTemplatesFromPosts } from "@/lib/template-engine";
import type { Post } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const posts: Post[] = body.posts;

    if (!posts || posts.length === 0) {
      return NextResponse.json({ error: "No posts provided" }, { status: 400 });
    }

    const templates = await generateTemplatesFromPosts(posts);
    return NextResponse.json({ templates });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate templates";
    console.error("Template generation error:", error);

    if (message.includes("ANTHROPIC_API_KEY")) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured. Add it to your .env.local file." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
