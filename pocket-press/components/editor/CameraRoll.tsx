"use client";

import { useDraggable } from "@dnd-kit/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAssetUrl } from "@/components/assetUrls";
import { SegmentedControl } from "@/components/ui";
import { frameCount } from "@/lib/layouts";
import { groupRoll } from "@/lib/roll";
import { SAMPLES, isSample } from "@/lib/samples";
import { useZine } from "@/lib/store";
import { formatDate } from "@/lib/zine";

const TIP_KEY = "pp-tip-location";

export function CameraRoll() {
  const zine = useZine((s) => s.zine)!;
  const rollIds = useZine((s) => s.rollIds);
  const assets = useZine((s) => s.assets);
  const importing = useZine((s) => s.importing);
  const importFiles = useZine((s) => s.importFiles);
  const input = useRef<HTMLInputElement>(null);
  const usesSamples = zine.pages.some((p) => p.photos?.some((ph) => ph && isSample(ph.assetId)));
  const [showSamples, setShowSamples] = useState(usesSamples);
  const [group, setGroup] = useState("all");
  const [tip, setTip] = useState(false);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    try {
      setTip(!localStorage.getItem(TIP_KEY));
    } catch {}
  }, []);

  const ids = useMemo(() => [...rollIds, ...(showSamples ? SAMPLES.map((s) => s.id) : [])], [rollIds, showSamples]);
  const metas = ids.map((id) => assets[id]).filter(Boolean);
  const groups = groupRoll(metas);
  const visible = group === "all" ? ids : groups.find((g) => g.key === group)?.ids ?? ids;

  // Where each photo is used, for the "on page N" marker.
  const usedOn = new Map<string, number>();
  zine.pages.forEach((p) => p.photos?.forEach((ph) => ph && !usedOn.has(ph.assetId) && usedOn.set(ph.assetId, p.index)));

  function dismissTip() {
    setTip(false);
    try {
      localStorage.setItem(TIP_KEY, "1");
    } catch {}
  }

  return (
    <section
      aria-label="Camera roll"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDropping(true);
        }
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDropping(false);
        void importFiles(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/") || /\.hei[cf]$/i.test(f.name)));
      }}
      className={`flex flex-col gap-4 rounded-[12px] border p-4 transition duration-150 ease-out ${dropping ? "border-fg" : "border-line"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[17px] font-medium tracking-[-0.01em]">
          Camera roll <span className="font-mono text-[13px] text-muted">{ids.length}</span>
        </h2>
        <div className="flex items-center gap-2">
          {importing ? (
            <span className="font-mono text-[13px] text-muted" role="status">
              Adding {importing.done + 1 > importing.total ? importing.total : importing.done + 1} of {importing.total}…
            </span>
          ) : null}
          {!showSamples ? (
            <button type="button" onClick={() => setShowSamples(true)} className="text-[13px] text-muted underline hover:text-fg">
              Show sample photos
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex h-10 items-center rounded-full bg-inv-bg px-5 text-[15px] font-medium text-inv-fg transition duration-150 ease-out hover:opacity-90"
          >
            Add photos
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              void importFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {tip ? (
        <div className="flex items-start justify-between gap-3 rounded-[10px] bg-surface p-3 text-[13px]">
          <p>
            <span className="font-medium">No locations?</span>{" "}
            <span className="text-muted">On iPhone, tap Options and turn on Location when picking photos.</span>
          </p>
          <button type="button" onClick={dismissTip} className="shrink-0 text-muted underline hover:text-fg">
            Got it
          </button>
        </div>
      ) : null}

      {groups.length > 1 ? (
        <div className="overflow-x-auto">
          <SegmentedControl
            label="Group photos"
            value={group}
            onChange={setGroup}
            options={[{ value: "all", label: "All" }, ...groups.map((g) => ({ value: g.key, label: g.label }))]}
          />
        </div>
      ) : null}

      {ids.length ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 xl:max-h-[calc(100vh-20rem)] xl:grid-cols-4 xl:overflow-y-auto xl:p-0.5">
          {visible.map((id) => (
            <RollPhoto key={id} id={id} usedOn={usedOn.get(id)} />
          ))}
        </ul>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="flex h-40 flex-col items-center justify-center gap-1 rounded-[10px] border-[1.5px] border-dashed border-line bg-surface text-muted transition duration-150 ease-out hover:border-fg hover:text-fg"
        >
          <span className="text-[15px] font-medium">Add photos from your camera roll</span>
          <span className="text-[13px]">or drop them here. JPEG, PNG and iPhone HEIC all work.</span>
        </button>
      )}
    </section>
  );
}

function RollPhoto({ id, usedOn }: { id: string; usedOn?: number }) {
  const meta = useZine((s) => s.assets[id]);
  const resolve = useAssetUrl();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `asset-${id}`, data: { type: "asset", assetId: id } });
  const where = [meta?.place, meta?.takenAt ? formatDate(new Date(meta.takenAt)) : isSample(id) ? (meta as { date?: string })?.date : ""]
    .filter(Boolean)
    .join(", ");
  const alt = where || "Photo";

  function fill() {
    const s = useZine.getState();
    const z = s.zine!;
    let { page, frame } = s.selected;
    // If the selected page has no photo frames, use the next page that does.
    if (!frameCount(z.pages[page].layout)) {
      const next = z.pages.findIndex((p, i) => i > page && frameCount(p.layout) > 0);
      if (next < 0) return;
      page = next;
      frame = 0;
    }
    s.placePhoto(page, frame, id);
    s.select(page, frame);
  }

  return (
    <li>
      <button
        ref={setNodeRef}
        type="button"
        onClick={fill}
        aria-label={`${alt}. Click to put on the selected page, or drag onto a page.`}
        {...attributes}
        {...listeners}
        className={`relative block aspect-square w-full overflow-hidden rounded-[6px] border border-line transition duration-150 ease-out hover:border-fg ${
          isDragging ? "opacity-40" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolve(id, "thumb")} alt={alt} className="h-full w-full object-cover" draggable={false} />
        {usedOn ? (
          <span className="absolute bottom-1 right-1 rounded-full px-1.5 font-mono text-[10px]" style={{ background: "var(--inv-bg)", color: "var(--inv-fg)" }}>
            {String(usedOn).padStart(2, "0")}
          </span>
        ) : null}
      </button>
    </li>
  );
}
