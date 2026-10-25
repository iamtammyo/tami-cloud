"use client";

import { useTheme } from "../lib/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      title={isLight ? "Switch to dark" : "Switch to light"}
      aria-label="Toggle theme"
      className="dial grid h-8 w-8 place-items-center"
    >
      <span className="relative z-10 text-[12px] leading-none text-[#17171a]">
        {isLight ? "☀" : "☾"}
      </span>
    </button>
  );
}
