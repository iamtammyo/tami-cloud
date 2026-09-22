"use client";

import { useEffect, useState } from "react";

export type Theme = "dark" | "light";
const KEY = "lensed.theme";

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (typeof window !== "undefined"
      ? (window.localStorage.getItem(KEY) as Theme | null)
      : null) as Theme | null;
    const initial = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try {
      window.localStorage.setItem(KEY, t);
    } catch {}
  }

  return [theme, setTheme];
}
