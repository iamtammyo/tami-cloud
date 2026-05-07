"use client";

import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-label="Toggle theme"
      className="group relative inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1"
    >
      <span
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full ${
          isLight ? "dial dial-active" : "dial"
        }`}
      >
        <span className="absolute inset-1 rounded-full knurl-h opacity-70" aria-hidden />
        <span className="relative text-sm">{isLight ? "☀" : "☾"}</span>
      </span>
      <span className="text-left">
        <span className="block text-[10px] uppercase tracking-[0.18em] engrave-deep">
          {isLight ? "DAY" : "NIGHT"}
        </span>
        <span className="block text-[8px] uppercase tracking-[0.14em] engrave">
          MODE
        </span>
      </span>
    </button>
  );
}
