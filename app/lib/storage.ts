"use client";

import type { Collection, StoredPhoto } from "./types";

const PHOTOS_KEY = "lensed.photos.v1";
const COLLECTIONS_KEY = "lensed.collections.v1";

export function loadPhotos(): StoredPhoto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PHOTOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPhoto[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePhotos(photos: StoredPhoto[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos));
}

export function loadCollections(): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Collection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCollections(cols: Collection[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
}
