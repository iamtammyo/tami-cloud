"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadCollections,
  loadPhotos,
  saveCollections,
  savePhotos,
} from "../lib/storage";
import type { Analysis, Collection, StoredPhoto } from "../lib/types";
import { dataUrlToBase64, fileToScaledDataUrl } from "../lib/image";

type View = "all" | "uncategorized" | string;

export default function MyPhotos() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [view, setView] = useState<View>("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(loadPhotos());
    setCollections(loadCollections());
  }, []);

  const visiblePhotos = useMemo(() => {
    if (view === "all") return photos;
    if (view === "uncategorized") return photos.filter((p) => !p.collectionId);
    return photos.filter((p) => p.collectionId === view);
  }, [photos, view]);

  useEffect(() => {
    if (visiblePhotos.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!visiblePhotos.some((p) => p.id === selectedId)) {
      setSelectedId(visiblePhotos[0].id);
    }
  }, [visiblePhotos, selectedId]);

  const targetCollectionId = useMemo(() => {
    if (view === "all" || view === "uncategorized") return undefined;
    return view;
  }, [view]);

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
          collectionId: targetCollectionId,
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

  function movePhoto(id: string, collectionId: string | undefined) {
    const next = photos.map((p) =>
      p.id === id ? { ...p, collectionId } : p,
    );
    setPhotos(next);
    savePhotos(next);
  }

  function createCollection() {
    const name = newName.trim();
    if (!name) {
      setCreating(false);
      setNewName("");
      return;
    }
    const exists = collections.some(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) {
      setError(`A collection called "${name}" already exists.`);
      return;
    }
    const c: Collection = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
    };
    const next = [...collections, c];
    setCollections(next);
    saveCollections(next);
    setNewName("");
    setCreating(false);
    setView(c.id);
  }

  function deleteCollection(id: string) {
    const c = collections.find((x) => x.id === id);
    if (!c) return;
    const photoCount = photos.filter((p) => p.collectionId === id).length;
    const ok = window.confirm(
      photoCount > 0
        ? `Delete "${c.name}"? Its ${photoCount} photo${photoCount === 1 ? "" : "s"} will move to Uncategorized.`
        : `Delete "${c.name}"?`,
    );
    if (!ok) return;
    const nextCollections = collections.filter((x) => x.id !== id);
    const nextPhotos = photos.map((p) =>
      p.collectionId === id ? { ...p, collectionId: undefined } : p,
    );
    setCollections(nextCollections);
    saveCollections(nextCollections);
    setPhotos(nextPhotos);
    savePhotos(nextPhotos);
    if (view === id) setView("all");
  }

  const selected = visiblePhotos.find((p) => p.id === selectedId) ?? null;
  const totalUncat = photos.filter((p) => !p.collectionId).length;

  return (
    <div>
      {/* Collection bar */}
      <div className="plate-black mb-6 rounded-md p-3">
        <div className="mb-2 flex items-center gap-2 px-1">
          <span className="port h-2 w-2" />
          <span className="engrave-cream text-[10px]">COLLECTIONS</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CollectionChip
            label="All"
            count={photos.length}
            active={view === "all"}
            onClick={() => setView("all")}
          />
          <CollectionChip
            label="Uncategorized"
            count={totalUncat}
            active={view === "uncategorized"}
            onClick={() => setView("uncategorized")}
          />
          {collections.map((c) => {
            const n = photos.filter((p) => p.collectionId === c.id).length;
            const active = view === c.id;
            return (
              <span key={c.id} className="relative inline-flex">
                <CollectionChip
                  label={c.name}
                  count={n}
                  active={active}
                  onClick={() => setView(c.id)}
                />
                {active && (
                  <button
                    onClick={() => deleteCollection(c.id)}
                    title="Delete collection"
                    className="-ml-1 mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })}
          {creating ? (
            <span className="inline-flex items-center gap-1">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createCollection();
                  if (e.key === "Escape") {
                    setCreating(false);
                    setNewName("");
                  }
                }}
                placeholder="Collection name"
                className="input-port px-3 py-1 text-sm"
              />
              <button
                onClick={createCollection}
                className="btn-chrome px-3 py-1 text-[10px] uppercase tracking-wider"
              >
                <span className="engrave">Add</span>
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setNewName("");
                }}
                className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-stone-300"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-stone-600 px-3 py-1 text-[10px] uppercase tracking-wider text-stone-300 hover:border-stone-400 hover:text-stone-100"
            >
              + New
            </button>
          )}
        </div>
      </div>

      {/* Control deck */}
      <div className="plate-black mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md p-4">
        <div className="flex items-center gap-3">
          <span className="port h-3 w-3" />
          <span className="engrave-cream text-[10px]">
            FILM BAY ·{" "}
            {targetCollectionId
              ? `LOAD INTO "${collections.find((c) => c.id === targetCollectionId)?.name ?? ""}"`
              : "LOAD JPEG / PNG / WEBP"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {busy && (
            <span className="flex items-center gap-2">
              <span className="led-red h-2 w-2 animate-pulse" />
              <span className="engrave-cream text-[10px]">EXPOSING…</span>
            </span>
          )}
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
            className="btn-chrome relative px-5 py-2 text-[11px] uppercase tracking-[0.18em]"
          >
            <span className="engrave">Load Photos</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="plate-cream mb-6 rounded-md px-4 py-3 text-sm">
          <span className="engrave-cream text-[10px]">ERROR</span>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {visiblePhotos.length === 0 ? (
        <div className="plate-black rounded-md px-8 py-16 text-center">
          <div className="engrave-cream text-xs">FRAME 000</div>
          <p className="mt-3">No exposures in this collection yet.</p>
          <p className="mt-1 text-sm text-stone-500">
            Load a photo to receive a written critique.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="plate-black space-y-2 rounded-md p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="engrave-cream text-[10px]">FILMSTRIP</span>
              <span className="engrave-cream text-[10px]">
                {visiblePhotos.length.toString().padStart(3, "0")}
              </span>
            </div>
            {visiblePhotos.map((p, i) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition ${
                    active
                      ? "border-stone-200 bg-stone-900/80"
                      : "border-stone-800 hover:border-stone-700"
                  }`}
                >
                  <span className="relative">
                    <img
                      src={p.thumbDataUrl}
                      alt={p.filename}
                      className="h-14 w-14 rounded-sm object-cover ring-1 ring-black"
                    />
                    {active && (
                      <span className="led-red absolute -right-1 -top-1 h-2 w-2" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{p.filename}</div>
                    <div className="text-[10px] uppercase tracking-wider text-stone-500">
                      №{(visiblePhotos.length - i).toString().padStart(3, "0")} ·{" "}
                      {p.analysis.genre} · {p.analysis.mood}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {selected && (
            <article className="plate-black rounded-md p-5">
              <div className="mb-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="relative rounded-md p-3 ring-1 ring-black/60">
                  <span className="screw absolute left-1.5 top-1.5" />
                  <span className="screw absolute right-1.5 top-1.5" />
                  <span className="screw absolute bottom-1.5 left-1.5" />
                  <span className="screw absolute bottom-1.5 right-1.5" />
                  <img
                    src={selected.thumbDataUrl}
                    alt={selected.filename}
                    className="w-full rounded-sm object-cover"
                  />
                </div>
                <div>
                  <div className="plate-cream rounded-sm px-3 py-2">
                    <div className="engrave-cream text-[9px]">FILE</div>
                    <div className="font-mono text-sm">{selected.filename}</div>
                  </div>
                  <p className="mt-3 italic text-stone-300">
                    “{selected.analysis.oneLine}”
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <Tag chrome>{selected.analysis.genre}</Tag>
                    <Tag chrome>{selected.analysis.mood}</Tag>
                    {selected.analysis.subjects.slice(0, 4).map((s) => (
                      <Tag key={s}>{s}</Tag>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.analysis.palette.map((c) => (
                      <div
                        key={c}
                        className="plate-cream rounded-sm px-2 py-1 text-[10px] uppercase tracking-wider"
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2">
                      <span className="engrave-cream text-[10px]">
                        COLLECTION
                      </span>
                      <select
                        value={selected.collectionId ?? ""}
                        onChange={(e) =>
                          movePhoto(selected.id, e.target.value || undefined)
                        }
                        className="input-port px-2 py-1 text-sm"
                      >
                        <option value="">Uncategorized</option>
                        {collections.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      onClick={() => deletePhoto(selected.id)}
                      className="text-[10px] uppercase tracking-[0.18em] text-stone-500 hover:text-red-400"
                    >
                      Eject frame
                    </button>
                  </div>
                </div>
              </div>

              <Divider />

              <div className="grid gap-5 md:grid-cols-3">
                <Section title="Composition">{selected.analysis.composition}</Section>
                <Section title="Lighting">{selected.analysis.lighting}</Section>
                <Section title="Technique">{selected.analysis.technique}</Section>
              </div>

              <Divider />

              <div className="grid gap-5 md:grid-cols-2">
                <BulletSection title="Strengths" items={selected.analysis.strengths} />
                <BulletSection
                  title="Try next time"
                  items={selected.analysis.improvements}
                />
              </div>

              {selected.analysis.similarPhotographers.length > 0 && (
                <div className="plate-cream mt-6 rounded-md px-4 py-3">
                  <div className="engrave-cream text-[10px]">
                    REFERENCE LIBRARY · STUDY THESE
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.analysis.similarPhotographers.map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-amber-900/30 bg-amber-50/40 px-3 py-1 text-sm text-stone-800"
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

function CollectionChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="btn-chrome inline-flex items-center gap-2 px-3 py-1"
      >
        <span className="led-red h-1.5 w-1.5" />
        <span className="engrave text-[11px]">{label}</span>
        <span className="engrave text-[10px] opacity-70">
          {count.toString().padStart(2, "0")}
        </span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-3 py-1 text-stone-300 hover:border-stone-500"
    >
      <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
      <span className="text-[10px] text-stone-500">
        {count.toString().padStart(2, "0")}
      </span>
    </button>
  );
}

function Tag({
  children,
  chrome = false,
}: {
  children: React.ReactNode;
  chrome?: boolean;
}) {
  if (chrome) {
    return (
      <span className="btn-chrome inline-flex items-center px-3 py-1 text-[11px]">
        <span className="engrave">{children}</span>
      </span>
    );
  }
  return (
    <span className="rounded-full border border-stone-700 px-2.5 py-1 text-stone-300">
      {children}
    </span>
  );
}

function Divider() {
  return <div className="my-5 sprocket rounded-sm" />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="engrave-cream text-[10px]">{title}</div>
      <p className="mt-1.5 text-sm text-stone-200">{children}</p>
    </div>
  );
}

function BulletSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="engrave-cream text-[10px]">{title}</div>
      <ul className="mt-1.5 space-y-1.5 text-sm text-stone-200">
        {items.map((it) => (
          <li key={it} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-stone-400" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
