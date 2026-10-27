import { measure, normalizeForFont } from "../fonts";

export type FitResult = { size: number; lines: string[]; widths: number[]; lineHeight: number };

/** Greedy word wrap at a given size. Words longer than the line are kept whole (the fitter shrinks instead). */
export function wrap(font: string, text: string, size: number, maxWidth: number, tracking = 0): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(" ").filter(Boolean);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (!line || measure(font, next, size, tracking) <= maxWidth) line = next;
      else {
        lines.push(line);
        line = word;
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Largest size (≤ maxSize) at which the text fits the box in at most maxLines,
 * stepping down in 0.5pt increments. Below minSize it stops shrinking and the
 * caller gets the minimum, even if it overflows.
 */
export function fitText(
  font: string,
  raw: string,
  box: { w: number; h: number },
  o: { maxSize: number; minSize: number; maxLines: number; leading: number; tracking?: number; uppercase?: boolean },
): FitResult {
  const text = normalizeForFont(font, o.uppercase ? raw.toUpperCase() : raw).trim();
  const tracking = o.tracking ?? 0;
  let size = o.maxSize;
  for (; size > o.minSize; size -= 0.5) {
    const lines = wrap(font, text, size, box.w, tracking);
    const lineHeight = size * o.leading;
    const widest = Math.max(...lines.map((l) => measure(font, l, size, tracking)));
    if (lines.length <= o.maxLines && widest <= box.w && lines.length * lineHeight <= box.h) {
      return { size, lines, widths: lines.map((l) => measure(font, l, size, tracking)), lineHeight };
    }
  }
  size = o.minSize;
  const lines = wrap(font, text, size, box.w, tracking).slice(0, o.maxLines);
  return { size, lines, widths: lines.map((l) => measure(font, l, size, tracking)), lineHeight: size * o.leading };
}

/** Shortens a single line with an ellipsis until it fits. */
export function truncate(font: string, text: string, size: number, maxWidth: number): string {
  if (measure(font, text, size) <= maxWidth) return text;
  const ell = measure(font, "…", size) > 0 ? "…" : "...";
  let t = text;
  while (t.length > 1 && measure(font, t + ell, size) > maxWidth) t = t.slice(0, -1);
  return t.trimEnd() + ell;
}
