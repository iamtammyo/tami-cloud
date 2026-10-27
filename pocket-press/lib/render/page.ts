import { capHeight, descent, measure, normalizeForFont, resolveFont } from "../fonts";
import { layoutSpec, type TextBoxSpec } from "../layouts";
import { PT_PER_MM } from "../paper";
import type { AssetMeta, Page, TypePack } from "../types";
import { inkFor, isWhite, lightDark, mix } from "./color";
import type { DrawOp, RenderContext } from "./ops";
import { fitText, truncate } from "./text";

// The one Page renderer. It draws a page upright at any size, as draw ops.
// Editor canvas, thumbnails, sheet preview and PDF all call this.

export type PageInput = {
  page: Page;
  zineTitle: string;
  dateRange: string;
  pack: TypePack;
  assets: Record<string, AssetMeta>;
};

/** Pack sizes (title max, caption 7pt) are specified for an A6 page and scale from there. */
export const A6_WIDTH_PT = 105 * PT_PER_MM;
export const SAFE_OUTER_MM = 6;

export function pageNum(index: number) {
  return `[${String(index).padStart(2, "0")}]`;
}

export function pageBackground(page: Page, pack: TypePack) {
  return page.bgColor ?? (layoutSpec(page.layout).background === "pack" ? pack.colors.bg : "#FFFFFF");
}

export function renderPage(input: PageInput, ctx: RenderContext): DrawOp[] {
  const { page, pack, assets } = input;
  const { w, h } = ctx;
  const L = layoutSpec(page.layout);
  const k = w / A6_WIDTH_PT;
  const safe = SAFE_OUTER_MM * ctx.ptPerMm;
  const bg = pageBackground(page, pack);
  const ink = inkFor(bg, pack.colors);
  const coloured = !isWhite(bg);
  const titleFont = resolveFont(pack.titleFont.family, pack.titleFont.weight, pack.titleFont.style ?? "normal");
  const capFont = resolveFont(pack.captionFont.family, pack.captionFont.weight);
  const ops: DrawOp[] = [{ kind: "rect", x: 0, y: 0, w, h, fill: bg }];

  // Photo frames
  L.frames.forEach((f, i) => {
    const x = (f.x / 100) * w;
    const y = (f.y / 100) * h;
    const fw = (f.w / 100) * w;
    const fh = (f.h / 100) * h;
    const r = ((f.r ?? 3) / 100) * w;
    const fullBleed = f.w >= 100 && f.h >= 100;
    const outline = coloured && !fullBleed ? { stroke: ink, strokeWidth: 0.75 * k } : {};
    const photo = page.photos?.[i];
    const meta = photo ? assets[photo.assetId] : undefined;
    if (photo && meta) {
      ops.push({ kind: "image", assetId: meta.id, x, y, w: fw, h: fh, r, imgW: meta.width, imgH: meta.height, crop: photo.crop, ...outline });
    } else {
      ops.push({ kind: "rect", x, y, w: fw, h: fh, r, fill: mix(bg, ink, 0.12), ...outline });
    }
  });

  // Caption rows: [NN] + location on the left, date on the right.
  const capSize = pack.captionFont.size * k;
  for (const c of L.captions) {
    let x0 = (c.x / 100) * w;
    let x1 = ((c.x + c.w) / 100) * w;
    if (ctx.outer.left) x0 = Math.max(x0, safe);
    if (ctx.outer.right) x1 = Math.min(x1, w - safe);
    const cap = capHeight(capFont, capSize);
    let base = (c.y / 100) * h + cap;
    if (ctx.outer.bottom) base = Math.min(base, h - safe);
    if (ctx.outer.top) base = Math.max(base, safe + cap);

    let color = ink;
    if (c.onPhoto) {
      const meta = page.photos?.[0] ? assets[page.photos[0].assetId] : undefined;
      const band = c.y < 50 ? meta?.luma?.top : meta?.luma?.bottom;
      const { light, dark } = lightDark(pack.colors);
      color = band === undefined ? ink : band > 0.55 ? dark : light;
    }

    const num = normalizeForFont(capFont, pageNum(page.index));
    const numW = measure(capFont, num, capSize);
    ops.push({ kind: "text", x: x0, y: base, text: num, size: capSize, font: capFont, color, anchor: "start", width: numW });

    const date = normalizeForFont(capFont, page.caption?.date ?? "");
    const dateW = measure(capFont, date, capSize);
    if (date) ops.push({ kind: "text", x: x1, y: base, text: date, size: capSize, font: capFont, color, anchor: "end", width: dateW });

    const locX = x0 + Math.max(numW + capSize * 1.6, (x1 - x0) * 0.16);
    const room = x1 - (date ? dateW + capSize * 1.6 : 0) - locX;
    const loc = page.caption?.location ? truncate(capFont, normalizeForFont(capFont, page.caption.location), capSize, room) : "";
    if (loc && room > 0)
      ops.push({ kind: "text", x: locX, y: base, text: loc, size: capSize, font: capFont, color, anchor: "start", width: measure(capFont, loc, capSize) });
  }

  // Title (cover, back)
  if (L.title) {
    ops.push(...textBlock(input.zineTitle, L.title, { font: titleFont, pack, ink, w, h, k }));
  }

  // Note body
  if (L.body && page.body) {
    const box = { x: L.body.x, y: L.body.y, w: L.body.w, h: L.body.h, align: "left" as const, valign: "top" as const, maxLines: 14, uppercase: L.body.uppercase, fill: true };
    ops.push(...textBlock(page.body, box, { font: titleFont, pack, ink, w, h, k, noRotate: true, maxScale: 0.62 }));
  }

  // Back page extras
  if (L.dateRange && input.dateRange) {
    const t = normalizeForFont(capFont, input.dateRange);
    const size = capSize * 1.15;
    ops.push({ kind: "text", x: w / 2, y: (L.dateRange.y / 100) * h, text: t, size, font: capFont, color: ink, anchor: "middle", width: measure(capFont, t, size) });
  }
  if (L.madeWith) {
    const t = normalizeForFont(capFont, "made with pocket press");
    const size = capSize * 0.85;
    let y = (L.madeWith.y / 100) * h;
    if (ctx.outer.bottom) y = Math.min(y, h - safe);
    ops.push({ kind: "text", x: w / 2, y, text: t, size, font: capFont, color: ink, anchor: "middle", width: measure(capFont, t, size) });
  }

  return ops;
}

function textBlock(
  raw: string,
  T: TextBoxSpec,
  o: { font: string; pack: TypePack; ink: string; w: number; h: number; k: number; noRotate?: boolean; maxScale?: number },
): DrawOp[] {
  if (!raw.trim()) return [];
  const tf = o.pack.titleFont;
  const box = { x: (T.x / 100) * o.w, y: (T.y / 100) * o.h, w: (T.w / 100) * o.w, h: (T.h / 100) * o.h };
  // "fill" boxes grow the text as large as the box allows (type cover, note page).
  const maxSize = T.fill ? box.h * (o.maxScale ?? 0.45) : tf.size * o.k * (T.scale ?? 1);
  const fit = fitText(o.font, raw, box, {
    maxSize,
    minSize: 6 * o.k,
    maxLines: T.maxLines,
    leading: tf.leading,
    tracking: tf.tracking,
    // Script capitals are unreadable as a block, so script packs keep normal case.
    uppercase: T.uppercase && o.pack.category !== "script",
  });
  const n = fit.lines.length;
  const cap = capHeight(o.font, fit.size);
  const blockH = (n - 1) * fit.lineHeight + cap;
  let first: number;
  if (T.valign === "top") first = box.y + cap;
  else if (T.valign === "middle") first = box.y + (box.h - blockH) / 2 + cap;
  else first = box.y + box.h - descent(o.font, fit.size) * 0.5 - (n - 1) * fit.lineHeight;

  const center = T.align === "center";
  return fit.lines.map((line, i) => ({
    kind: "text" as const,
    x: center ? box.x + box.w / 2 : box.x,
    y: first + i * fit.lineHeight,
    text: line,
    size: fit.size,
    font: o.font,
    color: o.ink,
    anchor: center ? ("middle" as const) : ("start" as const),
    width: fit.widths[i],
    tracking: tf.tracking,
    rotate: o.noRotate ? undefined : tf.rotate,
  }));
}

/** Readability check for "Mix your own": the cover title size on an A7 page. */
export function coverTitleSizeAtA7(title: string, pack: TypePack): number {
  const w = 74.25 * PT_PER_MM;
  const h = 105 * PT_PER_MM;
  const T = layoutSpec("cover").title!;
  const font = resolveFont(pack.titleFont.family, pack.titleFont.weight, pack.titleFont.style ?? "normal");
  const fit = fitText(font, title, { w: (T.w / 100) * w, h: (T.h / 100) * h }, {
    maxSize: pack.titleFont.size * (w / A6_WIDTH_PT),
    minSize: 4,
    maxLines: T.maxLines,
    leading: pack.titleFont.leading,
    tracking: pack.titleFont.tracking,
  });
  return fit.size;
}
