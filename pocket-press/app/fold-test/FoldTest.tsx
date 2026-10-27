"use client";

import { useState } from "react";
import { SheetPreview } from "@/components/SheetPreview";
import { Button, SegmentedControl, Switch } from "@/components/ui";
import { FOLDS } from "@/lib/folds";
import { PAPER_IDS, PAPERS } from "@/lib/paper";
import { downloadBytes, exportSheet } from "@/lib/pdf/exportClient";
import { printFileName } from "@/lib/pdf/fileName";
import { renderTestPage } from "@/lib/render/testPage";
import type { PaperId } from "@/lib/types";

const FOLD_STEPS = [
  { title: "Fold in half long-ways", body: "Printed side out, so the red dashed line sits right on the fold." },
  { title: "Cut the middle", body: "Through both layers, from the fold to where the dashed line stops. Middle two panels only." },
  { title: "Push into a plus", body: "Open it, refold long-ways, then push the two ends toward each other so the slit opens up." },
  { title: "Flatten into a book", body: "Fold the arms round so page 1 ends up on the front." },
];

const CHECKS = [
  "Pages read 1 to 8 in order.",
  "Every TOP arrow points up.",
  "The dashed safe-area box survived on the outer edges. If it got clipped, your printer's margin is wider than 6mm.",
];

export function FoldTest() {
  const fold = FOLDS.mini8;
  const [paperId, setPaperId] = useState<PaperId>("A4");
  const [cutLine, setCutLine] = useState(true);
  const [foldGuides, setFoldGuides] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paper = PAPERS[paperId];

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const bytes = await exportSheet({ kind: "test", paper: paperId, cutLine, foldGuides });
      downloadBytes(bytes, printFileName("Fold test", paper));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong building the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 pb-24 sm:px-8">
      <p className="pt-8 font-mono text-[13px] text-muted">Fold test</p>
      <section className="pb-10 pt-4">
        <h1 className="max-w-[16ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">
          Print a test sheet before anything else.
        </h1>
        <p className="mt-4 max-w-[60ch] text-[17px] text-muted">
          Eight numbered placeholder pages, imposed for the 8-page mini. Print it, cut it, fold it. If the pages
          read 1 to 8 and none are upside down, the imposition is right and everything else can be built on top.
        </p>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <SheetPreview fold={fold} paper={paper} renderPage={renderTestPage} cutLine={cutLine} foldGuides={foldGuides} />
          <p className="mt-3 text-[13px] text-muted">
            {paper.label} landscape, {paper.pageLabel}. The top row prints upside down on purpose.
          </p>
        </div>

        <aside className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[13px] text-muted">01 Paper</h2>
            <SegmentedControl
              label="Paper size"
              value={paperId}
              onChange={setPaperId}
              options={PAPER_IDS.map((id) => ({ value: id, label: PAPERS[id].label }))}
            />
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="font-mono text-[13px] text-muted">02 Marks</h2>
            <Switch label="Cut line" description="Thin dashed line in the middle" checked={cutLine} onChange={setCutLine} />
            <Switch
              label="Fold guides"
              description="Small ticks at the sheet edges"
              checked={foldGuides}
              onChange={setFoldGuides}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="rounded-[12px] border border-line p-4 text-[13px]">
              <p className="font-medium">Print at 100% / Actual size</p>
              <p className="mt-1 text-muted">
                Printers default to &ldquo;Fit to page&rdquo;, which shrinks the sheet and breaks the fold. One-sided
                only.
              </p>
            </div>
            <Button onClick={download} disabled={busy} aria-live="polite">
              {busy ? "Building PDF…" : "Download test PDF"}
            </Button>
            {error ? (
              <p role="alert" className="text-[13px] text-fg underline decoration-accent decoration-2">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[13px] text-muted">03 Fold in four moves</h2>
            <ol className="flex flex-col gap-3">
              {FOLD_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="font-medium">{s.title}.</span> <span className="text-muted">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="font-mono text-[13px] text-muted">04 Check</h2>
            <ul className="flex flex-col gap-2 text-muted">
              {CHECKS.map((c) => (
                <li key={c} className="flex gap-2">
                  <span aria-hidden>·</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
