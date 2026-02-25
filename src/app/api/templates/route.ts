import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const templates = await prisma.template.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, content, category, platform, tags, sourcePostIds, isAiGenerated, userId } = body;

    const template = await prisma.template.create({
      data: {
        name,
        description,
        content,
        category,
        platform,
        tags: JSON.stringify(tags || []),
        sourcePostIds: JSON.stringify(sourcePostIds || []),
        isAiGenerated: isAiGenerated || false,
        userId: userId || "default-user",
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
