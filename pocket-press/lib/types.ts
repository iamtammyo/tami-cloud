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
  autoCaptions: boolean;
  print: { cutLine: boolean; foldGuides: boolean; copies: number };
  createdAt: string;
  updatedAt: string;
};

export type LayoutId =
  | "cover"
  | "cover_solid"
  | "cover_type"
  | "land_top"
  | "land_low"
  | "portrait"
  | "full"
  | "trio"
  | "note"
  | "back";

export type PagePhoto = {
  assetId: string;
  /** Pan as 0–1 across the overflow (0.5 = centred), zoom as a multiple of cover-fit (>= 1). */
  crop: { x: number; y: number; scale: number };
};

export type Caption = {
  num: string; // "[02]"; the renderer always derives it from the page index
  location: string;
  date: string; // DD.MM.YY
  auto: boolean; // false once the user edits it
};

export type Page = {
  index: number; // 1-8, reading order
  layout: LayoutId;
  bgColor?: string;
  /** One entry per photo frame in the layout. */
  photos?: (PagePhoto | null)[];
  title?: string;
  body?: string;
  caption?: Caption;
};

/** Everything about a photo except its pixels. Safe to pass around and render from. */
export type AssetMeta = {
  id: string;
  width: number;
  height: number;
  takenAt?: string;
  gps?: { lat: number; lng: number };
  place?: string;
  /** Average luminance (0–1) of the top and bottom bands, for caption contrast on full-bleed pages. */
  luma?: { top: number; bottom: number };
  name?: string;
  createdAt?: string;
};

export type Asset = AssetMeta & {
  zineId: string; // each zine has its own camera roll
  blob: Blob; // downscaled original, long edge 3000px
  thumb: Blob; // long edge 400px
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
