"use client";

import { useDroppable } from "@dnd-kit/core";
import { useRef } from "react";
import { ZinePage } from "@/components/ZinePage";
import { FOLDS } from "@/lib/folds";
import { sheetGeometry } from "@/lib/imposition";
import { layoutSpec, type FrameSpec } from "@/lib/layouts";
import { PAPERS } from "@/lib/paper";
import { coverPlacement } from "@/lib/render/ops";
import { currentPack, useZine } from "@/lib/store";

/** The selected page, large. Photo frames are drop targets; drag a placed photo to pan it. */
export function PageCanvas() {
  const zine = useZine((s) => s.zine)!;
  const pack = useZine(currentPack);
  const assets = useZine((s) => s.assets);
  const { page: pos } = useZine((s) => s.selected);
  const page = zine.pages[pos];
  const L = layoutSpec(page.layout);
  const g = sheetGeometry(FOLDS[zine.fold], PAPERS[zine.paper]);
  const n = pos + 1;
  const label = n === 1 ? "Cover" : n === zine.pages.length ? "Back cover" : `Page ${n}`;

  return (
    <section aria-label={`${label}, selected`} className="flex flex-col items-center gap-3">
      {/* Capped by screen height so the camera roll stays in view for dragging. */}
      <div className="relative w-full" style={{ maxWidth: `min(420px, calc(68vh * ${(g.panelW / g.panelH).toFixed(4)}))` }}>
        <ZinePage zine={zine} pack={pack} assets={assets} n={n} className="rounded-[4px] border border-line" />
        {L.frames.map((f, i) => (
          <FrameTarget key={`${page.layout}-${i}`} frame={f} index={i} count={L.frames.length} />
        ))}
      </div>
      <p className="font-mono text-[13px] text-muted">
        {L.name === label ? label : `${label} · ${L.name}`}
      </p>
    </section>
  );
}

function FrameTarget({ frame, index, count }: { frame: FrameSpec; index: number; count: number }) {
  const zine = useZine((s) => s.zine)!;
  const assets = useZine((s) => s.assets);
  const selected = useZine((s) => s.selected);
  const select = useZine((s) => s.select);
  const setCrop = useZine((s) => s.setCrop);
  const ref = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; y: number; crop: { x: number; y: number; scale: number } } | null>(null);
  const { setNodeRef, isOver } = useDroppable({ id: `frame-${index}`, data: { type: "frame", frame: index } });

  const page = zine.pages[selected.page];
  const photo = page.photos?.[index] ?? null;
  const meta = photo ? assets[photo.assetId] : undefined;
  const isSelected = selected.frame === index;
  const g = sheetGeometry(FOLDS[zine.fold], PAPERS[zine.paper]);
  const fw = (frame.w / 100) * g.panelW;
  const fh = (frame.h / 100) * g.panelH;

  // How far the photo can move, in page points, at the current zoom.
  function overflow() {
    if (!photo || !meta) return { x: 0, y: 0 };
    const d = coverPlacement(meta.width, meta.height, { x: 0, y: 0, w: fw, h: fh }, photo.crop).draw;
    return { x: d.w - fw, y: d.h - fh };
  }

  function nudge(dxPt: number, dyPt: number, base = photo?.crop) {
    if (!photo || !base) return;
    const o = overflow();
    setCrop(selected.page, index, {
      ...base,
      x: o.x > 0 ? Math.min(1, Math.max(0, base.x - dxPt / o.x)) : base.x,
      y: o.y > 0 ? Math.min(1, Math.max(0, base.y - dyPt / o.y)) : base.y,
    });
  }

  const name = count > 1 ? `Photo frame ${index + 1} of ${count}` : "Photo frame";
  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        ref.current = el;
      }}
      role="button"
      tabIndex={0}
      aria-label={photo ? `${name}. Drag or use arrow keys to move the photo.` : `${name}, empty. Drop a photo here, or select it and click a photo in the roll.`}
      aria-pressed={isSelected}
      onClick={() => select(selected.page, index)}
      onKeyDown={(e) => {
        const step = 8;
        const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[e.key] && photo) {
          e.preventDefault();
          nudge(...moves[e.key]);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(selected.page, index);
        }
      }}
      onPointerDown={(e) => {
        select(selected.page, index);
        if (!photo) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, crop: { ...photo.crop } };
      }}
      onPointerMove={(e) => {
        if (!drag.current || !ref.current) return;
        const ptPerPx = fw / ref.current.getBoundingClientRect().width;
        nudge((e.clientX - drag.current.x) * ptPerPx, (e.clientY - drag.current.y) * ptPerPx, drag.current.crop);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      style={{ left: `${frame.x}%`, top: `${frame.y}%`, width: `${frame.w}%`, height: `${frame.h}%`, touchAction: photo ? "none" : undefined }}
      className={`absolute flex items-center justify-center rounded-[6px] transition duration-150 ease-out ${
        photo ? "cursor-move" : "cursor-pointer border-[1.5px] border-dashed border-muted"
      } ${isOver ? "outline outline-2 outline-offset-[-2px] outline-fg" : ""} ${
        isSelected && count > 1 ? "outline outline-[1.5px] outline-offset-2 outline-fg" : ""
      }`}
    >
      {!photo ? (
        <span className="rounded-full px-2 py-0.5 text-[12px] text-muted" style={{ background: "var(--bg)" }}>
          Drop a photo
        </span>
      ) : null}
    </div>
  );
}
