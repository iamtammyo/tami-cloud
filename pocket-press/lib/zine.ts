import { frameCount, layoutSpec } from "./layouts";
import { DEFAULT_PACK_ID } from "./packs";
import { sample } from "./samples";
import type { AssetMeta, Caption, LayoutId, Page, PagePhoto, PaperId, Zine } from "./types";

export const DEFAULT_LAYOUTS: LayoutId[] = ["cover", "land_top", "portrait", "full", "land_low", "trio", "note", "back"];
export const DEFAULT_CROP = { x: 0.5, y: 0.5, scale: 1 };

export function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newZine(o: { title?: string; packId?: string; coverLayout?: LayoutId; paper?: PaperId } = {}): Zine {
  const now = new Date().toISOString();
  return {
    id: uid(),
    title: o.title ?? "Untitled zine",
    fold: "mini8",
    paper: o.paper ?? "A4",
    typePackId: o.packId ?? DEFAULT_PACK_ID,
    autoCaptions: true,
    print: { cutLine: true, foldGuides: false, copies: 1 },
    pages: DEFAULT_LAYOUTS.map((layout, i) => ({
      index: i + 1,
      layout: i === 0 && o.coverLayout ? o.coverLayout : layout,
      photos: Array(frameCount(i === 0 && o.coverLayout ? o.coverLayout : layout)).fill(null),
    })),
    createdAt: now,
    updatedAt: now,
  };
}

/** Changes a page's layout, keeping as many placed photos as the new layout has frames. */
export function withLayout(page: Page, layout: LayoutId): Page {
  const n = frameCount(layout);
  const photos = [...(page.photos ?? [])].filter(Boolean) as PagePhoto[];
  return { ...page, layout, photos: Array.from({ length: n }, (_, i) => photos[i] ?? null) };
}

/** Moves the page at `from` to `to` (0-based positions) and renumbers. Cover and back stay put. */
export function movePage(pages: Page[], from: number, to: number): Page[] {
  const last = pages.length - 1;
  if (from <= 0 || from >= last || to <= 0 || to >= last || from === to) return pages;
  const next = [...pages];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next.map((p, i) => ({ ...p, index: i + 1 }));
}

export function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${String(d.getFullYear()).slice(-2)}`;
}

/** Parses DD.MM.YY into a sortable number (YYMMDD), or null. */
function dateKey(s: string) {
  const m = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(s.trim());
  return m ? Number(m[3] + m[2] + m[1]) : null;
}

/** "15.03.26 – 19.03.26" from the captions, for the back page. */
export function dateRange(zine: Pick<Zine, "pages">): string {
  const dates = zine.pages
    .map((p) => p.caption?.date ?? "")
    .filter((d) => dateKey(d) !== null)
    .sort((a, b) => dateKey(a)! - dateKey(b)!);
  if (!dates.length) return "";
  const [first, last] = [dates[0], dates[dates.length - 1]];
  return first === last ? first : `${first} – ${last}`;
}

export function captionFromAsset(meta?: AssetMeta): Pick<Caption, "location" | "date"> {
  return {
    location: meta?.place ?? "",
    date: meta?.takenAt ? formatDate(new Date(meta.takenAt)) : "",
  };
}

/** Re-fills auto captions from each page's first photo. User-edited captions are left alone. */
export function applyAutoCaptions(zine: Zine, assets: Record<string, AssetMeta>): Zine {
  if (!zine.autoCaptions) return zine;
  const pages = zine.pages.map((p) => {
    if (!layoutSpec(p.layout).captions.length) return p;
    if (p.caption && !p.caption.auto) return p;
    const first = p.photos?.find(Boolean);
    const meta = first ? assets[first.assetId] : undefined;
    const { location, date } = captionFromAsset(meta);
    if (p.caption?.location === location && p.caption?.date === date) return p;
    return { ...p, caption: { num: "", location, date, auto: true } };
  });
  return { ...zine, pages };
}

const SAMPLE_PLAN: { layout: LayoutId; photos: string[] }[] = [
  { layout: "cover", photos: ["lanterns"] },
  { layout: "land_top", photos: ["hills"] },
  { layout: "portrait", photos: ["facades"] },
  { layout: "full", photos: ["trees"] },
  { layout: "land_low", photos: ["river"] },
  { layout: "trio", photos: ["market", "beach", "stools"] },
  { layout: "note", photos: [] },
  { layout: "back", photos: [] },
];

/** A filled-in zine using the built-in sample photos. Used by the demo and look previews. */
export function sampleZine(o: { packId?: string; coverLayout?: LayoutId; title?: string; paper?: PaperId } = {}): Zine {
  const z = newZine({ ...o, title: o.title ?? "Hoi An, March '26" });
  z.pages = SAMPLE_PLAN.map((plan, i) => {
    const layout = i === 0 && o.coverLayout ? o.coverLayout : plan.layout;
    const n = frameCount(layout);
    const photos = Array.from({ length: n }, (_, j) => (plan.photos[j] ? { assetId: sample(plan.photos[j]).id, crop: { ...DEFAULT_CROP } } : null));
    const first = plan.photos[0] ? sample(plan.photos[0]) : undefined;
    const page: Page = { index: i + 1, layout, photos };
    if (first) page.caption = { num: "", location: first.place, date: first.date, auto: true };
    if (layout === "note") {
      page.body = "The lanterns came on at six and the whole river went orange. Best night of the trip.";
      page.caption = { num: "", location: "Minh An, Hoi An", date: "19.03.26", auto: false };
    }
    return page;
  });
  return z;
}
