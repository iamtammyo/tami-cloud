"use client";

import { useEffect, useState } from "react";

export type WikiInfo = {
  imageUrl: string | null;
  contentUrl: string;
};

type CacheEntry = {
  v: 1;
  ts: number;
  imageUrl: string | null;
  contentUrl: string;
};

const CACHE_KEY = "lensed.wiki.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function readCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(c: Record<string, CacheEntry>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {}
}

export function usePhotographerWiki(title: string): {
  info: WikiInfo | null;
  loading: boolean;
  error: string | null;
} {
  const [info, setInfo] = useState<WikiInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cache = readCache();
    const hit = cache[title];
    if (hit && hit.v === 1 && Date.now() - hit.ts < TTL_MS) {
      setInfo({ imageUrl: hit.imageUrl, contentUrl: hit.contentUrl });
      setLoading(false);
      return;
    }

    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
        const data = (await res.json()) as {
          thumbnail?: { source?: string };
          originalimage?: { source?: string };
          content_urls?: { desktop?: { page?: string } };
        };
        const imageUrl =
          data.thumbnail?.source ?? data.originalimage?.source ?? null;
        const contentUrl =
          data.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
        if (cancelled) return;
        const next: WikiInfo = { imageUrl, contentUrl };
        const updated = readCache();
        updated[title] = { v: 1, ts: Date.now(), imageUrl, contentUrl };
        writeCache(updated);
        setInfo(next);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setInfo({
          imageUrl: null,
          contentUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [title]);

  return { info, loading, error };
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
