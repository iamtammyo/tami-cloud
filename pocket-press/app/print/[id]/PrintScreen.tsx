"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetUrlContext, type AssetUrlResolver } from "@/components/assetUrls";
import { FoldStepDiagram } from "@/components/Diagrams";
import { SheetPreview } from "@/components/SheetPreview";
import { Button, Callout, LinkButton, SectionLabel, SegmentedControl, Switch, fieldClass } from "@/components/ui";
import { FOLDS } from "@/lib/folds";
import { PAPER_IDS, PAPERS } from "@/lib/paper";
import { downloadBytes, exportSheet } from "@/lib/pdf/exportClient";
import { printFileName } from "@/lib/pdf/fileName";
import { zineRenderer } from "@/lib/render/zineRenderer";
import { isSample, sampleUrl } from "@/lib/samples";
import { blobsForZine, currentPack, useZine } from "@/lib/store";
import type { PaperId } from "@/lib/types";

const STEPS = [
  { title: "Fold in half long-ways", body: "Printed side out, so the cut line sits on the fold." },
  { title: "Cut the middle", body: "From the fold, along the red dashes. Only the middle two panels." },
  { title: "Push into a plus", body: "Open it, refold long-ways, and push the ends together." },
  { title: "Flatten into a book", body: "Fold the arms round so the cover ends up on the front." },
];

export function PrintScreen({ id }: { id: string }) {
  const zine = useZine((s) => s.zine);
  const missing = useZine((s) => s.missing);
  const assets = useZine((s) => s.assets);
  const urls = useZine((s) => s.urls);
  const pack = useZine(currentPack);
  const openZine = useZine((st) => st.openZine);
  const s = useZine.getState();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void openZine(id);
  }, [id, openZine]);

  const resolver = useMemo<AssetUrlResolver>(
    () => (assetId, variant) => urls[assetId]?.[variant] ?? (isSample(assetId) ? sampleUrl(assetId) : undefined),
    [urls],
  );
  const render = useMemo(() => (zine ? zineRenderer(zine, pack, assets) : null), [zine, pack, assets]);

  if (missing) {
    return (
      <main className="mx-auto max-w-content px-4 py-16 sm:px-8">
        <p className="text-muted">That zine isn&rsquo;t on this device.</p>
      </main>
    );
  }
  if (!zine || !render) return <main className="p-8 font-mono text-[13px] text-muted">Opening zine…</main>;
  const paper = PAPERS[zine.paper];

  async function download() {
    if (!zine) return;
    setError(null);
    setProgress({ done: 0, total: 1 });
    try {
      await s.flush();
      const blobs = await blobsForZine(zine);
      const bytes = await exportSheet({ kind: "zine", zine, pack, assets, blobs }, (done, total) => setProgress({ done, total }));
      downloadBytes(bytes, printFileName(zine.title, paper));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong building the PDF.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <AssetUrlContext.Provider value={resolver}>
      <main className="mx-auto max-w-content px-4 pb-24 sm:px-8">
        <div className="pt-8">
          <Link href={`/editor/${zine.id}`} className="font-mono text-[13px] text-muted hover:text-fg">
            ← Back to {zine.title}
          </Link>
        </div>
        <section className="pb-10 pt-4">
          <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">One sheet. One cut. One zine.</h1>
        </section>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-3">
            <SheetPreview
              fold={FOLDS[zine.fold]}
              paper={paper}
              renderPage={render}
              cutLine={zine.print.cutLine}
              foldGuides={zine.print.foldGuides}
            />
            <p className="text-[13px] text-muted">
              {paper.label} landscape, {paper.pageLabel}. The top row prints upside down on purpose. Print one-sided; the back
              of the sheet stays blank.
            </p>
          </div>

          <aside className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <SectionLabel>Paper</SectionLabel>
              <SegmentedControl
                label="Paper size"
                value={zine.paper}
                onChange={(p: PaperId) => s.setPaper(p)}
                options={PAPER_IDS.map((p) => ({ value: p, label: PAPERS[p].label }))}
              />
              <p className="text-[13px] text-muted">
                A3 makes A6 pages, A4 makes A7 pages.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <SectionLabel>Marks</SectionLabel>
              <Switch label="Cut line" description="Thin dashed line to cut along" checked={zine.print.cutLine} onChange={(v) => s.setPrint({ cutLine: v })} />
              <Switch label="Fold guides" description="Small ticks at the sheet edges" checked={zine.print.foldGuides} onChange={(v) => s.setPrint({ foldGuides: v })} />
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium">Copies</span>
                  <span className="block text-[13px] text-muted">Set the number in your print dialog too</span>
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={zine.print.copies}
                  onChange={(e) => s.setPrint({ copies: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}
                  className={`${fieldClass} w-20 text-center`}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <Callout title="Print at 100% / Actual size">
                Printers default to &ldquo;Fit to page&rdquo;, which shrinks the sheet and breaks the fold.
              </Callout>
              <Button onClick={download} disabled={!!progress} aria-live="polite">
                {progress
                  ? progress.total > 1
                    ? `Preparing photos ${Math.min(progress.done + 1, progress.total)} of ${progress.total}…`
                    : "Building PDF…"
                  : "Download print PDF"}
              </Button>
              {error ? (
                <p role="alert" className="text-[13px] text-fg underline decoration-accent decoration-2">
                  {error}
                </p>
              ) : null}
              <LinkButton href="/print-shops" variant="secondary">
                Find a print shop
              </LinkButton>
            </div>
          </aside>
        </div>

        <section className="mt-16 flex flex-col gap-4">
          <SectionLabel>Fold in four moves</SectionLabel>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((st, i) => (
              <li key={st.title} className="flex flex-col gap-3 rounded-[12px] border border-line p-4">
                <FoldStepDiagram step={(i + 1) as 1 | 2 | 3 | 4} />
                <p>
                  <span className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")} </span>
                  <span className="font-medium">{st.title}.</span> <span className="text-muted">{st.body}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </AssetUrlContext.Provider>
  );
}
