"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FoldDiagram } from "@/components/Diagrams";
import { Button, RadioCards, SectionLabel, Tag } from "@/components/ui";
import { ZinePage } from "@/components/ZinePage";
import { LOOKS } from "@/lib/looks";
import { findPack } from "@/lib/packs";
import { SAMPLE_META } from "@/lib/samples";
import { saveNewZine } from "@/lib/store";
import { newZine, sampleZine } from "@/lib/zine";

const FORMATS = [
  { id: "mini8", name: "8-page mini", detail: "One sheet, one cut", soon: false },
  { id: "accordion16", name: "16-panel accordion", detail: "Folds out long", soon: true },
  { id: "pocket", name: "Pocket mini", detail: "Palm-sized", soon: true },
  { id: "booklet", name: "Stapled booklet", detail: "More pages", soon: true },
] as const;

export function StartScreen() {
  const router = useRouter();
  const [fold, setFold] = useState<(typeof FORMATS)[number]["id"]>("mini8");
  const [lookId, setLookId] = useState(LOOKS[0].id);
  const [busy, setBusy] = useState(false);
  const look = LOOKS.find((l) => l.id === lookId)!;

  const previews = useMemo(
    () =>
      Object.fromEntries(
        LOOKS.map((l) => [
          l.id,
          sampleZine({ packId: l.packId, coverLayout: l.coverLayout, title: l.coverLayout === "cover_type" ? "Notes from Hoi An" : "Hoi An", paper: "A3" }),
        ]),
      ),
    [],
  );

  async function create(withSamples: boolean) {
    setBusy(true);
    const opts = { packId: look.packId, coverLayout: look.coverLayout };
    const z = withSamples ? sampleZine(opts) : newZine(opts);
    const id = await saveNewZine(z);
    router.push(`/editor/${id}`);
  }

  return (
    <main className="mx-auto max-w-content px-4 pb-40 sm:px-8">
      <section className="pb-12 pt-12 sm:pt-20">
        <h1 className="max-w-[14ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">
          Make a zine from your camera roll.
        </h1>
        <p className="mt-4 max-w-[52ch] text-[17px] text-muted">
          Pick a fold and a look, drop in your photos, and print one sheet that folds into a little book. We handle the
          page order, the upside-down bits and the cut line.
        </p>
      </section>

      <section className="flex flex-col gap-4 pb-12">
        <SectionLabel>01 Fold</SectionLabel>
        <RadioCards
          label="Fold"
          value={fold}
          onChange={setFold}
          options={FORMATS.map((f) => ({ value: f.id, disabled: f.soon }))}
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
          render={(id, { disabled }) => {
            const f = FORMATS.find((x) => x.id === id)!;
            return (
              <div className={`flex flex-col gap-3 ${disabled ? "text-muted" : ""}`}>
                <div className="flex items-start justify-between">
                  <FoldDiagram fold={f.id} />
                  {f.soon ? <Tag>Soon</Tag> : null}
                </div>
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-[13px] text-muted">{f.detail}</p>
                </div>
              </div>
            );
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel>02 Look</SectionLabel>
        <RadioCards
          label="Look"
          value={lookId}
          onChange={setLookId}
          options={LOOKS.map((l) => ({ value: l.id }))}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          render={(id) => {
            const l = LOOKS.find((x) => x.id === id)!;
            return (
              <div className="flex flex-col gap-3">
                <ZinePage
                  zine={previews[id]}
                  pack={findPack(l.packId)}
                  assets={SAMPLE_META}
                  n={1}
                  variant="thumb"
                  className="rounded-[4px]"
                  label={`${l.name} cover preview`}
                />
                <p className="text-[15px] font-medium">{l.name}</p>
              </div>
            );
          }}
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg">
        <div className="mx-auto flex max-w-content flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <p className="text-[15px]">
            <span className="font-mono text-[13px] text-muted">Your zine </span>
            <span className="font-medium">8-page mini</span>
            <span className="text-muted"> · </span>
            <span className="font-medium">{look.name}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => create(true)} disabled={busy}>
              Try with sample photos
            </Button>
            <Button onClick={() => create(false)} disabled={busy}>
              Add photos
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
