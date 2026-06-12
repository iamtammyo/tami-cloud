export type GrowthStage = "seedling" | "budding" | "evergreen";

export interface GardenNote {
  id: string;
  title: string;
  body: string;
  topics: string[];
  stage: GrowthStage;
  plantedAt: string; // ISO timestamp
  tendedAt: string; // ISO timestamp — bumped on every edit
}

export const STAGE_ORDER: GrowthStage[] = ["seedling", "budding", "evergreen"];

export const STAGE_META: Record<
  GrowthStage,
  { glyph: string; label: string; hint: string }
> = {
  seedling: {
    glyph: "✧",
    label: "Seedling",
    hint: "a fresh thought, barely rooted",
  },
  budding: {
    glyph: "❀",
    label: "Budding",
    hint: "taking shape, still tender",
  },
  evergreen: {
    glyph: "❦",
    label: "Evergreen",
    hint: "settled and pruned, worth returning to",
  },
};
