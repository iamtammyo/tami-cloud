"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageSvg } from "@/components/PageSvg";
import { Button, SectionLabel, SegmentedControl, fieldClass } from "@/components/ui";
import { ZinePage } from "@/components/ZinePage";
import { db } from "@/lib/db";
import { BUILT_IN_PACKS, MIX_CAPTION_FONTS, PACK_CATEGORIES, mixTitleFonts } from "@/lib/packs";
import { coverTitleSizeAtA7 } from "@/lib/render/page";
import { renderSpecimen } from "@/lib/render/specimen";
import { SAMPLE_META } from "@/lib/samples";
import { LAST_ZINE_KEY, saveNewZine, useZine } from "@/lib/store";
import type { TypePack } from "@/lib/types";
import { newZine, sampleZine, uid } from "@/lib/zine";

type Filter = (typeof PACK_CATEGORIES)[number]["value"];

export function PacksScreen() {
  const router = useRouter();
  const customPacks = useZine((s) => s.customPacks);
  const loadPacks = useZine((s) => s.loadPacks);
  const deleteCustomPack = useZine((s) => s.deleteCustomPack);
  const [filter, setFilter] = useState<Filter>("all");
  const [openZine, setOpenZine] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    void loadPacks();
    (async () => {
      try {
        const id = localStorage.getItem(LAST_ZINE_KEY);
        const z = id ? await db().zines.get(id) : undefined;
        if (z) setOpenZine({ id: z.id, title: z.title });
      } catch {}
    })();
  }, [loadPacks]);

  const packs = [...BUILT_IN_PACKS, ...customPacks].filter((p) => filter === "all" || p.category === filter);

  async function use(pack: TypePack) {
    if (openZine) {
      await db().zines.update(openZine.id, { typePackId: pack.id, updatedAt: new Date().toISOString() });
      // Make sure the editor reloads the zine with its new pack.
      useZine.setState({ zine: null });
      router.push(`/editor/${openZine.id}`);
    } else {
      const id = await saveNewZine(newZine({ packId: pack.id }));
      router.push(`/editor/${id}`);
    }
  }

  return (
    <main className="mx-auto max-w-content px-4 pb-24 sm:px-8">
      <section className="flex flex-col gap-4 pb-8 pt-12 sm:pt-16">
        <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">Type packs</h1>
        <p className="max-w-[56ch] text-[17px] text-muted">
          One loud title font, one quiet caption font, and the colours they were made for.
          {openZine ? ` “Use” applies a pack to ${openZine.title}.` : " “Use” starts a new zine with that pack."}
        </p>
        <div className="overflow-x-auto">
          <SegmentedControl label="Filter packs" value={filter} onChange={setFilter} options={PACK_CATEGORIES.map((c) => ({ ...c }))} />
        </div>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packs.map((p) => (
          <li key={p.id} className="flex flex-col gap-3 rounded-[12px] border border-line p-3">
            <PageSvg ops={renderSpecimen(p, "Hoi An")} w={320} h={200} label={`${p.name} sample: title Hoi An with a caption row`} className="rounded-[6px]" />
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <p className="font-medium">{p.name}</p>
                <p className="truncate text-[13px] text-muted">
                  {p.titleFont.family} · {p.captionFont.family}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {p.custom ? (
                  <button type="button" onClick={() => deleteCustomPack(p.id)} className="text-[13px] text-muted underline hover:text-fg">
                    Delete
                  </button>
                ) : null}
                <Button variant="secondary" onClick={() => use(p)} aria-label={`Use ${p.name}`}>
                  Use
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <MixYourOwn sampleTitle={openZine?.title} />
    </main>
  );
}

function MixYourOwn({ sampleTitle }: { sampleTitle?: string }) {
  const saveCustomPack = useZine((s) => s.saveCustomPack);
  const titleFonts = mixTitleFonts();
  const [name, setName] = useState("My pack");
  const [titleIdx, setTitleIdx] = useState(0);
  const [captionIdx, setCaptionIdx] = useState(0);
  const [bg, setBg] = useState("#F6D836");
  const [fg, setFg] = useState("#1E1A17");
  const [saved, setSaved] = useState(false);

  const titleFont = titleFonts[titleIdx];
  const category = BUILT_IN_PACKS.find((p) => p.titleFont.family === titleFont.family)?.category ?? "display";
  const pack: TypePack = {
    id: "mix-preview",
    name,
    category,
    titleFont,
    captionFont: MIX_CAPTION_FONTS[captionIdx],
    colors: { bg, fg },
    custom: true,
  };
  const title = sampleTitle || "Hoi An, March '26";
  const preview = useMemo(() => sampleZine({ packId: pack.id, title, paper: "A4" }), [pack.id, title]);
  const a7Size = coverTitleSizeAtA7(title, pack);

  async function save() {
    await saveCustomPack({ ...pack, id: `custom-${uid()}`, name: name.trim() || "My pack" });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <section className="mt-16 grid gap-8 rounded-[12px] border border-line p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]" aria-labelledby="mix">
      <div className="flex flex-col gap-5">
        <div>
          <h2 id="mix" className="text-[22px] font-semibold tracking-[-0.02em]">
            Mix your own
          </h2>
          <p className="text-muted">Pick a title font and a caption font, then save it as your own pack. It stays on this device.</p>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">Name</span>
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-muted">Title font</span>
            <select className={fieldClass} value={titleIdx} onChange={(e) => setTitleIdx(Number(e.target.value))}>
              {titleFonts.map((f, i) => (
                <option key={i} value={i}>
                  {f.family}
                  {f.style === "italic" ? " Italic" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[13px] text-muted">Caption font</span>
            <select className={fieldClass} value={captionIdx} onChange={(e) => setCaptionIdx(Number(e.target.value))}>
              {MIX_CAPTION_FONTS.map((f, i) => (
                <option key={f.family} value={i}>
                  {f.family}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2">
            <span className="text-[15px]">Background</span>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-12 cursor-pointer bg-transparent" />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-[10px] border border-line px-3 py-2">
            <span className="text-[15px]">Text</span>
            <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-8 w-12 cursor-pointer bg-transparent" />
          </label>
        </div>
        {a7Size < 14 ? (
          <p role="status" className="rounded-[10px] bg-surface p-3 text-[13px]">
            <span className="font-medium">Heads up:</span>{" "}
            <span className="text-muted">
              &ldquo;{title}&rdquo; would print at {a7Size.toFixed(1)}pt on an A7 cover, below 14pt. Try a shorter title, a narrower font,
              or print on A3.
            </span>
          </p>
        ) : (
          <p className="text-[13px] text-muted">Cover title at A7: {a7Size.toFixed(1)}pt. Reads fine.</p>
        )}
        <div className="flex items-center gap-3">
          <Button onClick={save}>Save pack</Button>
          {saved ? (
            <span role="status" className="text-[13px] text-muted">
              Saved. It&rsquo;s in the grid above.
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <SectionLabel as="p">Preview</SectionLabel>
        <ZinePage zine={preview} pack={pack} assets={SAMPLE_META} n={1} className="rounded-[4px] border border-line" label={`Cover preview in ${name}`} />
      </div>
    </section>
  );
}
