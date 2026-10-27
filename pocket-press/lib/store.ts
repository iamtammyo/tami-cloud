"use client";

import { create } from "zustand";
import { db } from "./db";
import { placeFor } from "./geocode";
import { frameCount } from "./layouts";
import { findPack } from "./packs";
import { importPhoto } from "./photos";
import { SAMPLE_META, isSample, sampleUrl } from "./samples";
import type { AssetMeta, Caption, LayoutId, PagePhoto, PaperId, TypePack, Zine } from "./types";
import { DEFAULT_CROP, applyAutoCaptions, movePage, withLayout } from "./zine";

// The open zine. Every change saves itself to IndexedDB (debounced).

type Urls = Record<string, { full: string; thumb: string }>;

type State = {
  zine: Zine | null;
  loading: boolean;
  missing: boolean;
  assets: Record<string, AssetMeta>;
  urls: Urls;
  rollIds: string[];
  customPacks: TypePack[];
  selected: { page: number; frame: number };
  importing: { done: number; total: number } | null;

  loadPacks: () => Promise<void>;
  openZine: (id: string) => Promise<void>;
  update: (fn: (z: Zine) => Zine) => void;
  flush: () => Promise<void>;
  select: (page: number, frame?: number) => void;
  setTitle: (title: string) => void;
  setPaper: (paper: PaperId) => void;
  setPack: (packId: string) => void;
  setPrint: (p: Partial<Zine["print"]>) => void;
  setAutoCaptions: (on: boolean) => void;
  setLayout: (page: number, layout: LayoutId) => void;
  placePhoto: (page: number, frame: number, assetId: string) => void;
  clearPhoto: (page: number, frame: number) => void;
  setCrop: (page: number, frame: number, crop: PagePhoto["crop"]) => void;
  setCaption: (page: number, c: Partial<Caption>) => void;
  resetCaption: (page: number) => void;
  setBg: (page: number, color: string | undefined) => void;
  setBody: (page: number, body: string) => void;
  movePage: (from: number, to: number) => void;
  importFiles: (files: File[]) => Promise<void>;
  removeAsset: (id: string) => Promise<void>;
  saveCustomPack: (pack: TypePack) => Promise<void>;
  deleteCustomPack: (id: string) => Promise<void>;
};

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function urlsFor(id: string, urls: Urls) {
  return urls[id] ?? (isSample(id) ? { full: sampleUrl(id), thumb: sampleUrl(id) } : undefined);
}

export function assetUrl(id: string, variant: "full" | "thumb") {
  return urlsFor(id, useZine.getState().urls)?.[variant];
}

function pagePatch(z: Zine, i: number, fn: (p: Zine["pages"][number]) => Zine["pages"][number]): Zine {
  return { ...z, pages: z.pages.map((p, j) => (j === i ? fn(p) : p)) };
}

export const LAST_ZINE_KEY = "pp-last-zine";

export const useZine = create<State>((set, get) => ({
  zine: null,
  loading: false,
  missing: false,
  assets: { ...SAMPLE_META },
  urls: {},
  rollIds: [],
  customPacks: [],
  selected: { page: 0, frame: 0 },
  importing: null,

  loadPacks: async () => {
    set({ customPacks: await db().packs.toArray() });
  },

  openZine: async (id) => {
    if (get().zine?.id === id) return;
    await get().flush();
    Object.values(get().urls).forEach((u) => {
      URL.revokeObjectURL(u.full);
      URL.revokeObjectURL(u.thumb);
    });
    set({ loading: true, missing: false, zine: null, urls: {}, rollIds: [] });
    const [zine, assets, customPacks] = await Promise.all([
      db().zines.get(id),
      db().assets.where("zineId").equals(id).sortBy("createdAt"),
      db().packs.toArray(),
    ]);
    if (!zine) {
      set({ loading: false, missing: true });
      return;
    }
    const metas: Record<string, AssetMeta> = { ...SAMPLE_META };
    const urls: Urls = {};
    for (const a of assets) {
      const { blob, thumb, ...meta } = a;
      metas[a.id] = meta;
      urls[a.id] = { full: URL.createObjectURL(blob), thumb: URL.createObjectURL(thumb) };
    }
    try {
      localStorage.setItem(LAST_ZINE_KEY, id);
    } catch {}
    set({ zine, assets: metas, urls, rollIds: assets.map((a) => a.id), customPacks, loading: false, selected: { page: 0, frame: 0 } });
  },

  update: (fn) => {
    const z = get().zine;
    if (!z) return;
    const next = applyAutoCaptions({ ...fn(z), updatedAt: new Date().toISOString() }, get().assets);
    set({ zine: next });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void get().flush(), 400);
  },

  flush: async () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = null;
    const z = get().zine;
    if (z) await db().zines.put(z);
  },

  select: (page, frame = 0) => set({ selected: { page, frame } }),
  setTitle: (title) => get().update((z) => ({ ...z, title })),
  setPaper: (paper) => get().update((z) => ({ ...z, paper })),
  setPack: (typePackId) => get().update((z) => ({ ...z, typePackId })),
  setPrint: (p) => get().update((z) => ({ ...z, print: { ...z.print, ...p } })),
  // Turning auto back on re-fills every caption the user hasn't edited (update() applies it).
  setAutoCaptions: (autoCaptions) => get().update((z) => ({ ...z, autoCaptions })),
  setLayout: (i, layout) => {
    get().update((z) => pagePatch(z, i, (p) => withLayout(p, layout)));
    set((s) => ({ selected: { page: i, frame: Math.min(s.selected.frame, frameCount(layout) - 1) } }));
  },
  placePhoto: (i, frame, assetId) =>
    get().update((z) =>
      pagePatch(z, i, (p) => {
        const photos = Array.from({ length: frameCount(p.layout) }, (_, j) => p.photos?.[j] ?? null);
        if (frame >= photos.length) return p;
        photos[frame] = { assetId, crop: { ...DEFAULT_CROP } };
        return { ...p, photos };
      }),
    ),
  clearPhoto: (i, frame) =>
    get().update((z) => pagePatch(z, i, (p) => ({ ...p, photos: (p.photos ?? []).map((ph, j) => (j === frame ? null : ph)) }))),
  setCrop: (i, frame, crop) =>
    get().update((z) =>
      pagePatch(z, i, (p) => ({ ...p, photos: (p.photos ?? []).map((ph, j) => (j === frame && ph ? { ...ph, crop } : ph)) })),
    ),
  setCaption: (i, c) =>
    get().update((z) =>
      pagePatch(z, i, (p) => ({
        ...p,
        caption: { num: "", location: "", date: "", ...p.caption, ...c, auto: false },
      })),
    ),
  resetCaption: (i) =>
    get().update((z) => pagePatch(z, i, (p) => ({ ...p, caption: { num: "", location: "", date: "", auto: true } }))),
  setBg: (i, bgColor) => get().update((z) => pagePatch(z, i, (p) => ({ ...p, bgColor }))),
  setBody: (i, body) => get().update((z) => pagePatch(z, i, (p) => ({ ...p, body }))),
  movePage: (from, to) => {
    get().update((z) => ({ ...z, pages: movePage(z.pages, from, to) }));
    set({ selected: { page: to, frame: 0 } });
  },

  importFiles: async (files) => {
    const z = get().zine;
    if (!z || !files.length) return;
    set({ importing: { done: 0, total: files.length } });
    const added: string[] = [];
    for (const file of files) {
      try {
        const asset = await importPhoto(file, z.id);
        await db().assets.put(asset);
        const { blob, thumb, ...meta } = asset;
        set((s) => ({
          assets: { ...s.assets, [asset.id]: meta },
          urls: { ...s.urls, [asset.id]: { full: URL.createObjectURL(blob), thumb: URL.createObjectURL(thumb) } },
          rollIds: [...s.rollIds, asset.id],
        }));
        added.push(asset.id);
      } catch (err) {
        console.warn("Could not import", file.name, err);
      }
      set((s) => ({ importing: s.importing && { ...s.importing, done: s.importing.done + 1 } }));
    }
    set({ importing: null });

    // Places resolve in the background; captions using these photos update as they land.
    for (const id of added) {
      const meta = get().assets[id];
      if (!meta?.gps) continue;
      const place = await placeFor(meta.gps.lat, meta.gps.lng);
      if (!place) continue;
      await db().assets.update(id, { place });
      set((s) => ({ assets: { ...s.assets, [id]: { ...s.assets[id], place } } }));
      get().update((zz) => zz);
    }
  },

  removeAsset: async (id) => {
    await db().assets.delete(id);
    const u = get().urls[id];
    if (u) {
      URL.revokeObjectURL(u.full);
      URL.revokeObjectURL(u.thumb);
    }
    set((s) => {
      const urls = { ...s.urls };
      delete urls[id];
      return { urls, rollIds: s.rollIds.filter((x) => x !== id) };
    });
    get().update((z) => ({
      ...z,
      pages: z.pages.map((p) => ({ ...p, photos: p.photos?.map((ph) => (ph?.assetId === id ? null : ph)) })),
    }));
  },

  saveCustomPack: async (pack) => {
    await db().packs.put({ ...pack, custom: true });
    await get().loadPacks();
  },
  deleteCustomPack: async (id) => {
    await db().packs.delete(id);
    await get().loadPacks();
  },
}));

export function currentPack(s: Pick<State, "zine" | "customPacks">) {
  return findPack(s.zine?.typePackId ?? "", s.customPacks);
}

/** Creates and saves a zine, returning its id. */
export async function saveNewZine(z: Zine) {
  await db().zines.put(z);
  return z.id;
}

/** Gathers the photo files a zine uses, for the PDF worker. */
export async function blobsForZine(z: Zine): Promise<Record<string, Blob>> {
  const ids = new Set(z.pages.flatMap((p) => (p.photos ?? []).filter(Boolean).map((ph) => ph!.assetId)));
  const out: Record<string, Blob> = {};
  for (const id of ids) {
    if (isSample(id)) out[id] = await (await fetch(sampleUrl(id))).blob();
    else {
      const a = await db().assets.get(id);
      if (a) out[id] = a.blob;
    }
  }
  return out;
}
