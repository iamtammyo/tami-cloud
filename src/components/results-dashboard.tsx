"use client";

import { useState } from "react";
import type { GeneratedIdea, GenerationResult, Platform } from "@/types";
import PlatformGroup from "./platform-group";

const PLATFORM_ORDER: Platform[] = ["linkedin", "threads", "bluesky"];

export default function ResultsDashboard({
  result,
}: {
  result: GenerationResult;
}) {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>(result.ideas);
  const [pushingAll, setPushingAll] = useState<Platform | null>(null);
  const [pushingAllGlobal, setPushingAllGlobal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateIdea = (updated: GeneratedIdea) => {
    setIdeas((prev) =>
      prev.map((idea) => (idea.id === updated.id ? updated : idea))
    );
  };

  const handlePushAllPlatform = async (platform: Platform) => {
    const platformIdeas = ideas.filter(
      (i) => i.platform === platform && i.pushStatus !== "pushed"
    );
    if (platformIdeas.length === 0) return;

    setPushingAll(platform);

    try {
      const res = await fetch("/api/buffer/push-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideas: platformIdeas.map((i) => ({
            content: i.editedContent || i.content,
            sourceUrl: i.sourceUrl,
            platform: i.platform,
            ideaType: i.ideaType,
            sourceTitle: result.sourceContent.title,
          })),
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();

      if (data.results) {
        setIdeas((prev) =>
          prev.map((idea) => {
            const idx = platformIdeas.findIndex((pi) => pi.id === idea.id);
            if (idx === -1) return idea;
            const batchResult = data.results[idx];
            if (!batchResult) return idea;
            return {
              ...idea,
              pushStatus: batchResult.ideaId ? "pushed" : "error",
              bufferIdeaId: batchResult.ideaId || null,
              pushError: batchResult.error || null,
            } as GeneratedIdea;
          })
        );

        const successes = data.results.filter(
          (r: { ideaId?: string }) => r.ideaId
        ).length;
        showToast(
          `Pushed ${successes}/${platformIdeas.length} ${platform} ideas to Buffer`
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Batch push failed";
      showToast(`Error: ${msg}`);
    } finally {
      setPushingAll(null);
    }
  };

  const handlePushAllGlobal = async () => {
    setPushingAllGlobal(true);
    for (const platform of PLATFORM_ORDER) {
      const unpushed = ideas.filter(
        (i) => i.platform === platform && i.pushStatus !== "pushed"
      );
      if (unpushed.length > 0) {
        await handlePushAllPlatform(platform);
      }
    }
    setPushingAllGlobal(false);
  };

  const platformsWithIdeas = PLATFORM_ORDER.filter((p) =>
    ideas.some((i) => i.platform === p)
  );

  const allPushed = ideas.every((i) => i.pushStatus === "pushed");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Generated Ideas
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {ideas.length} ideas across{" "}
            {platformsWithIdeas.length} platform
            {platformsWithIdeas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handlePushAllGlobal}
          disabled={pushingAllGlobal || allPushed}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {pushingAllGlobal
            ? "Pushing All..."
            : allPushed
              ? "All Pushed to Buffer"
              : "Push All to Buffer"}
        </button>
      </div>

      {platformsWithIdeas.map((platform) => (
        <PlatformGroup
          key={platform}
          platform={platform}
          ideas={ideas.filter((i) => i.platform === platform)}
          sourceTitle={result.sourceContent.title}
          onUpdateIdea={handleUpdateIdea}
          onPushAll={() => handlePushAllPlatform(platform)}
          isPushingAll={pushingAll === platform}
        />
      ))}

      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
        Generated at {new Date(result.generatedAt).toLocaleString()} using{" "}
        {result.modelUsed}. Tokens: {result.tokenUsage.inputTokens} in /{" "}
        {result.tokenUsage.outputTokens} out.
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-gray-900 px-5 py-3 text-sm text-white shadow-lg animate-fade-in">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
