import type { AssetMeta } from "./types";
import { formatDate } from "./zine";

export type RollGroup = { key: string; label: string; ids: string[] };

/** Groups the camera roll by place, falling back to the day it was taken. */
export function groupRoll(assets: AssetMeta[]): RollGroup[] {
  const groups = new Map<string, RollGroup>();
  for (const a of assets) {
    const label = a.place || (a.takenAt ? formatDate(new Date(a.takenAt)) : "No date");
    const key = a.place ? `place:${a.place}` : a.takenAt ? `date:${label}` : "none";
    if (!groups.has(key)) groups.set(key, { key, label, ids: [] });
    groups.get(key)!.ids.push(a.id);
  }
  return [...groups.values()];
}
