import fontList from "@/data/fonts.json";
import metricsData from "@/data/fontMetrics.json";

export type FontDef = {
  id: string;
  family: string;
  weight: number;
  style: "normal" | "italic";
  file: string;
  roles: string[];
};

type RawMetrics = { chars: string; widths: number[]; ascent: number; descent: number; capHeight: number };

export const FONTS = fontList as FontDef[];
const FONT_BY_ID = new Map(FONTS.map((f) => [f.id, f]));
export const DEFAULT_FONT = "space-grotesk-700";

const METRICS = new Map<string, { widths: Map<string, number>; raw: RawMetrics }>();
for (const [id, raw] of Object.entries(metricsData as Record<string, RawMetrics>)) {
  const widths = new Map<string, number>();
  Array.from(raw.chars).forEach((c, i) => widths.set(c, raw.widths[i]));
  METRICS.set(id, { widths, raw });
}

function metrics(id: string) {
  return METRICS.get(id) ?? METRICS.get(DEFAULT_FONT)!;
}

export function fontDef(id: string): FontDef {
  return FONT_BY_ID.get(id) ?? FONT_BY_ID.get(DEFAULT_FONT)!;
}

/** Finds the registered font for a family/weight/style, falling back to the closest weight. */
export function resolveFont(family: string, weight = 400, style: "normal" | "italic" = "normal"): string {
  const same = FONTS.filter((f) => f.family.toLowerCase() === family.toLowerCase());
  if (!same.length) return DEFAULT_FONT;
  const ranked = [...same].sort(
    (a, b) =>
      Number(a.style !== style) - Number(b.style !== style) ||
      Math.abs(a.weight - weight) - Math.abs(b.weight - weight),
  );
  return ranked[0].id;
}

/**
 * Makes text drawable in a font: characters the font lacks lose their accents
 * if the base letter exists ("ộ" → "o"), otherwise they're dropped. Doing this
 * up front means the preview and the PDF never disagree about a missing glyph.
 */
export function normalizeForFont(id: string, text: string): string {
  const { widths } = metrics(id);
  let out = "";
  for (const ch of text.replace(/\s+/g, " ")) {
    if (widths.has(ch)) out += ch;
    else {
      const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (base && Array.from(base).every((c) => widths.has(c))) out += base;
      else if (ch === "’" && widths.has("'")) out += "'";
      else if ((ch === "–" || ch === "—") && widths.has("-")) out += "-";
    }
  }
  return out;
}

/** Advance width in points, with optional tracking in em. Text must already be normalised. */
export function measure(id: string, text: string, size: number, tracking = 0): number {
  const { widths } = metrics(id);
  let units = 0;
  for (const ch of text) units += widths.get(ch) ?? 500;
  const n = Array.from(text).length;
  return (units / 1000) * size + (n > 1 ? (n - 1) * tracking * size : 0);
}

export function capHeight(id: string, size: number) {
  return (metrics(id).raw.capHeight / 1000) * size;
}

export function ascent(id: string, size: number) {
  return (metrics(id).raw.ascent / 1000) * size;
}

export function descent(id: string, size: number) {
  return (-metrics(id).raw.descent / 1000) * size;
}

/** CSS family name used by the @font-face rules in app/zine-fonts.css. */
export function cssFamily(id: string) {
  return `pp-${fontDef(id).id}`;
}
