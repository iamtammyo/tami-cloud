import { describe, expect, it } from "vitest";
import { FOLDS } from "@/lib/folds";
import { measure, normalizeForFont } from "@/lib/fonts";
import { outerEdges, sheetGeometry, slotForPage } from "@/lib/imposition";
import { LAYOUTS } from "@/lib/layouts";
import { BUILT_IN_PACKS, findPack } from "@/lib/packs";
import { PAPERS, PT_PER_MM } from "@/lib/paper";
import { formatBigDataCloud, formatNominatim, roundKey } from "@/lib/placeFormat";
import { contrast, inkFor } from "@/lib/render/color";
import { coverPlacement, type DrawOp } from "@/lib/render/ops";
import { renderPage } from "@/lib/render/page";
import { fitText } from "@/lib/render/text";
import { SAMPLE_META } from "@/lib/samples";
import type { Page } from "@/lib/types";
import { applyAutoCaptions, dateRange, movePage, newZine, sampleZine, withLayout } from "@/lib/zine";

const fold = FOLDS.mini8;
const g = sheetGeometry(fold, PAPERS.A4);
const ctxFor = (n: number) => ({ w: g.panelW, h: g.panelH, ptPerMm: PT_PER_MM, outer: outerEdges(slotForPage(fold, n), fold) });
const pack = findPack("postcard");
const render = (page: Page, n = page.index) =>
  renderPage({ page, zineTitle: "Hoi An, March '26", dateRange: "", pack, assets: SAMPLE_META }, ctxFor(n));
const texts = (ops: DrawOp[]) => ops.filter((o): o is Extract<DrawOp, { kind: "text" }> => o.kind === "text");

describe("layouts", () => {
  it("draws photo frames at the layout percentages", () => {
    const z = sampleZine();
    for (const page of z.pages) {
      const frames = render(page).filter((o) => o.kind === "image" || (o.kind === "rect" && o.r !== undefined));
      LAYOUTS[page.layout].frames.forEach((f, i) => {
        expect(frames[i]).toMatchObject({ x: expect.closeTo((f.x / 100) * g.panelW, 3), w: expect.closeTo((f.w / 100) * g.panelW, 3) });
        expect((frames[i] as { y: number }).y).toBeCloseTo((f.y / 100) * g.panelH, 3);
      });
    }
  });

  it("matches the approved cover and trio numbers", () => {
    expect(LAYOUTS.cover.frames[0]).toEqual({ x: 5, y: 23, w: 90, h: 70 });
    expect(LAYOUTS.trio.frames.map((f) => f.y)).toEqual([8, 37, 66]);
    expect(LAYOUTS.land_top.frames[0]).toEqual({ x: 7, y: 10, w: 86, h: 44 });
  });

  it("outlines frames only on coloured pages", () => {
    const z = sampleZine();
    const cover = render(z.pages[0]).find((o) => o.kind === "image")!;
    const photoPage = render(z.pages[1]).find((o) => o.kind === "image")!;
    expect(cover).toHaveProperty("stroke");
    expect(photoPage).not.toHaveProperty("stroke");
  });

  it("numbers captions from the page index and keeps them 6mm off the sheet edge", () => {
    const z = sampleZine();
    for (const n of [2, 3, 4, 5]) {
      const t = texts(render(z.pages[n - 1]));
      expect(t[0].text).toBe(`[0${n}]`);
      for (const op of t) expect(op.y).toBeLessThanOrEqual(g.panelH - 6 * PT_PER_MM + 0.01);
    }
  });

  it("keeps a caption's number in step when pages move", () => {
    const z = sampleZine();
    const moved = movePage(z.pages, 2, 4);
    expect(moved[4].layout).toBe(z.pages[2].layout);
    expect(texts(render(moved[4]))[0].text).toBe("[05]");
  });
});

describe("zine model", () => {
  it("starts with the default layouts, trio on page 6", () => {
    expect(newZine().pages.map((p) => p.layout)).toEqual(["cover", "land_top", "portrait", "full", "land_low", "trio", "note", "back"]);
  });

  it("never moves the cover or the back", () => {
    const pages = newZine().pages;
    expect(movePage(pages, 0, 3)).toBe(pages);
    expect(movePage(pages, 3, 7)).toBe(pages);
  });

  it("keeps placed photos when switching layouts", () => {
    const z = sampleZine();
    const trio = z.pages[5];
    expect(withLayout(trio, "portrait").photos).toHaveLength(1);
    expect(withLayout(withLayout(trio, "portrait"), "trio").photos?.[0]?.assetId).toBe(trio.photos?.[0]?.assetId);
  });

  it("fills auto captions from photo metadata and leaves edited ones alone", () => {
    const z = newZine();
    z.pages[1].photos = [{ assetId: "a", crop: { x: 0.5, y: 0.5, scale: 1 } }];
    z.pages[2].photos = [{ assetId: "b", crop: { x: 0.5, y: 0.5, scale: 1 } }];
    z.pages[2].caption = { num: "", location: "Mine", date: "", auto: false };
    const assets = {
      a: { id: "a", width: 10, height: 10, place: "Minh An, Hoi An", takenAt: new Date(2026, 2, 15, 12).toISOString() },
      b: { id: "b", width: 10, height: 10, place: "Elsewhere" },
    };
    const out = applyAutoCaptions(z, assets);
    expect(out.pages[1].caption).toMatchObject({ location: "Minh An, Hoi An", date: "15.03.26", auto: true });
    expect(out.pages[2].caption?.location).toBe("Mine");
  });

  it("handles a photo with no metadata: empty, editable caption", () => {
    const z = newZine();
    z.pages[1].photos = [{ assetId: "x", crop: { x: 0.5, y: 0.5, scale: 1 } }];
    const out = applyAutoCaptions(z, { x: { id: "x", width: 10, height: 10 } });
    expect(out.pages[1].caption).toMatchObject({ location: "", date: "" });
    expect(() => render(out.pages[1])).not.toThrow();
  });

  it("builds the back-page date range", () => {
    expect(dateRange(sampleZine())).toBe("15.03.26 – 19.03.26");
  });
});

describe("text and images", () => {
  it("shrinks long titles to fit the box", () => {
    const fit = fitText("archivo-black", "A very long title for a tiny zine cover", { w: 150, h: 60 }, { maxSize: 40, minSize: 6, maxLines: 2, leading: 1 });
    expect(fit.lines.length).toBeLessThanOrEqual(2);
    for (const w of fit.widths) expect(w).toBeLessThanOrEqual(150);
  });

  it("drops accents a font can't draw, keeps them where it can", () => {
    expect(normalizeForFont("bagel-fat-one", "Hội An")).toBe("Hoi An");
    expect(normalizeForFont("space-mono-700", "Hội An")).toBe("Hội An");
    expect(measure("space-mono-700", "ab", 10)).toBeCloseTo(2 * measure("space-mono-700", "a", 10), 5);
  });

  it("cover-fits and pans photos inside the frame", () => {
    const frame = { x: 0, y: 0, w: 100, h: 100 };
    const centred = coverPlacement(200, 100, frame, { x: 0.5, y: 0.5, scale: 1 });
    expect(centred.draw).toEqual({ x: -50, y: 0, w: 200, h: 100 });
    expect(coverPlacement(200, 100, frame, { x: 0, y: 0.5, scale: 1 }).draw.x).toBe(0);
    expect(coverPlacement(200, 100, frame, { x: 0.5, y: 0.5, scale: 2 }).draw.w).toBe(400);
  });

  it("every pack's text colour reads on its own background", () => {
    for (const p of BUILT_IN_PACKS) expect(contrast(inkFor(p.colors.bg, p.colors), p.colors.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("place names", () => {
  it("formats Nominatim as neighbourhood, city", () => {
    expect(formatNominatim({ address: { quarter: "Minh An", city: "Hoi An" } })).toBe("Minh An, Hoi An");
    expect(formatNominatim({ address: { town: "Sintra" } })).toBe("Sintra");
    expect(formatNominatim({})).toBe("");
  });

  it("formats BigDataCloud the same way", () => {
    expect(formatBigDataCloud({ locality: "Jordaan", city: "Amsterdam" })).toBe("Jordaan, Amsterdam");
    expect(formatBigDataCloud({ locality: "Lisbon", city: "Lisbon" })).toBe("Lisbon");
  });

  it("caches by coordinates rounded to 3 decimals", () => {
    expect(roundKey(15.880111, 108.33801)).toBe("15.880,108.338");
  });
});
