"use client";

import { useEffect, useState } from "react";
import type { RecentUrl } from "@/types";

export default function RecentHistory({
  onSelectUrl,
}: {
  onSelectUrl: (url: string) => void;
}) {
  const [recent, setRecent] = useState<RecentUrl[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("repurpose-recent");
    if (raw) {
      try {
        setRecent(JSON.parse(raw));
      } catch {
        // Ignore invalid data
      }
    }
  }, []);

  if (recent.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        Recently Processed
      </h3>
      <div className="space-y-2">
        {recent.map((item) => (
          <button
            key={item.url + item.processedAt}
            onClick={() => onSelectUrl(item.url)}
            className="w-full text-left rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            <div className="text-sm font-medium text-gray-900 truncate">
              {item.title}
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="truncate">{item.url}</span>
              <span className="shrink-0">
                {item.ideaCount} ideas
              </span>
              <span className="shrink-0">
                {new Date(item.processedAt).toLocaleDateString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
