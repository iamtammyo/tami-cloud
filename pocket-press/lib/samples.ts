import sampleData from "@/data/samples.json";
import type { AssetMeta } from "./types";

// Built-in placeholder photos (public/samples). Their ids start with "sample:" and
// they're served as static files rather than stored in IndexedDB.

type Sample = AssetMeta & { file: string; place: string; date: string };
export const SAMPLES = sampleData as Sample[];
export const SAMPLE_META: Record<string, AssetMeta> = Object.fromEntries(SAMPLES.map((s) => [s.id, s]));

export function isSample(id: string) {
  return id.startsWith("sample:");
}

export function sampleUrl(id: string) {
  return SAMPLES.find((s) => s.id === id)?.file ?? "";
}

export function sample(name: string) {
  return SAMPLES.find((s) => s.name === name)!;
}
