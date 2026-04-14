"use client";

import type { GeneratedIdea, Platform } from "@/types";
import IdeaCard from "./idea-card";

const PLATFORM_CONFIG: Record<
  Platform,
  { label: string; color: string; bgColor: string }
> = {
  linkedin: {
    label: "LinkedIn",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
  },
  threads: {
    label: "Threads",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
  },
  bluesky: {
    label: "Bluesky",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
  },
};

export default function PlatformGroup({
  platform,
  ideas,
  sourceTitle,
  onUpdateIdea,
  onPushAll,
  isPushingAll,
}: {
  platform: Platform;
  ideas: GeneratedIdea[];
  sourceTitle: string;
  onUpdateIdea: (updated: GeneratedIdea) => void;
  onPushAll: () => void;
  isPushingAll: boolean;
}) {
  const config = PLATFORM_CONFIG[platform];
  const allPushed = ideas.every((i) => i.pushStatus === "pushed");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full ${config.bgColor} px-3 py-1 text-sm font-semibold ${config.color}`}
          >
            {config.label}
          </span>
          <span className="text-sm text-gray-500">
            {ideas.length} idea{ideas.length !== 1 ? "s" : ""}
          </span>
        </h3>
        <button
          onClick={onPushAll}
          disabled={isPushingAll || allPushed || ideas.length === 0}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isPushingAll
            ? "Pushing..."
            : allPushed
              ? "All Pushed"
              : `Push All ${config.label}`}
        </button>
      </div>

      <div className="space-y-3">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            sourceTitle={sourceTitle}
            onUpdate={onUpdateIdea}
          />
        ))}
      </div>
    </div>
  );
}
