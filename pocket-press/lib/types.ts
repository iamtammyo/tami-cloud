// Data model from BRIEF.md. Small and serialisable: everything lives in the browser.

export type FoldId = "mini8"; // later: 'accordion16' | 'pocket' | 'booklet'
export type PaperId = "A3" | "A4" | "LETTER";

export type Zine = {
  id: string;
  title: string;
  fold: FoldId;
  paper: PaperId;
  typePackId: string;
  pages: Page[]; // always 8 for mini8, index 0 = page 1
  createdAt: string;
  updatedAt: string;
};

export type LayoutId = "cover" | "land_top" | "land_low" | "portrait" | "full" | "note" | "back";

export type Page = {
  index: number; // 1-8, reading order
  layout: LayoutId;
  bgColor?: string;
  photo?: {
    assetId: string;
    crop: { x: number; y: number; scale: number };
  };
  title?: string;
  body?: string;
  caption?: {
    num: string;
    location: string;
    date: string;
    auto: boolean;
  };
};

export type Asset = {
  id: string;
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
  takenAt?: string;
  gps?: { lat: number; lng: number };
  place?: string;
};

export type TypePack = {
  id: string;
  name: string;
  category: "script" | "display" | "serif" | "handwritten";
  titleFont: {
    family: string;
    weight: number;
    style?: "italic";
    size: number;
    leading: number;
    tracking?: number;
    rotate?: number;
  };
  captionFont: { family: string; weight: number; size: number };
  colors: { bg: string; fg: string; accent?: string };
  custom?: boolean;
};
