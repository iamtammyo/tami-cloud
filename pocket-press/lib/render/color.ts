// Colour helpers for picking readable ink on any page or photo.

export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function mix(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return (
    "#" +
    ca
      .map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function isWhite(hex: string) {
  return luminance(hex) > 0.98;
}

/** Ink for text on a background: the pack's text colour if it reads, otherwise the most readable option. */
export function inkFor(bg: string, pack: { bg: string; fg: string }): string {
  if (contrast(pack.fg, bg) >= 4.5) return pack.fg;
  const options = [pack.fg, pack.bg, "#1E1A17", "#FFFFFF"];
  return options.reduce((best, c) => (contrast(c, bg) > contrast(best, bg) ? c : best), options[0]);
}

/** The pack's lighter and darker colour, for captions on top of photos. */
export function lightDark(pack: { bg: string; fg: string }) {
  const [light, dark] = luminance(pack.bg) >= luminance(pack.fg) ? [pack.bg, pack.fg] : [pack.fg, pack.bg];
  if (contrast(light, dark) < 3) return { light: "#FFFFFF", dark: "#1E1A17" };
  return { light, dark };
}
