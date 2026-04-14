"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerationResult } from "@/types";
import SourceSummary from "@/components/source-summary";
import ResultsDashboard from "@/components/results-dashboard";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("repurpose-result");
    if (!raw) {
      router.push("/");
      return;
    }
    try {
      setResult(JSON.parse(raw));
    } catch {
      router.push("/");
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading || !result) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
            </div>
            <div className="lg:col-span-8 space-y-4">
              <div className="h-32 rounded bg-gray-200" />
              <div className="h-32 rounded bg-gray-200" />
              <div className="h-32 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          &larr; Back to input
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="sticky top-8 rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wider">
              Source Article
            </h3>
            <SourceSummary content={result.sourceContent} />
          </div>
        </aside>

        <div className="lg:col-span-8">
          <ResultsDashboard result={result} />
        </div>
      </div>
    </div>
  );
}
