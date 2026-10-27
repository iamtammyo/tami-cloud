"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AssetUrlContext, type AssetUrlResolver } from "@/components/assetUrls";
import { Button, LinkButton } from "@/components/ui";
import { isSample, sampleUrl } from "@/lib/samples";
import { assetUrl, currentPack, useZine } from "@/lib/store";
import { CameraRoll } from "./CameraRoll";
import { Inspector } from "./Inspector";
import { PageCanvas } from "./PageCanvas";
import { PageFields } from "./PageFields";
import { PageRail } from "./PageRail";
import { PreviewFold } from "./PreviewFold";

// Mouse and touch drops go to whatever is under the pointer; keyboard moves use the nearest item.
const collision: CollisionDetection = (args) => (args.pointerCoordinates ? pointerWithin(args) : closestCenter(args));

export function Editor({ id }: { id: string }) {
  const zine = useZine((s) => s.zine);
  const missing = useZine((s) => s.missing);
  const urls = useZine((s) => s.urls);
  const openZine = useZine((s) => s.openZine);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const resolver = useMemo<AssetUrlResolver>(
    () => (assetId, variant) => urls[assetId]?.[variant] ?? (isSample(assetId) ? sampleUrl(assetId) : undefined),
    [urls],
  );

  useEffect(() => {
    void openZine(id);
  }, [id, openZine]);

  // Save before the tab closes.
  useEffect(() => {
    const onHide = () => void useZine.getState().flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((e: DragStartEvent) => {
    const d = e.active.data.current as { type?: string; assetId?: string } | undefined;
    setDragging(d?.type === "asset" ? d.assetId ?? null : null);
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setDragging(null);
    const a = e.active.data.current as { type: string; assetId?: string; pos?: number } | undefined;
    const o = e.over?.data.current as { type: string; frame?: number; pos?: number } | undefined;
    if (!a || !o) return;
    const s = useZine.getState();
    if (a.type === "asset" && a.assetId) {
      if (o.type === "frame") {
        s.placePhoto(s.selected.page, o.frame ?? 0, a.assetId);
        s.select(s.selected.page, o.frame ?? 0);
      } else if (o.type === "page" && o.pos !== undefined) {
        s.placePhoto(o.pos, 0, a.assetId);
        s.select(o.pos, 0);
      }
    } else if (a.type === "page" && o.type === "page" && a.pos !== undefined && o.pos !== undefined) {
      s.movePage(a.pos, o.pos);
    }
  }, []);

  if (missing) {
    return (
      <main className="mx-auto flex min-h-screen max-w-content flex-col items-start justify-center gap-4 px-4 sm:px-8">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">That zine isn&rsquo;t on this device.</h1>
        <p className="text-muted">Zines are saved in this browser only.</p>
        <LinkButton href="/zines">My zines</LinkButton>
      </main>
    );
  }
  if (!zine) return <main className="p-8 font-mono text-[13px] text-muted">Opening zine…</main>;

  return (
    <AssetUrlContext.Provider value={resolver}>
      <DndContext sensors={sensors} collisionDetection={collision} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
        <div className="flex min-h-screen flex-col">
          <TopBar onPreview={() => setPreviewOpen(true)} />
          <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-6 sm:px-6 grid-cols-[minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_300px]">
            <PageRail />
            {/* Wide screens: page and camera roll side by side, so drags are short and both stay in view. */}
            <main className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start">
              <div className="flex min-w-0 flex-col gap-6">
                <PageCanvas />
                <PageFields />
              </div>
              <div className="min-w-0 xl:sticky xl:top-24">
                <CameraRoll />
              </div>
            </main>
            <Inspector />
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {dragging ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(dragging, "thumb")} alt="" className="h-20 w-20 rounded-[8px] object-cover opacity-90" />
          ) : null}
        </DragOverlay>
      </DndContext>
      {previewOpen ? <PreviewFold onClose={() => setPreviewOpen(false)} /> : null}
    </AssetUrlContext.Provider>
  );
}

function TopBar({ onPreview }: { onPreview: () => void }) {
  const zine = useZine((s) => s.zine)!;
  const setTitle = useZine((s) => s.setTitle);
  const pack = useZine(currentPack);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link href="/" className="hidden shrink-0 text-[17px] font-semibold tracking-[-0.02em] sm:block">
          pocket press
        </Link>
        <Link href="/zines" className="shrink-0 font-mono text-[13px] text-muted hover:text-fg sm:hidden">
          ← Zines
        </Link>
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="sr-only">Zine title</span>
          <input
            value={zine.title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-10 min-w-0 flex-1 rounded-[10px] border border-transparent bg-transparent px-2 text-[17px] font-medium tracking-[-0.01em] outline-none transition duration-150 ease-out hover:border-line focus:border-fg"
          />
        </label>
        <span className="hidden font-mono text-[13px] text-muted md:inline">{pack.name}</span>
        <Button variant="secondary" onClick={onPreview} className="px-4 sm:px-5">
          <span className="sm:hidden">Preview</span>
          <span className="hidden sm:inline">Preview fold</span>
        </Button>
        <LinkButton href={`/print/${zine.id}`}>Print</LinkButton>
      </div>
    </header>
  );
}
