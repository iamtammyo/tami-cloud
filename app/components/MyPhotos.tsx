"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadCollections, loadProfile, saveCollections } from "../lib/storage";
import { deletePhotoById, loadAllPhotos, putPhoto } from "../lib/db";
import type { Collection, StoredPhoto, UserProfile } from "../lib/types";
import { dataUrlToBase64, fileToScaledDataUrl } from "../lib/image";
import { findCamera } from "../lib/cameras";
import {
  exifSummaryLine,
  extractExif,
  formatAperture,
  formatCamera,
  formatFocal,
  formatIso,
  formatShutter,
} from "../lib/exif";

type View = "all" | "uncategorized" | string;
type Layout = "strip" | "sheet";

const MAX_CONCURRENT_ANALYSES = 2;
const SAMPLE_URL = "https://picsum.photos/id/1015/1600/1067";

export default function MyPhotos() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState<View>("all");
  const [layout, setLayout] = useState<Layout>("strip");
  const [showThirds, setShowThirds] = useState(false);
  const [sampleBusy, setSampleBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<StoredPhoto[]>([]);
  const queueRef = useRef<string[]>([]);
  const activeRef = useRef(0);

  useEffect(() => {
    let alive = true;
    void loadAllPhotos().then((loaded) => {
      if (!alive) return;
      photosRef.current = loaded;
      setPhotos(loaded);
      // Photos stuck in "analyzing" from an interrupted session can't resume
      // their in-flight request; surface them as retryable instead.
      for (const p of loaded) {
        if (p.status === "analyzing") {
          patchPhoto(p.id, {
            status: "failed",
            error: "Analysis was interrupted. Retry to develop this frame.",
          });
        }
      }
    });
    setCollections(loadCollections());
    setProfile(loadProfile());

    function onProfileChange(e: Event) {
      const detail = (e as CustomEvent<UserProfile | null>).detail;
      setProfile(detail);
    }
    window.addEventListener("lensed:profile-changed", onProfileChange);
    return () => {
      alive = false;
      window.removeEventListener("lensed:profile-changed", onProfileChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Keeps photosRef in sync so async analysis workers never read stale state. */
  function setPhotosSafe(updater: (prev: StoredPhoto[]) => StoredPhoto[]) {
    photosRef.current = updater(photosRef.current);
    setPhotos(photosRef.current);
  }

  function patchPhoto(id: string, patch: Partial<StoredPhoto>) {
    setPhotosSafe((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
    const updated = photosRef.current.find((p) => p.id === id);
    if (updated) void putPhoto(updated);
  }

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

  const analyzingCount = photos.filter((p) => p.status === "analyzing").length;

  function buildCameraContext() {
    if (!profile) return null;
    const camera = findCamera(profile.cameraId);
    if (camera) {
      return {
        fullName: camera.fullName,
        detailed: true,
        controls: camera.controls,
      };
    }
    if (profile.customCameraName) {
      return {
        fullName: profile.customCameraName,
        detailed: false,
      };
    }
    return null;
  }

  function enqueueAnalysis(id: string) {
    queueRef.current.push(id);
    pumpQueue();
  }

  function pumpQueue() {
    while (
      activeRef.current < MAX_CONCURRENT_ANALYSES &&
      queueRef.current.length > 0
    ) {
      const id = queueRef.current.shift()!;
      activeRef.current += 1;
      void runAnalysis(id).finally(() => {
        activeRef.current -= 1;
        pumpQueue();
      });
    }
  }

  async function runAnalysis(id: string) {
    const photo = photosRef.current.find((p) => p.id === id);
    if (!photo) return;
    if (!photo.retryDataUrl) {
      patchPhoto(id, {
        status: "failed",
        error: "Original image is no longer available — load it again to analyze.",
      });
      return;
    }
    patchPhoto(id, { status: "analyzing", error: undefined });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: dataUrlToBase64(photo.retryDataUrl),
          mediaType: photo.retryMediaType ?? "image/jpeg",
          camera: buildCameraContext(),
          skillLevel: profile?.skillLevel ?? null,
          mainSubjects: profile?.mainSubjects ?? [],
          exif: photo.exif ?? null,
        }),
      });
      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errBody?.error ?? `Analyze failed (${res.status})`);
      }
      const { analysis } = (await res.json()) as {
        analysis: StoredPhoto["analysis"];
      };
      patchPhoto(id, {
        status: "done",
        analysis,
        error: undefined,
        retryDataUrl: undefined,
        retryMediaType: undefined,
      });
    } catch (err) {
      patchPhoto(id, {
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleFiles(files: FileList | File[] | null) {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    setError(null);
    const collectionId = targetCollectionId;
    let firstId: string | null = null;
    for (const file of list) {
      try {
        const exif = await extractExif(file);
        const thumb = await fileToScaledDataUrl(file, 480, 0.8);
        const big = await fileToScaledDataUrl(file, 1568, 0.85);
        const photo: StoredPhoto = {
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          thumbDataUrl: thumb.dataUrl,
          filename: file.name,
          status: "analyzing",
          analysis: null,
          retryDataUrl: big.dataUrl,
          retryMediaType: big.mediaType,
          collectionId,
          exif: exif ?? undefined,
        };
        setPhotosSafe((prev) => [photo, ...prev]);
        void putPhoto(photo);
        if (!firstId) {
          firstId = photo.id;
          setSelectedId(photo.id);
        }
        enqueueAnalysis(photo.id);
      } catch (err) {
        setError(
          `${file.name}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function loadSamplePhoto() {
    setError(null);
    setSampleBusy(true);
    try {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) throw new Error(`Couldn't fetch the sample photo (${res.status}).`);
      const blob = await res.blob();
      const file = new File([blob], "sample-river-valley.jpg", {
        type: blob.type || "image/jpeg",
      });
      await handleFiles([file]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSampleBusy(false);
    }
  }

  function deletePhoto(id: string) {
    setPhotosSafe((prev) => prev.filter((p) => p.id !== id));
    void deletePhotoById(id);
    if (selectedId === id) setSelectedId(photosRef.current[0]?.id ?? null);
  }

  function movePhoto(id: string, collectionId: string | undefined) {
    patchPhoto(id, { collectionId });
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
    const affected = photosRef.current.filter((p) => p.collectionId === id);
    const ok = window.confirm(
      affected.length > 0
        ? `Delete "${c.name}"? Its ${affected.length} photo${affected.length === 1 ? "" : "s"} will move to Uncategorized.`
        : `Delete "${c.name}"?`,
    );
    if (!ok) return;
    const nextCollections = collections.filter((x) => x.id !== id);
    setCollections(nextCollections);
    saveCollections(nextCollections);
    setPhotosSafe((prev) =>
      prev.map((p) =>
        p.collectionId === id ? { ...p, collectionId: undefined } : p,
      ),
    );
    for (const p of affected) {
      const updated = photosRef.current.find((x) => x.id === p.id);
      if (updated) void putPhoto(updated);
    }
    if (view === id) setView("all");
  }

  const selected = visiblePhotos.find((p) => p.id === selectedId) ?? null;
  const totalUncat = photos.filter((p) => !p.collectionId).length;
  const hasProfileCamera = !!(
    profile &&
    (findCamera(profile.cameraId) || profile.customCameraName)
  );

  const detailArticle = selected && (
    <article className="plate-black rounded-md p-5">
      <div className="mb-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
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
            {showThirds && (
              <div className="pointer-events-none absolute inset-3" aria-hidden>
                <div className="absolute left-1/3 top-0 h-full w-px bg-white/60 shadow-[0_0_1px_rgba(0,0,0,.8)]" />
                <div className="absolute left-2/3 top-0 h-full w-px bg-white/60 shadow-[0_0_1px_rgba(0,0,0,.8)]" />
                <div className="absolute left-0 top-1/3 h-px w-full bg-white/60 shadow-[0_0_1px_rgba(0,0,0,.8)]" />
                <div className="absolute left-0 top-2/3 h-px w-full bg-white/60 shadow-[0_0_1px_rgba(0,0,0,.8)]" />
              </div>
            )}
          </div>
          <button
            onClick={() => setShowThirds((v) => !v)}
            aria-pressed={showThirds}
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-stone-700 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-stone-300 hover:border-stone-500"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${showThirds ? "led-green" : "bg-stone-700"}`}
            />
            Thirds grid {showThirds ? "on" : "off"}
          </button>
        </div>
        <div>
          <div className="plate-cream rounded-sm px-3 py-2">
            <div className="engrave-cream text-[9px]">FILE</div>
            <div className="font-mono text-sm">{selected.filename}</div>
          </div>
          {selected.exif && <ExifPanel exif={selected.exif} />}

          {selected.status === "analyzing" && (
            <div className="mt-3 flex items-center gap-2 rounded-sm border border-stone-800 bg-stone-950/60 px-3 py-2.5">
              <span className="led-red h-2 w-2 animate-pulse" />
              <span className="engrave-cream text-[10px]">
                DEVELOPING · CRITIQUE IN PROGRESS
              </span>
            </div>
          )}
          {selected.status === "failed" && (
            <div className="mt-3 rounded-sm border border-red-900/50 bg-red-950/30 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="led-red h-2 w-2" />
                <span className="engrave-cream text-[10px]">
                  DEVELOPMENT FAILED
                </span>
              </div>
              <p className="mt-1.5 text-sm text-stone-300">{selected.error}</p>
              {selected.retryDataUrl && (
                <button
                  onClick={() => enqueueAnalysis(selected.id)}
                  className="btn-chrome mt-2 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em]"
                >
                  <span className="engrave">Re-expose</span>
                </button>
              )}
            </div>
          )}

          {selected.status === "done" && selected.analysis && (
            <>
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
                {selected.analysis.palette.map((c, i) => {
                  const hex = selected.analysis?.paletteHex?.[i];
                  const valid = hex && /^#[0-9a-f]{3,8}$/i.test(hex);
                  return (
                    <div
                      key={c}
                      className="plate-cream flex items-center gap-2 rounded-sm px-2 py-1 text-[10px] uppercase tracking-wider"
                    >
                      {valid && (
                        <span
                          className="h-3.5 w-3.5 flex-none rounded-sm border border-black/30"
                          style={{ background: hex }}
                          aria-hidden
                        />
                      )}
                      {c}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="engrave-cream text-[10px]">COLLECTION</span>
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
              className="text-[10px] uppercase tracking-[0.18em] text-stone-400 hover:text-red-400"
            >
              Eject frame
            </button>
          </div>
        </div>
      </div>

      {selected.status === "done" && selected.analysis && (
        <>
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

          {selected.analysis.cameraTips &&
            selected.analysis.cameraTips.length > 0 && (
              <div className="plate-cream mt-6 rounded-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="led-green h-2 w-2" />
                  <span className="engrave-cream text-[10px]">
                    {hasProfileCamera
                      ? `ON YOUR ${(findCamera(profile!.cameraId)?.fullName || profile!.customCameraName || "").toUpperCase()}`
                      : "ON YOUR CAMERA"}
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {selected.analysis.cameraTips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-stone-700" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {!hasProfileCamera && (
            <div className="plate-cream mt-6 rounded-md px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="led-green h-2 w-2" />
                <span className="engrave-cream text-[10px]">
                  WANT DIAL-SPECIFIC TIPS?
                </span>
              </div>
              <p className="mt-1.5 text-sm text-stone-800">
                Tell Lensed what you shoot with and every critique will reference
                your camera&apos;s actual dials and buttons.
              </p>
              <button
                onClick={() =>
                  window.dispatchEvent(new Event("lensed:open-onboarding"))
                }
                className="btn-chrome mt-2 px-4 py-1.5 text-[10px] uppercase tracking-[0.18em]"
              >
                <span className="engrave">Add your camera</span>
              </button>
            </div>
          )}

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
        </>
      )}
    </article>
  );

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
                className="text-[10px] uppercase tracking-wider text-stone-400 hover:text-stone-300"
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

      {/* Control deck — also a drop target */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`plate-black mb-6 flex flex-wrap items-center justify-between gap-4 rounded-md p-4 transition ${
          dragOver ? "ring-2 ring-stone-300" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="port h-3 w-3" />
          <span className="engrave-cream text-[10px]">
            FILM BAY ·{" "}
            {targetCollectionId
              ? `LOAD INTO "${collections.find((c) => c.id === targetCollectionId)?.name ?? ""}"`
              : "LOAD OR DROP JPEG / PNG / WEBP"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {analyzingCount > 0 && (
            <span className="flex items-center gap-2">
              <span className="led-red h-2 w-2 animate-pulse" />
              <span className="engrave-cream text-[10px]">
                DEVELOPING ×{analyzingCount}
              </span>
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
          <p className="mt-1 text-sm text-stone-400">
            Load a photo to receive a written critique — or develop a sample
            frame to see how it works.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => inputRef.current?.click()}
              className="btn-chrome px-5 py-2 text-[11px] uppercase tracking-[0.18em]"
            >
              <span className="engrave">Load Photos</span>
            </button>
            <button
              onClick={loadSamplePhoto}
              disabled={sampleBusy}
              className="rounded-full border border-stone-600 px-5 py-2 text-[11px] uppercase tracking-[0.18em] text-stone-300 hover:border-stone-400 hover:text-stone-100 disabled:opacity-50"
            >
              {sampleBusy ? "Fetching sample…" : "Try a sample photo"}
            </button>
          </div>
        </div>
      ) : layout === "sheet" ? (
        <div className="space-y-6">
          <div className="plate-black rounded-md p-3">
            <PanelHeader
              label="CONTACT SHEET"
              count={visiblePhotos.length}
              layout={layout}
              onLayout={setLayout}
            />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {visiblePhotos.map((p) => {
                const active = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    title={p.filename}
                    className={`relative aspect-square overflow-hidden rounded-sm border transition ${
                      active
                        ? "border-stone-200"
                        : "border-stone-800 hover:border-stone-600"
                    }`}
                  >
                    <img
                      src={p.thumbDataUrl}
                      alt={p.filename}
                      className="h-full w-full object-cover"
                    />
                    <StatusDot photo={p} className="absolute right-1 top-1" />
                  </button>
                );
              })}
            </div>
          </div>
          {detailArticle}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="plate-black space-y-2 self-start rounded-md p-3">
            <PanelHeader
              label="FILMSTRIP"
              count={visiblePhotos.length}
              layout={layout}
              onLayout={setLayout}
            />
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
                    <div className="text-[10px] uppercase tracking-wider text-stone-400">
                      №{(visiblePhotos.length - i).toString().padStart(3, "0")} ·{" "}
                      {p.status === "analyzing" ? (
                        <span className="text-stone-300">developing…</span>
                      ) : p.status === "failed" ? (
                        <span className="text-red-400">failed — retry</span>
                      ) : (
                        <>
                          {p.analysis?.genre} · {p.analysis?.mood}
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {detailArticle}
        </div>
      )}
    </div>
  );
}

function PanelHeader({
  label,
  count,
  layout,
  onLayout,
}: {
  label: string;
  count: number;
  layout: Layout;
  onLayout: (l: Layout) => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <span className="engrave-cream text-[10px]">
        {label} · {count.toString().padStart(3, "0")}
      </span>
      <span className="flex items-center gap-1">
        {(
          [
            ["strip", "Strip"],
            ["sheet", "Sheet"],
          ] as const
        ).map(([id, text]) => (
          <button
            key={id}
            onClick={() => onLayout(id)}
            aria-pressed={layout === id}
            className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] transition ${
              layout === id
                ? "bg-stone-200 text-stone-900"
                : "text-stone-400 hover:text-stone-200"
            }`}
          >
            {text}
          </button>
        ))}
      </span>
    </div>
  );
}

function StatusDot({
  photo,
  className = "",
}: {
  photo: StoredPhoto;
  className?: string;
}) {
  if (photo.status === "analyzing") {
    return <span className={`led-red h-2 w-2 animate-pulse ${className}`} />;
  }
  if (photo.status === "failed") {
    return <span className={`led-red h-2 w-2 ${className}`} />;
  }
  return null;
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
      <span className="text-[10px] text-stone-400">
        {count.toString().padStart(2, "0")}
      </span>
    </button>
  );
}

function ExifPanel({ exif }: { exif: import("../lib/types").Exif }) {
  const camera = formatCamera(exif);
  const summary = exifSummaryLine(exif);
  const cells: { label: string; value: string | null }[] = [
    { label: "FOCAL", value: formatFocal(exif.focalLength) },
    { label: "APERTURE", value: formatAperture(exif.aperture) },
    { label: "SHUTTER", value: formatShutter(exif.shutterSeconds) },
    { label: "ISO", value: formatIso(exif.iso)?.replace("ISO ", "") ?? null },
  ];
  const hasAny = camera || exif.lensModel || summary;
  if (!hasAny) return null;
  return (
    <div className="plate-cream mt-2 rounded-sm px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="engrave-cream text-[9px]">SHOT DATA</span>
        <span className="font-mono text-[10px] text-stone-700">
          {camera ?? "—"}
        </span>
      </div>
      {exif.lensModel && (
        <div className="mt-0.5 truncate font-mono text-[10px] text-stone-700">
          {exif.lensModel}
        </div>
      )}
      <div className="mt-2 grid grid-cols-4 gap-1 text-center">
        {cells.map((c) => (
          <div key={c.label} className="rounded-sm border border-stone-400/40 bg-white/40 px-1 py-1">
            <div className="text-[9px] uppercase tracking-wider text-stone-700">
              {c.label}
            </div>
            <div className="font-mono text-[11px] text-stone-900">
              {c.value ?? "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
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
