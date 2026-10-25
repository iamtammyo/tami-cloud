"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  loadCollections,
  loadPhotos,
  loadProfile,
  saveCollections,
  savePhotos,
} from "../lib/storage";
import type { Analysis, Collection, Exif, StoredPhoto, UserProfile } from "../lib/types";
import { dataUrlToBase64, fileToScaledDataUrl } from "../lib/image";
import { findCamera } from "../lib/cameras";
import {
  extractExif,
  formatAperture,
  formatCamera,
  formatFocal,
  formatIso,
  formatShutter,
} from "../lib/exif";

type View = "all" | "uncategorized" | string;

export default function MyPhotos() {
  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
    setProfile(loadProfile());

    function onProfileChange(e: Event) {
      setProfile((e as CustomEvent<UserProfile | null>).detail);
    }
    window.addEventListener("lensed:profile-changed", onProfileChange);
    return () => window.removeEventListener("lensed:profile-changed", onProfileChange);
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

  const targetCollectionId = useMemo(
    () => (view === "all" || view === "uncategorized" ? undefined : view),
    [view],
  );

  function buildCameraContext() {
    if (!profile) return null;
    const camera = findCamera(profile.cameraId);
    if (camera) return { fullName: camera.fullName, detailed: true, controls: camera.controls };
    if (profile.customCameraName) return { fullName: profile.customCameraName, detailed: false };
    return null;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBusy(true);
    const cameraCtx = buildCameraContext();
    try {
      const next: StoredPhoto[] = [];
      for (const file of Array.from(files)) {
        const exif = await extractExif(file);
        // 800px keeps the full-width stage sharp; it is also what localStorage
        // has to hold, so the browser's ~5MB quota fills around 35 frames.
        const thumb = await fileToScaledDataUrl(file, 800, 0.82);
        const big = await fileToScaledDataUrl(file, 1568, 0.85);
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: dataUrlToBase64(big.dataUrl),
            mediaType: big.mediaType,
            camera: cameraCtx,
            skillLevel: profile?.skillLevel ?? null,
            mainSubjects: profile?.mainSubjects ?? [],
            exif,
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
          exif: exif ?? undefined,
        });
      }
      const merged = [...next, ...photos];
      // Persist first: if storage is full this throws and the UI never shows
      // frames that would vanish on reload.
      savePhotos(merged);
      setPhotos(merged);
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
    const next = photos.map((p) => (p.id === id ? { ...p, collectionId } : p));
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
    if (collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError(`A collection called "${name}" already exists.`);
      return;
    }
    const c: Collection = { id: crypto.randomUUID(), name, createdAt: Date.now() };
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
  const selectedIndex = selected ? visiblePhotos.indexOf(selected) : -1;
  const totalUncat = photos.filter((p) => !p.collectionId).length;
  const cameraName =
    findCamera(profile?.cameraId ?? null)?.fullName ?? profile?.customCameraName ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={view === "all"} onClick={() => setView("all")}>
          All <Count n={photos.length} />
        </Chip>
        <Chip active={view === "uncategorized"} onClick={() => setView("uncategorized")}>
          Uncategorized <Count n={totalUncat} />
        </Chip>
        {collections.map((c) => {
          const n = photos.filter((p) => p.collectionId === c.id).length;
          const active = view === c.id;
          return (
            <span key={c.id} className="inline-flex items-center">
              <Chip active={active} onClick={() => setView(c.id)}>
                {c.name} <Count n={n} />
              </Chip>
              {active && (
                <button
                  onClick={() => deleteCollection(c.id)}
                  title="Delete collection"
                  className="ml-1 px-1 text-[13px] text-fg3 transition-colors hover:text-accent"
                >
                  ×
                </button>
              )}
            </span>
          );
        })}
        {creating ? (
          <span className="inline-flex items-center gap-2">
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
              className="input py-1.5 text-[13px]"
            />
            <button onClick={createCollection} className="btn py-1.5">
              Add
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="text-[12px] text-fg3 hover:text-fg2"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={() => setCreating(true)} className="chip border-dashed">
            + New
          </button>
        )}

        <div className="ml-auto flex items-center gap-4">
          {busy && (
            <span className="flex items-center gap-2 text-[12px] text-fg3">
              <span className="dot dot-accent animate-pulse" />
              Analyzing…
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
          <button onClick={() => inputRef.current?.click()} disabled={busy} className="btn">
            Upload
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg px-4 py-3 text-[13px] text-fg"
          style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}
        >
          {error}
        </div>
      )}

      {!selected ? (
        <div className="py-24 text-center">
          <p className="font-display text-[32px] text-fg">
            {view === "all" ? "No frames yet." : "Nothing in this collection yet."}
          </p>
          <p className="mt-2 text-[14px] text-fg2">Upload a photo to get a written critique.</p>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn mt-6"
          >
            Upload a photo
          </button>
        </div>
      ) : (
        <>
          <figure className="card overflow-hidden">
            <div className="grid min-h-[280px] place-items-center bg-elev2">
              <img
                key={selected.id}
                src={selected.thumbDataUrl}
                alt={selected.filename}
                className="fade-in max-h-[72vh] w-full object-contain"
              />
            </div>
          </figure>

          <div className="rail flex items-center gap-2 overflow-x-auto py-1">
            {visiblePhotos.map((p) => {
              const active = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  title={p.filename}
                  className={`h-16 w-16 flex-none overflow-hidden rounded-md ring-2 transition ${
                    active ? "ring-accent" : "ring-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={p.thumbDataUrl} alt="" className="h-full w-full object-cover" />
                </button>
              );
            })}
            <span className="ml-auto flex-none pl-4 font-mono text-[11px] text-fg3">
              {selectedIndex + 1} / {visiblePhotos.length}
            </span>
          </div>

          <hr className="border-hair" />

          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="space-y-8 md:col-span-7">
              <p className="font-display text-[24px] italic leading-snug text-fg">
                “{selected.analysis.oneLine}”
              </p>
              <Section label="Composition">{selected.analysis.composition}</Section>
              <Section label="Lighting">{selected.analysis.lighting}</Section>
              <Section label="Technique">{selected.analysis.technique}</Section>
              <div className="grid gap-8 sm:grid-cols-2">
                <List label="Strengths" items={selected.analysis.strengths} />
                <List label="Try next time" items={selected.analysis.improvements} />
              </div>
              {selected.analysis.cameraTips && selected.analysis.cameraTips.length > 0 && (
                <div className="card p-5">
                  <div className="flex items-center gap-2">
                    <span className="dot dot-ok" />
                    <span className="label">On your {cameraName ?? "camera"}</span>
                  </div>
                  <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-fg">
                    {selected.analysis.cameraTips.map((tip) => (
                      <li key={tip} className="flex gap-3">
                        <span className="mt-2 h-1 w-1 flex-none rounded-full bg-fg3" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selected.analysis.similarPhotographers.length > 0 && (
                <Section label="Study these">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.analysis.similarPhotographers.map((n) => (
                      <span key={n} className="chip">
                        {n}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <aside className="space-y-6 self-start md:sticky md:top-28 md:col-span-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-[13px] text-fg">{selected.filename}</span>
                <button
                  onClick={() => deletePhoto(selected.id)}
                  className="flex-none text-[12px] text-fg3 transition-colors hover:text-accent"
                >
                  Remove
                </button>
              </div>
              {selected.exif && <ShotData exif={selected.exif} />}
              <div className="flex flex-wrap gap-1.5">
                <span className="chip chip-on">{selected.analysis.genre}</span>
                <span className="chip chip-on">{selected.analysis.mood}</span>
                {selected.analysis.subjects.slice(0, 4).map((s) => (
                  <span key={s} className="chip">
                    {s}
                  </span>
                ))}
              </div>
              <div>
                <div className="label mb-2">Palette</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.analysis.palette.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="label mb-2">Collection</div>
                <select
                  value={selected.collectionId ?? ""}
                  onChange={(e) => movePhoto(selected.id, e.target.value || undefined)}
                  className="input w-full"
                >
                  <option value="">Uncategorized</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button onClick={onClick} className={`chip ${active ? "chip-on" : ""}`}>
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="font-mono text-[11px] opacity-60">{n}</span>;
}

function ShotData({ exif }: { exif: Exif }) {
  const rows = (
    [
      ["Camera", formatCamera(exif)],
      ["Lens", exif.lensModel ?? null],
      ["Focal length", formatFocal(exif.focalLength)],
      ["Aperture", formatAperture(exif.aperture)],
      ["Shutter", formatShutter(exif.shutterSeconds)],
      ["ISO", formatIso(exif.iso)?.replace("ISO ", "") ?? null],
    ] as [string, string | null][]
  ).filter((r): r is [string, string] => !!r[1]);
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="label mb-2">Shot data</div>
      <dl className="font-mono text-[12px]">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between gap-4 border-b border-hair py-1.5 last:border-0"
          >
            <dt className="text-fg3">{k}</dt>
            <dd className="text-right text-fg">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <div className="label mb-2">{label}</div>
      <div className="text-[15px] leading-relaxed text-fg">{children}</div>
    </section>
  );
}

function List({ label, items }: { label: string; items: string[] }) {
  return (
    <section>
      <div className="label mb-2">{label}</div>
      <ul className="space-y-2 text-[14px] leading-relaxed text-fg">
        {items.map((it) => (
          <li key={it} className="flex gap-3">
            <span className="mt-2 h-1 w-1 flex-none rounded-full bg-fg3" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
