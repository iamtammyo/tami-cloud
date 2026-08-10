"use client";

import type { Collection, Photographer, StoredPhoto, UserProfile } from "./types";

const PHOTOS_KEY = "lensed.photos.v1";
const COLLECTIONS_KEY = "lensed.collections.v1";
const PROFILE_KEY = "lensed.profile.v1";
const CUSTOM_PHOTOGRAPHERS_KEY = "lensed.customPhotographers.v1";

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

export function loadProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile | null): void {
  if (typeof window === "undefined") return;
  if (profile === null) {
    window.localStorage.removeItem(PROFILE_KEY);
    return;
  }
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadCustomPhotographers(): Photographer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_PHOTOGRAPHERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Photographer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomPhotographers(list: Photographer[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CUSTOM_PHOTOGRAPHERS_KEY, JSON.stringify(list));
}
