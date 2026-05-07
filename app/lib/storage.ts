"use client";

import type { StoredPhoto } from "./types";

const KEY = "lensed.photos.v1";

export function loadPhotos(): StoredPhoto[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPhoto[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePhotos(photos: StoredPhoto[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(photos));
}
