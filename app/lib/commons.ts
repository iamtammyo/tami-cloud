"use client";

import { useEffect, useState } from "react";

const CACHE_KEY = "lensed.commons.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

type CacheEntry = { v: 1; ts: number; urls: string[] };

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

/**
 * Sample images for a photographer from Wikimedia Commons search.
 * Best-effort: results mix photos by and of the person; an empty list is a
 * normal outcome and callers should render without the strip.
 */
export function useCommonsImages(
  name: string,
  enabled: boolean,
  limit = 4,
): { urls: string[]; loading: boolean } {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !name) return;
    let cancelled = false;
    const cache = readCache();
    const hit = cache[name];
    if (hit && hit.v === 1 && Date.now() - hit.ts < TTL_MS) {
      setUrls(hit.urls);
      return;
    }
    setLoading(true);
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
      `&gsrnamespace=6&gsrsearch=${encodeURIComponent(`filetype:bitmap ${name}`)}` +
      `&gsrlimit=${limit}&prop=imageinfo&iiprop=url&iiurlwidth=320&format=json&origin=*`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Commons ${res.status}`);
        const data = (await res.json()) as {
          query?: {
            pages?: Record<
              string,
              { index?: number; imageinfo?: { thumburl?: string }[] }
            >;
          };
        };
        const pages = Object.values(data.query?.pages ?? {});
        const found = pages
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
          .map((p) => p.imageinfo?.[0]?.thumburl)
          .filter((u): u is string => !!u);
        if (cancelled) return;
        const updated = readCache();
        updated[name] = { v: 1, ts: Date.now(), urls: found };
        writeCache(updated);
        setUrls(found);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setUrls([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [name, enabled, limit]);

  return { urls, loading };
}
