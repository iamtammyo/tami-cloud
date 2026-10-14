// Checks the text/background pairs the design actually uses against WCAG 2.2 AA.
// Run with: npm run contrast
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const t = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]));

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [text, background, minimum, where it is used]
const pairs = [
  ['ink', 'cream', 4.5, 'body text'],
  ['muted', 'cream', 4.5, 'secondary text'],
  ['muted', 'sand', 4.5, 'placeholder labels'],
  ['blue', 'cream', 4.5, 'eyebrows, links'],
  ['rust', 'cream', 4.5, 'photography links and meta'],
  ['wine', 'cream', 4.5, 'partnership eyebrows'],
  ['paper', 'ink', 4.5, 'home left panel'],
  ['ink', 'periwinkle', 4.5, 'home card text'],
  ['ink', 'periwinkle-deep', 4.5, 'band text'],
  ['paper', 'periwinkle-deep', 3, 'script words on bands (large)'],
  ['ink', 'terracotta', 4.5, 'photography hero text'],
  ['cream', 'terracotta', 3, 'script word on terracotta (large)'],
  ['cream', 'wine', 4.5, 'text on wine'],
  ['sky', 'wine', 4.5, 'eyebrows on wine'],
  ['cream', 'wine-soft', 4.5, 'labels on wine-soft'],
];

let failed = false;
for (const [fg, bg, min, use] of pairs) {
  const r = ratio(t[fg], t[bg]);
  if (r < min) failed = true;
  console.log(`${r >= min ? 'pass' : 'FAIL'}  ${fg} on ${bg}: ${r.toFixed(2)}:1 (needs ${min}) ${use}`);
}
process.exit(failed ? 1 : 0);
