"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  Platform,
  ExtractedContent,
  GenerationResult,
  RecentUrl,
} from "@/types";

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "bluesky", label: "Bluesky" },
];

export default function UrlInputForm({
  initialUrl = "",
}: {
  initialUrl?: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    "linkedin",
    "threads",
    "bluesky",
  ]);
  const [status, setStatus] = useState<
    "idle" | "extracting" | "generating" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError("Select at least one platform");
      return;
    }

    try {
      // Step 1: Extract content
      setStatus("extracting");
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const extractData = await extractRes.json();

      if (!extractData.success) {
        throw new Error(extractData.error || "Extraction failed");
      }

      const extractedContent: ExtractedContent = extractData.data;

      // Step 2: Generate ideas
      setStatus("generating");
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extractedContent,
          platforms: selectedPlatforms,
          toneProfile: "default",
        }),
        signal: AbortSignal.timeout(90000),
      });
      const generateData = await generateRes.json();

      if (!generateData.success) {
        throw new Error(generateData.error || "Generation failed");
      }

      const result: GenerationResult = generateData.data;

      // Store result in localStorage
      localStorage.setItem("repurpose-result", JSON.stringify(result));

      // Update recent history
      const recentRaw = localStorage.getItem("repurpose-recent");
      const recent: RecentUrl[] = recentRaw ? JSON.parse(recentRaw) : [];
      const entry: RecentUrl = {
        url: url.trim(),
        title: extractedContent.title,
        processedAt: new Date().toISOString(),
        ideaCount: result.ideas.length,
      };
      const updated = [entry, ...recent.filter((r) => r.url !== entry.url)].slice(0, 10);
      localStorage.setItem("repurpose-recent", JSON.stringify(updated));

      // Navigate to results
      router.push("/results");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setStatus("error");
    }
  };

  const isProcessing = status === "extracting" || status === "generating";

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      <div>
        <label
          htmlFor="url-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Blog Post URL
        </label>
        <div className="flex gap-3">
          <input
            id="url-input"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://buffer.com/resources/..."
            disabled={isProcessing}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={isProcessing || !url.trim()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {status === "extracting"
                  ? "Extracting..."
                  : "Generating..."}
              </span>
            ) : (
              "Extract & Generate"
            )}
          </button>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Platforms
        </span>
        <div className="flex gap-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => togglePlatform(p.id)}
              disabled={isProcessing}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                selectedPlatforms.includes(p.id)
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
              } disabled:opacity-50`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStatus("idle");
            }}
            className="ml-2 font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {status === "extracting"
            ? "Extracting article content... This takes a few seconds."
            : "Generating social content ideas with Claude... This may take up to 30 seconds."}
        </div>
      )}
    </form>
  );
}
