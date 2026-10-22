import type { Accent } from "@/content/types";

const FILL: Record<Accent, { back: string; front: string; tab: string }> = {
  blue: { back: "#9fbbdc", front: "#b7cde6", tab: "#8fabcc" },
  dusty: { back: "#4f6a86", front: "#5b7897", tab: "#46607a" },
  brown: { back: "#5a3d25", front: "#6b4a2e", tab: "#4e351f" },
  ink: { back: "#0f0e12", front: "#16151a", tab: "#0a090c" },
};

export function FolderIcon({ accent, size = 72 }: { accent: Accent; size?: number }) {
  const c = FILL[accent];
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 80 64" aria-hidden className="drop-shadow-[0_6px_10px_rgba(22,21,26,0.18)]">
      <path d="M4 12a6 6 0 0 1 6-6h18l6 6h36a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill={c.back} />
      <path d="M4 22h72v32a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill={c.front} />
      <path d="M4 22h72v3H4z" fill={c.tab} opacity="0.6" />
      <path d="M4 22h72" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </svg>
  );
}

export function TrashIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 80 64" aria-hidden className="drop-shadow-[0_6px_10px_rgba(22,21,26,0.18)]">
      <rect x="20" y="4" width="40" height="6" rx="2" fill="#6b4a2e" />
      <rect x="14" y="10" width="52" height="5" rx="1.5" fill="#4e351f" />
      <path d="M20 17h40l-3 41a4 4 0 0 1-4 4H27a4 4 0 0 1-4-4z" fill="#a07a58" />
      <path d="M31 24v30M40 24v30M49 24v30" stroke="#6b4a2e" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function AppIcon({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 80 64" aria-hidden className="drop-shadow-[0_6px_10px_rgba(22,21,26,0.18)]">
      <rect x="8" y="4" width="64" height="56" rx="12" fill="#16151a" />
      <circle cx="40" cy="32" r="16" fill="none" stroke="#f2ecdf" strokeWidth="3" />
      <circle cx="40" cy="32" r="7" fill="#b7cde6" />
      <circle cx="58" cy="16" r="3" fill="#a07a58" />
    </svg>
  );
}

export function FileGlyph({ kind }: { kind: string }) {
  const label =
    kind === "photo" ? "IMG" : kind === "article" ? "TXT" : kind === "embed" ? "URL" : kind === "deal" ? "DEAL" : "NOTE";
  return (
    <span className="inline-flex h-8 w-7 shrink-0 items-center justify-center rounded-[3px] border border-[var(--desk-line-strong)] bg-white text-[8px] font-semibold tracking-[0.08em] text-[var(--desk-ink-2)]">
      {label}
    </span>
  );
}
