"use client";

import { useState } from "react";
import { LayoutIcon } from "@/components/Diagrams";
import { SectionLabel, Switch } from "@/components/ui";
import { ZinePage } from "@/components/ZinePage";
import { LAYOUTS, PICKABLE_LAYOUTS, layoutSpec } from "@/lib/layouts";
import { BUILT_IN_PACKS, findPack } from "@/lib/packs";
import { pageBackground } from "@/lib/render/page";
import { currentPack, useZine } from "@/lib/store";

export function Inspector() {
  const zine = useZine((s) => s.zine)!;
  const pos = useZine((s) => s.selected.page);
  const frame = useZine((s) => s.selected.frame);
  const pack = useZine(currentPack);
  const customPacks = useZine((s) => s.customPacks);
  const assets = useZine((s) => s.assets);
  const s = useZine.getState();
  const page = zine.pages[pos];
  const L = layoutSpec(page.layout);
  const photo = page.photos?.[frame] ?? null;
  const [hoverPack, setHoverPack] = useState<string | null>(null);
  const previewPack = findPack(hoverPack ?? zine.typePackId, customPacks);

  const swatches = Array.from(new Set(["#FFFFFF", pack.colors.bg, pack.colors.fg, ...(pack.colors.accent ? [pack.colors.accent] : [])]));
  const bg = pageBackground(page, pack);

  return (
    <aside aria-label="Page settings" className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
      <div className="flex flex-col gap-3">
        <SectionLabel>Layout</SectionLabel>
        {L.pickable ? (
          <div role="radiogroup" aria-label="Layout" className="flex flex-wrap gap-2">
            {PICKABLE_LAYOUTS.map((id) => {
              const active = page.layout === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={LAYOUTS[id].name}
                  title={LAYOUTS[id].name}
                  onClick={() => s.setLayout(pos, id)}
                  className={`rounded-[8px] p-1.5 transition duration-150 ease-out ${active ? "border-[1.5px] border-fg text-fg" : "border border-line text-muted hover:border-fg hover:text-fg"}`}
                >
                  <LayoutIcon frames={LAYOUTS[id].frames} />
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-muted">{L.name}. This page&rsquo;s layout is fixed.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="pack" className="font-mono text-[13px] text-muted">
          Type pack
        </label>
        <select
          id="pack"
          value={zine.typePackId}
          onChange={(e) => {
            s.setPack(e.target.value);
            setHoverPack(null);
          }}
          className="h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-[15px] text-fg outline-none focus:border-fg"
        >
          <optgroup label="Packs">
            {BUILT_IN_PACKS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </optgroup>
          {customPacks.length ? (
            <optgroup label="Your packs">
              {customPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <div className="grid max-w-[300px] grid-cols-2 gap-2" aria-label="Live preview">
          <ZinePage zine={zine} pack={previewPack} assets={assets} n={1} variant="thumb" className="rounded-[4px] border border-line" />
          <ZinePage zine={zine} pack={previewPack} assets={assets} n={pos + 1 === 1 ? 2 : pos + 1} variant="thumb" className="rounded-[4px] border border-line" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Page colour</SectionLabel>
        <div role="radiogroup" aria-label="Page colour" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={!page.bgColor}
            onClick={() => s.setBg(pos, undefined)}
            className={`h-8 rounded-full px-3 text-[13px] transition duration-150 ease-out ${!page.bgColor ? "border-[1.5px] border-fg" : "border border-line text-muted hover:border-fg"}`}
          >
            Default
          </button>
          {swatches.map((c) => {
            const active = page.bgColor?.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Colour ${c}`}
                title={c}
                onClick={() => s.setBg(pos, c)}
                className={`h-8 w-8 rounded-full transition duration-150 ease-out ${active ? "ring-[1.5px] ring-fg ring-offset-2 ring-offset-bg" : "border border-line"}`}
                style={{ background: c }}
              />
            );
          })}
          <label className="relative inline-flex h-8 cursor-pointer items-center rounded-full border border-line px-3 text-[13px] text-muted hover:border-fg">
            Custom
            <input
              type="color"
              aria-label="Custom page colour"
              value={bg}
              onChange={(e) => s.setBg(pos, e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
        </div>
      </div>

      {L.frames.length ? (
        <div className="flex flex-col gap-3">
          <SectionLabel>Photo{L.frames.length > 1 ? ` ${frame + 1} of ${L.frames.length}` : ""}</SectionLabel>
          {photo ? (
            <>
              <label className="flex flex-col gap-2 text-[13px] text-muted">
                Zoom
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={photo.crop.scale}
                  onChange={(e) => s.setCrop(pos, frame, { ...photo.crop, scale: Number(e.target.value) })}
                  className="w-full accent-[var(--fg)]"
                />
              </label>
              <p className="text-[13px] text-muted">Drag the photo on the page to move it.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => s.setCrop(pos, frame, { x: 0.5, y: 0.5, scale: 1 })} className="text-[13px] text-muted underline hover:text-fg">
                  Reset
                </button>
                <button type="button" onClick={() => s.clearPhoto(pos, frame)} className="text-[13px] text-fg underline decoration-accent decoration-2 underline-offset-2">
                  Remove photo
                </button>
              </div>
            </>
          ) : (
            <p className="text-[13px] text-muted">Empty. Drag a photo onto the page, or click one in the camera roll.</p>
          )}
        </div>
      ) : null}

      <Switch
        label="Auto captions"
        description="Fill place and date from each photo"
        checked={zine.autoCaptions}
        onChange={(v) => s.setAutoCaptions(v)}
      />
    </aside>
  );
}
