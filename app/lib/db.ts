"use client";

import type { StoredPhoto } from "./types";

const DB_NAME = "lensed";
const DB_VERSION = 1;
const STORE = "photos";
const LEGACY_KEY = "lensed.photos.v1";

function hasIdb(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

/** Photos saved before the status field existed are complete analyses. */
function normalize(p: StoredPhoto): StoredPhoto {
  return {
    ...p,
    status: p.status ?? (p.analysis ? "done" : "failed"),
    analysis: p.analysis ?? null,
  };
}

async function migrateLegacy(): Promise<void> {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as StoredPhoto[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const db = await openDb();
      const t = db.transaction(STORE, "readwrite");
      const store = t.objectStore(STORE);
      for (const p of parsed) store.put(normalize(p));
      await new Promise<void>((resolve, reject) => {
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error ?? new Error("Migration failed"));
      });
      db.close();
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Leave legacy data in place; the localStorage fallback still reads it.
  }
}

export async function loadAllPhotos(): Promise<StoredPhoto[]> {
  if (typeof window === "undefined") return [];
  if (!hasIdb()) return loadLegacy();
  await migrateLegacy();
  const db = await openDb();
  try {
    const all = await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    return ((all as StoredPhoto[]) ?? [])
      .map(normalize)
      .sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function putPhoto(photo: StoredPhoto): Promise<void> {
  if (typeof window === "undefined") return;
  if (!hasIdb()) {
    const rest = loadLegacy().filter((p) => p.id !== photo.id);
    saveLegacy([photo, ...rest]);
    return;
  }
  const db = await openDb();
  try {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(photo);
    await new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error ?? new Error("IndexedDB write failed"));
    });
  } finally {
    db.close();
  }
}

export async function deletePhotoById(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!hasIdb()) {
    saveLegacy(loadLegacy().filter((p) => p.id !== id));
    return;
  }
  const db = await openDb();
  try {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error ?? new Error("IndexedDB delete failed"));
    });
  } finally {
    db.close();
  }
}

function loadLegacy(): StoredPhoto[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredPhoto[];
    return Array.isArray(parsed)
      ? parsed.map(normalize).sort((a, b) => b.createdAt - a.createdAt)
      : [];
  } catch {
    return [];
  }
}

function saveLegacy(photos: StoredPhoto[]): void {
  // Retries can carry full-size data URLs; strip them or the 5MB quota goes fast.
  const slim = photos.map(({ retryDataUrl, retryMediaType, ...p }) => p);
  window.localStorage.setItem(LEGACY_KEY, JSON.stringify(slim));
}
