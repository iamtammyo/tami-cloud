import lookData from "@/data/looks.json";
import type { LayoutId } from "./types";

export type Look = { id: string; name: string; packId: string; coverLayout: LayoutId };
export const LOOKS = lookData as Look[];
