// Checks every text colour token in src/styles/tokens.css against --color-bg
// for WCAG 2.2 AA. Run with: npm run contrast
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const root = css.slice(0, css.indexOf('}'));
const tokens = Object.fromEntries(
  [...root.matchAll(/--(color-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]])
);

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

// Minimum ratio each token must hit, by what it is used for.
const rules = {
  'color-text': 4.5,
  'color-text-muted': 4.5,
  'color-accent': 4.5, // links and body-size emphasis
  'color-accent-muted': 3, // large text and UI only
  'color-warm': 3, // large text and UI only
  'color-focus': 3, // focus ring (non-text contrast)
};

const bg = tokens['color-bg'];
let failed = false;
for (const [name, min] of Object.entries(rules)) {
  if (!tokens[name]) continue;
  const r = ratio(tokens[name], bg);
  const ok = r >= min;
  if (!ok) failed = true;
  console.log(`${ok ? 'pass' : 'FAIL'}  --${name} ${tokens[name]} on ${bg}: ${r.toFixed(2)}:1 (needs ${min}:1)`);
}
process.exit(failed ? 1 : 0);
