"use client";

import { useEffect, useState } from "react";

const CACHE_KEY = "lensed.work.v1";
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Things that show up in photographer articles but aren't their work. */
const JUNK_RE = /\.(svg|gif)$|grave|tomb|plaque|statue|signature|logo|map[ _]/i;

/**
 * Images embedded in the photographer's Wikipedia article. These are
 * usually their notable works; we drop the lead (portrait) image and any
 * file titled with their full name, which are almost always photos OF them.
 */
async function fetchArticleMedia(
  title: string,
  fullName: string,
): Promise<string[]> {
  const res = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    items?: {
      title?: string;
      type?: string;
      leadImage?: boolean;
      srcset?: { src?: string }[];
    }[];
  };
  const nameRe = new RegExp(
    escapeRegExp(fullName.trim()).replace(/\s+/g, "[ _]"),
    "i",
  );
  return (data.items ?? [])
    .filter((i) => i.type === "image" && !i.leadImage)
    .filter((i) => {
      const t = i.title ?? "";
      return !JUNK_RE.test(t) && !nameRe.test(t);
    })
    .map((i) => i.srcset?.[0]?.src)
    .filter((s): s is string => !!s)
    .map((s) => (s.startsWith("//") ? `https:${s}` : s));
}

/**
 * Wikimedia Commons keeps "Photographs by <name>" categories for
 * photographers whose work is public domain — actual works, by authorship.
 */
async function fetchCommonsByCategory(
  name: string,
  limit: number,
): Promise<string[]> {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrnamespace=6&gsrsearch=${encodeURIComponent(`incategory:"Photographs by ${name}"`)}` +
    `&gsrlimit=${limit}&prop=imageinfo&iiprop=url&iiurlwidth=480&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        { index?: number; title?: string; imageinfo?: { thumburl?: string }[] }
      >;
    };
  };
  return Object.values(data.query?.pages ?? {})
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .filter((p) => !JUNK_RE.test(p.title ?? ""))
    .map((p) => p.imageinfo?.[0]?.thumburl)
    .filter((u): u is string => !!u);
}

/**
 * Sample of a photographer's WORK (not pictures of them): article images
 * first, public-domain Commons authorship categories as backup. An empty
 * list is a normal outcome — much famous work is copyrighted and simply
 * isn't on Wikimedia.
 */
export function useWorkImages(
  name: string,
  wikipediaTitle: string,
  enabled: boolean,
  limit = 8,
): { urls: string[]; loading: boolean } {
  const [urls, setUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !name) return;
    let cancelled = false;
    const cacheKey = wikipediaTitle || name;
    const cache = readCache();
    const hit = cache[cacheKey];
    if (hit && hit.v === 1 && Date.now() - hit.ts < TTL_MS) {
      setUrls(hit.urls.slice(0, limit));
      return;
    }
    setLoading(true);
    void (async () => {
      const article = await fetchArticleMedia(wikipediaTitle, name).catch(
        () => [] as string[],
      );
      let found = article;
      if (found.length < 2) {
        const commons = await fetchCommonsByCategory(name, limit).catch(
          () => [] as string[],
        );
        found = Array.from(new Set([...found, ...commons]));
      }
      if (cancelled) return;
      const updated = readCache();
      updated[cacheKey] = { v: 1, ts: Date.now(), urls: found.slice(0, 12) };
      writeCache(updated);
      setUrls(found.slice(0, limit));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [name, wikipediaTitle, enabled, limit]);

  return { urls, loading };
}
