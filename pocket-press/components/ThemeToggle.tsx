"use client";

import { useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const KEY = "pp-theme";

function apply(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

/** Follows the system setting by default; a click cycles system → light → dark. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Theme | null;
      if (saved && ORDER.includes(saved)) setTheme(saved);
    } catch {}
  }, []);

  function next() {
    const t = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(t);
    apply(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label={`Theme: ${theme}. Change theme`}
      className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-line px-3 font-mono text-[13px] text-muted transition duration-150 ease-out hover:border-fg hover:text-fg"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {theme === "light" ? null : <path d="M7 1 A6 6 0 0 1 7 13 Z" fill="currentColor" />}
        {theme === "dark" ? <circle cx="7" cy="7" r="6" fill="currentColor" /> : null}
      </svg>
      <span className="hidden sm:inline">{theme}</span>
    </button>
  );
}
