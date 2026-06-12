"use client";

import { useState } from "react";
import {
  addCustomPhotographer,
  findPhotographerByName,
  slugForName,
  useLibrary,
} from "../lib/library";
import { useWorkImages } from "../lib/commons";
import { initials, usePhotographerWiki } from "../lib/wiki";
import type { Photographer } from "../lib/types";

/**
 * A photographer name from a critique. If the person is in the library the
 * chip previews their profile on hover and jumps to their full entry in
 * Inspiration on click; otherwise it offers to add them via Claude.
 */
export default function PhotographerChip({ name }: { name: string }) {
  const library = useLibrary();
  const match = findPhotographerByName(name, library);
  return match ? (
    <LinkedChip photographer={match} />
  ) : (
    <AddableChip name={name} />
  );
}

function LinkedChip({ photographer }: { photographer: Photographer }) {
  const [preview, setPreview] = useState(false);

  function openInLibrary() {
    window.dispatchEvent(
      new CustomEvent("lensed:view-photographer", {
        detail: { id: photographer.id },
      }),
    );
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setPreview(true)}
      onMouseLeave={() => setPreview(false)}
    >
      <button
        onClick={openInLibrary}
        onFocus={() => setPreview(true)}
        onBlur={() => setPreview(false)}
        className="rounded-full border border-stone-400/60 bg-white/60 px-3 py-1 text-sm text-stone-800 transition hover:border-stone-600"
      >
        {photographer.name} <span aria-hidden>↗</span>
      </button>
      {preview && <PreviewCard photographer={photographer} />}
    </span>
  );
}

function PreviewCard({ photographer }: { photographer: Photographer }) {
  const { info, loading } = usePhotographerWiki(photographer.wikipediaTitle);
  const { urls } = useWorkImages(
    photographer.name,
    photographer.wikipediaTitle,
    true,
    4,
  );

  return (
    <div className="plate-black absolute bottom-full left-0 z-30 mb-2 w-72 rounded-md p-3 shadow-lg">
      <div className="flex gap-3">
        <div className="h-16 w-16 flex-none overflow-hidden rounded-sm bg-stone-900">
          {info?.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.imageUrl}
              alt={`Portrait of ${photographer.name}`}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-light tracking-widest text-stone-500">
              {loading ? "…" : initials(photographer.name)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-stone-100">
              {photographer.name}
            </span>
            {photographer.contemporary && (
              <span
                className="rounded-full border px-1.5 font-mono text-[8px] uppercase tracking-[0.14em]"
                style={{ color: "var(--accent)", borderColor: "var(--accent)" }}
              >
                Now
              </span>
            )}
          </div>
          <div className="font-mono text-[10px] text-stone-500">
            {photographer.era} · {photographer.country}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {photographer.styles.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full border border-stone-700 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-stone-400"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-stone-300">
        {photographer.signature}
      </p>
      {urls.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-1">
          {urls.slice(0, 4).map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={u}
              src={u}
              alt={`Photograph by ${photographer.name} (via Wikipedia/Wikimedia)`}
              className="aspect-square w-full rounded-sm object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[8px] uppercase tracking-wider text-stone-600">
          Images · Wikimedia
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-stone-400">
          Click to open in library →
        </span>
      </div>
    </div>
  );
}

function AddableChip({ name }: { name: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/photographer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as {
        profile?: Omit<Photographer, "id">;
        error?: string;
      };
      if (!res.ok || !data.profile) {
        throw new Error(data.error ?? `Add failed (${res.status})`);
      }
      addCustomPhotographer({ id: slugForName(data.profile.name), ...data.profile });
      // The library-changed event re-renders this chip as a LinkedChip.
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <span className="rounded-full border border-dashed border-stone-400/60 px-3 py-1 text-sm text-stone-700">
        {name}
      </span>
      <button
        onClick={add}
        disabled={busy}
        title={error ?? `Add ${name} to your library`}
        className="rounded-full border border-stone-400/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-stone-600 transition hover:border-stone-600 hover:text-stone-900 disabled:opacity-50"
      >
        {busy ? "Adding…" : error ? "Retry +" : "+ Library"}
      </button>
    </span>
  );
}
