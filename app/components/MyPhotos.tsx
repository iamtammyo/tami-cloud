"use client";

import { useEffect, useRef, useState } from "react";
import { loadPhotos, savePhotos } from "../lib/storage";
import type { Analysis, StoredPhoto } from "../lib/types";
import { dataUrlToBase64, fileToScaledDataUrl } from "../lib/image";

export default function MyPhotos() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadPhotos();
    setPhotos(loaded);
    if (loaded.length > 0) setSelectedId(loaded[0].id);
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    try {
      const next: StoredPhoto[] = [];
      for (const file of Array.from(files)) {
        const thumb = await fileToScaledDataUrl(file, 480, 0.8);
        const big = await fileToScaledDataUrl(file, 1568, 0.85);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrlToBase64(big.dataUrl),
            mediaType: big.mediaType,
          }),
        });
        if (!res.ok) {
          const errBody = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errBody?.error ?? `Analyze failed (${res.status})`);
        }
        const { analysis } = (await res.json()) as { analysis: Analysis };
        next.push({
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          thumbDataUrl: thumb.dataUrl,
          filename: file.name,
          analysis,
        });
      }
      const merged = [...next, ...photos];
      setPhotos(merged);
      savePhotos(merged);
      if (next[0]) setSelectedId(next[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function deletePhoto(id: string) {
    const next = photos.filter((p) => p.id !== id);
    setPhotos(next);
    savePhotos(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  const selected = photos.find((p) => p.id === selectedId) ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-stone-400">
          Upload a photo. Claude analyzes composition, lighting, mood, and gives
          gentle suggestions.
        </p>
        <div className="flex items-center gap-3">
          {busy && <span className="text-xs text-stone-400">Analyzing…</span>}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-md bg-stone-100 px-4 py-2 text-sm font-medium text-stone-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload photos
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-stone-700 px-8 py-16 text-center">
          <p className="text-stone-300">No photos yet.</p>
          <p className="mt-1 text-sm text-stone-500">
            Upload a JPEG or PNG to get a written critique.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            {photos.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition ${
                    active
                      ? "border-stone-300 bg-stone-900"
                      : "border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <img
                    src={p.thumbDataUrl}
                    alt={p.filename}
                    className="h-14 w-14 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{p.filename}</div>
                    <div className="text-xs text-stone-500">
                      {p.analysis.genre} · {p.analysis.mood}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {selected && (
            <article className="rounded-lg border border-stone-800 p-5">
              <div className="mb-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <img
                  src={selected.thumbDataUrl}
                  alt={selected.filename}
                  className="w-full rounded-md object-cover"
                />
                <div>
                  <h2 className="text-lg font-medium">{selected.filename}</h2>
                  <p className="mt-2 italic text-stone-300">
                    “{selected.analysis.oneLine}”
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Tag>{selected.analysis.genre}</Tag>
                    <Tag>{selected.analysis.mood}</Tag>
                    {selected.analysis.subjects.slice(0, 4).map((s) => (
                      <Tag key={s} muted>
                        {s}
                      </Tag>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {selected.analysis.palette.map((c) => (
                      <div
                        key={c}
                        className="rounded border border-stone-700 px-2 py-1 text-xs text-stone-300"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => deletePhoto(selected.id)}
                    className="mt-6 text-xs text-stone-500 hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <Section title="Composition">{selected.analysis.composition}</Section>
                <Section title="Lighting">{selected.analysis.lighting}</Section>
                <Section title="Technique">{selected.analysis.technique}</Section>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <BulletSection title="Strengths" items={selected.analysis.strengths} />
                <BulletSection
                  title="Try next time"
                  items={selected.analysis.improvements}
                />
              </div>

              {selected.analysis.similarPhotographers.length > 0 && (
                <div className="mt-5 rounded-md border border-stone-800 bg-stone-950/50 p-4">
                  <div className="text-xs uppercase tracking-wide text-stone-500">
                    If you liked making this, study
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.analysis.similarPhotographers.map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-stone-700 px-3 py-1 text-sm"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </article>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 ${
        muted
          ? "border border-stone-700 text-stone-300"
          : "bg-stone-100 text-stone-900"
      }`}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-stone-500">{title}</div>
      <p className="mt-1.5 text-sm text-stone-200">{children}</p>
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-stone-500">{title}</div>
      <ul className="mt-1.5 space-y-1.5 text-sm text-stone-200">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-stone-500" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
