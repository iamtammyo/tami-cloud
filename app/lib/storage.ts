"use client";

import type { Collection, UserProfile } from "./types";

// Photos live in IndexedDB (see db.ts); only small records stay in localStorage.
const COLLECTIONS_KEY = "lensed.collections.v1";
const PROFILE_KEY = "lensed.profile.v1";

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
