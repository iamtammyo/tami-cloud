"use client";

import { useCallback, useState } from "react";
import UrlInputForm from "@/components/url-input-form";
import RecentHistory from "@/components/recent-history";

export default function Home() {
  const [initialUrl, setInitialUrl] = useState("");
  const [formKey, setFormKey] = useState(0);

  const handleSelectUrl = useCallback((url: string) => {
    setInitialUrl(url);
    setFormKey((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Blog to Social Content
        </h1>
        <p className="mt-3 text-lg text-gray-600">
          Paste a blog post URL and generate platform-specific content ideas for
          LinkedIn, Threads, and Bluesky.
        </p>
      </div>

      <div className="space-y-10">
        <UrlInputForm key={formKey} initialUrl={initialUrl} />
        <RecentHistory onSelectUrl={handleSelectUrl} />
      </div>
    </div>
  );
}
