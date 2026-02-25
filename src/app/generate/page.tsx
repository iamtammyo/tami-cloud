"use client";

import { useState } from "react";
import { PostCard } from "@/components/post-card";
import { TemplateCard } from "@/components/template-card";
import { mockPosts } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wand2, Sparkles, Check, Loader2 } from "lucide-react";
import type { Template, GeneratedTemplate } from "@/types";

export default function GeneratePage() {
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState<Template[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const topPosts = mockPosts.filter((p) => p.isTopPerformer);

  const togglePost = (id: string) => {
    setSelectedPostIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedPostIds.length === 0) return;

    setGenerating(true);
    setGeneratedTemplates([]);

    try {
      const selectedPosts = mockPosts.filter((p) => selectedPostIds.includes(p.id));

      const response = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: selectedPosts }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate templates");
      }

      const data = await response.json();

      const templates: Template[] = data.templates.map((t: GeneratedTemplate, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        name: t.name,
        description: t.explanation,
        content: t.content,
        category: t.category,
        platform: null,
        tags: [],
        sourcePostIds: selectedPostIds,
        isAiGenerated: true,
        usageCount: 0,
        explanation: t.explanation,
        placeholders: t.placeholders,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setGeneratedTemplates(templates);
    } catch (error) {
      console.error("Generation error:", error);
      // Fallback: generate mock templates when API isn't configured
      const fallbackTemplates: Template[] = [
        {
          id: `gen-${Date.now()}-0`,
          name: "The Counter-Intuitive Hook",
          description: "Opens with a surprising statement that challenges conventional wisdom, then delivers proof",
          content: "The biggest myth in [industry]? That you need to [common belief].\n\nThe truth: [counter-intuitive insight].\n\nHere's what I learned after [personal proof point]:",
          category: "hook",
          platform: null,
          tags: ["engagement", "authority"],
          sourcePostIds: selectedPostIds,
          isAiGenerated: true,
          usageCount: 0,
          explanation: "This pattern works because it creates curiosity through cognitive dissonance. The reader's assumption is challenged, making them want to read on. Your personal experience adds credibility.",
          placeholders: ["industry", "common belief", "counter-intuitive insight", "personal proof point"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `gen-${Date.now()}-1`,
          name: "The Numbered Truth Bomb",
          description: "Share hard-won insights as a numbered list, ending with an engagement CTA",
          content: "After [time period] of [activity], here are [N] things nobody tells you:\n\n1. [Insight 1]\n2. [Insight 2]\n3. [Insight 3]\n4. [Insight 4]\n5. [Insight 5]\n\nWhich one hits hardest? Drop the number below.",
          category: "engagement",
          platform: null,
          tags: ["list", "CTA", "engagement"],
          sourcePostIds: selectedPostIds,
          isAiGenerated: true,
          usageCount: 0,
          explanation: "Numbered lists are highly scannable and shareable. The 'drop the number' CTA drives engagement because it requires minimal effort from the reader. The 'nobody tells you' framing creates exclusivity.",
          placeholders: ["time period", "activity", "N", "Insights 1-5"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `gen-${Date.now()}-2`,
          name: "The Transformation Story",
          description: "Before/after format showing a personal transformation with actionable takeaways",
          content: "Me [time] ago: \"[old belief/situation]\"\nMe now: [new reality/result]\n\nThe shift? I stopped [old behavior] and started:\n\n• [New behavior 1]\n• [New behavior 2]\n• [New behavior 3]\n\n[One-line takeaway that reframes the entire post].",
          category: "story",
          platform: null,
          tags: ["transformation", "relatability", "actionable"],
          sourcePostIds: selectedPostIds,
          isAiGenerated: true,
          usageCount: 0,
          explanation: "Before/after posts work because readers project themselves into the 'before' state and aspire to the 'after'. The bullet points make it actionable rather than just inspirational.",
          placeholders: ["time", "old belief/situation", "new reality/result", "old behavior", "New behaviors 1-3", "takeaway"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setGeneratedTemplates(fallbackTemplates);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = (template: Template) => {
    setSavedIds((prev) => [...prev, template.id]);
    // In the full version, this would save to the database
  };

  return (
    <div className="space-y-8">
      {/* Step 1: Select Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
            Select Your Best Posts
          </CardTitle>
          <CardDescription>
            Choose the posts you want AI to analyze. Pick posts with high engagement — the AI will identify what makes them work.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                selectable
                selected={selectedPostIds.includes(post.id)}
                onSelect={togglePost}
              />
            ))}
          </div>
          {selectedPostIds.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              {selectedPostIds.length} post{selectedPostIds.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Generate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            Generate Templates
          </CardTitle>
          <CardDescription>
            AI will analyze patterns in your selected posts — hooks, structure, tone, CTAs — and create reusable template frameworks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={selectedPostIds.length === 0 || generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analyzing patterns...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 mr-2" />
                Generate Templates from {selectedPostIds.length || "0"} Posts
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 3: Results */}
      {generatedTemplates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
              Generated Templates
            </CardTitle>
            <CardDescription>
              Review, edit, and save the templates you want to keep.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {generatedTemplates.map((template) => (
                <div key={template.id} className="relative">
                  <TemplateCard template={template} />
                  <div className="mt-2">
                    {savedIds.includes(template.id) ? (
                      <Button size="sm" variant="outline" disabled className="w-full">
                        <Check className="h-4 w-4 mr-1" />
                        Saved to Library
                      </Button>
                    ) : (
                      <Button size="sm" className="w-full" onClick={() => handleSave(template)}>
                        Save to Template Library
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
