import packData from "@/data/typePacks.json";
import type { TypePack } from "./types";

// Type packs are data (data/typePacks.json): adding a pack is adding a row.

export const BUILT_IN_PACKS = packData as TypePack[];
export const DEFAULT_PACK_ID = "postcard";

export const PACK_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "script", label: "Script" },
  { value: "display", label: "Display" },
  { value: "serif", label: "Serif" },
  { value: "handwritten", label: "Handwritten" },
] as const;

export function findPack(id: string, custom: TypePack[] = []): TypePack {
  return (
    BUILT_IN_PACKS.find((p) => p.id === id) ??
    custom.find((p) => p.id === id) ??
    BUILT_IN_PACKS.find((p) => p.id === DEFAULT_PACK_ID)!
  );
}

/** Title fonts offered in "Mix your own": every title font a built-in pack uses. */
export function mixTitleFonts() {
  const seen = new Map<string, TypePack["titleFont"]>();
  for (const p of BUILT_IN_PACKS) {
    const key = `${p.titleFont.family}|${p.titleFont.weight}|${p.titleFont.style ?? ""}`;
    if (!seen.has(key)) seen.set(key, p.titleFont);
  }
  return [...seen.values()];
}

export const MIX_CAPTION_FONTS: TypePack["captionFont"][] = [
  { family: "Space Mono", weight: 700, size: 7 },
  { family: "Space Grotesk", weight: 700, size: 7 },
  { family: "Geist Mono", weight: 700, size: 7 },
];
