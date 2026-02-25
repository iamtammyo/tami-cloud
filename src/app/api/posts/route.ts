import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { engagementRate: "desc" },
      include: { account: true },
    });
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, content, likes, comments, shares, impressions, userId, accountId } = body;

    const totalEngagements = (likes || 0) + (comments || 0) + (shares || 0);
    const engagementRate = impressions > 0 ? (totalEngagements / impressions) * 100 : 0;

    const post = await prisma.post.create({
      data: {
        platform,
        content,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
        impressions: impressions || 0,
        reach: Math.floor((impressions || 0) * 0.7),
        engagementRate: Math.round(engagementRate * 10) / 10,
        isTopPerformer: engagementRate > 5,
        publishedAt: new Date(),
        externalId: `manual-${Date.now()}`,
        userId: userId || "default-user",
        accountId: accountId || "default-account",
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
