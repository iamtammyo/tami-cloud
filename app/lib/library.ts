"use client";

import { useEffect, useState } from "react";
import { PHOTOGRAPHERS } from "./photographers";
import type { Photographer } from "./types";

const KEY = "lensed.customPhotographers.v1";
export const LIBRARY_EVENT = "lensed:library-changed";

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slugForName(name: string): string {
  return `custom-${normalizeName(name).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function isCustomPhotographer(p: Photographer): boolean {
  return p.id.startsWith("custom-");
}

export function loadCustomPhotographers(): Photographer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Photographer[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomPhotographers(list: Photographer[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(LIBRARY_EVENT));
}

export function addCustomPhotographer(p: Photographer): void {
  const rest = loadCustomPhotographers().filter((x) => x.id !== p.id);
  saveCustomPhotographers([...rest, p]);
}

export function removeCustomPhotographer(id: string): void {
  saveCustomPhotographers(loadCustomPhotographers().filter((x) => x.id !== id));
}

/** Built-ins plus user additions; built-ins win on name collisions. */
export function getAllPhotographers(): Photographer[] {
  const builtinNames = new Set(PHOTOGRAPHERS.map((p) => normalizeName(p.name)));
  const custom = loadCustomPhotographers().filter(
    (p) => !builtinNames.has(normalizeName(p.name)),
  );
  return [...PHOTOGRAPHERS, ...custom];
}

export function findPhotographerByName(
  name: string,
  pool?: Photographer[],
): Photographer | null {
  const target = normalizeName(name);
  return (
    (pool ?? getAllPhotographers()).find(
      (p) => normalizeName(p.name) === target,
    ) ?? null
  );
}

/** Reactive merged library; re-renders when custom photographers change. */
export function useLibrary(): Photographer[] {
  const [list, setList] = useState<Photographer[]>(PHOTOGRAPHERS);
  useEffect(() => {
    setList(getAllPhotographers());
    const onChange = () => setList(getAllPhotographers());
    window.addEventListener(LIBRARY_EVENT, onChange);
    return () => window.removeEventListener(LIBRARY_EVENT, onChange);
  }, []);
  return list;
}
