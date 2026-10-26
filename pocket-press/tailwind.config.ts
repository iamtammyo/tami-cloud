import type { Config } from "tailwindcss";

// Interface colours come only from the tokens in app/globals.css.
// `colors` is replaced (not extended) so Tailwind's default palette can't sneak in.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      bg: "var(--bg)",
      fg: "var(--fg)",
      muted: "var(--muted)",
      line: "var(--line)",
      surface: "var(--surface)",
      "inv-bg": "var(--inv-bg)",
      "inv-fg": "var(--inv-fg)",
      accent: "var(--accent)",
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { content: "1200px" },
      transitionTimingFunction: { out: "cubic-bezier(0, 0, 0.2, 1)" },
    },
  },
  plugins: [],
};

export default config;
