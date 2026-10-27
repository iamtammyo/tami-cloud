import layoutData from "@/data/layouts.json";
import type { LayoutId } from "./types";

// Layouts are data (data/layouts.json). Units are % of the page, so one layout
// works on A6, A7 and Letter panels alike.

export type FrameSpec = { x: number; y: number; w: number; h: number; r?: number };
export type CaptionSpec = { x: number; w: number; y: number; onPhoto?: boolean };
export type TextBoxSpec = {
  x: number;
  y: number;
  w: number;
  h: number;
  align: "left" | "center";
  valign: "top" | "middle" | "bottom";
  maxLines: number;
  scale?: number;
  uppercase?: boolean;
  fill?: boolean;
};

export type LayoutSpec = {
  name: string;
  background: "white" | "pack";
  pickable: boolean;
  frames: FrameSpec[];
  captions: CaptionSpec[];
  title?: TextBoxSpec;
  body?: Omit<TextBoxSpec, "align" | "valign" | "maxLines"> & { uppercase?: boolean };
  dateRange?: { y: number };
  madeWith?: { y: number };
};

const { _units, ...layouts } = layoutData as Record<string, unknown>;
void _units;

export const LAYOUTS = layouts as Record<LayoutId, LayoutSpec>;
export const LAYOUT_IDS = Object.keys(LAYOUTS) as LayoutId[];
/** Layouts offered in the editor's layout picker (photo pages). */
export const PICKABLE_LAYOUTS = LAYOUT_IDS.filter((id) => LAYOUTS[id].pickable);
export const COVER_LAYOUTS: LayoutId[] = ["cover", "cover_solid", "cover_type"];

export function layoutSpec(id: LayoutId): LayoutSpec {
  return LAYOUTS[id] ?? LAYOUTS.land_top;
}

export function frameCount(id: LayoutId) {
  return layoutSpec(id).frames.length;
}
