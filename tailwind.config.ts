import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        elev: "var(--bg-elev)",
        elev2: "var(--bg-elev-2)",
        fg: "var(--fg)",
        fg2: "var(--fg-2)",
        fg3: "var(--fg-3)",
        hair: "var(--hair)",
        hairs: "var(--hair-strong)",
        accent: "var(--accent)",
        ok: "var(--ok)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
