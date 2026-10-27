import { capHeight, measure, normalizeForFont, resolveFont } from "../fonts";
import type { TypePack } from "../types";
import type { DrawOp } from "./ops";
import { fitText } from "./text";

/** A type-pack card: sample title and caption row in the pack's fonts and colours. */
export function renderSpecimen(pack: TypePack, title: string, w = 320, h = 200): DrawOp[] {
  const tf = resolveFont(pack.titleFont.family, pack.titleFont.weight, pack.titleFont.style ?? "normal");
  const cf = resolveFont(pack.captionFont.family, pack.captionFont.weight);
  const pad = w * 0.07;
  const fit = fitText(tf, title, { w: w - pad * 2, h: h * 0.5 }, { maxSize: h * 0.36, minSize: 10, maxLines: 2, leading: pack.titleFont.leading, tracking: pack.titleFont.tracking });
  const cap = capHeight(tf, fit.size);
  const ops: DrawOp[] = [{ kind: "rect", x: 0, y: 0, w, h, fill: pack.colors.bg }];
  fit.lines.forEach((line, i) =>
    ops.push({
      kind: "text",
      x: pad,
      y: h * 0.18 + cap + i * fit.lineHeight,
      text: line,
      size: fit.size,
      font: tf,
      color: pack.colors.fg,
      anchor: "start",
      width: fit.widths[i],
      tracking: pack.titleFont.tracking,
      rotate: pack.titleFont.rotate,
    }),
  );
  const size = 11;
  const y = h - pad;
  const items: [string, number, "start" | "end"][] = [
    ["[01]", pad, "start"],
    ["Minh An, Hoi An", pad + w * 0.18, "start"],
    ["15.03.26", w - pad, "end"],
  ];
  for (const [raw, x, anchor] of items) {
    const text = normalizeForFont(cf, raw);
    ops.push({ kind: "text", x, y, text, size, font: cf, color: pack.colors.fg, anchor, width: measure(cf, text, size) });
  }
  return ops;
}
