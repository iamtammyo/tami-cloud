"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { ZinePage } from "@/components/ZinePage";
import { currentPack, useZine } from "@/lib/store";

// The folded booklet, one spread at a time: cover alone, 2–3, 4–5, 6–7, back alone.
const SPREADS: [number | null, number | null][] = [
  [null, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [8, null],
];

const TURN_MS = 650;

export function PreviewFold({ onClose }: { onClose: () => void }) {
  const zine = useZine((s) => s.zine)!;
  const pack = useZine(currentPack);
  const assets = useZine((s) => s.assets);
  const [spread, setSpread] = useState(0);
  const [turn, setTurn] = useState<{ dir: 1 | -1; to: number; go: boolean } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function goto(dir: 1 | -1) {
    const to = spread + dir;
    if (to < 0 || to >= SPREADS.length || turn) return;
    if (reduced) return setSpread(to);
    setTurn({ dir, to, go: false });
    requestAnimationFrame(() => requestAnimationFrame(() => setTurn((t) => t && { ...t, go: true })));
    setTimeout(() => {
      setSpread(to);
      setTurn(null);
    }, TURN_MS);
  }

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goto(1);
      if (e.key === "ArrowLeft") goto(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const page = (n: number | null, extra = "") =>
    n ? <ZinePage zine={zine} pack={pack} assets={assets} n={n} className={`h-full w-full outline outline-1 outline-line ${extra}`} /> : <div className="h-full w-full" />;

  // While turning, the static halves show what's underneath the moving leaf.
  const [curL, curR] = SPREADS[spread];
  const [nextL, nextR] = turn ? SPREADS[turn.to] : [null, null];
  const left = turn ? (turn.dir === 1 ? curL : nextL) : curL;
  const right = turn ? (turn.dir === 1 ? nextR : curR) : curR;
  const label = SPREADS[spread].filter(Boolean).map((n) => (n === 1 ? "Cover" : n === 8 ? "Back" : `Page ${n}`)).join(" and ");

  return (
    <div role="dialog" aria-modal="true" aria-label="Preview fold" className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6">
        <p className="font-medium">Preview fold</p>
        <Button ref={closeRef} variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <div className="relative flex w-full max-w-[640px]" style={{ perspective: "1800px" }} aria-live="polite" aria-label={label}>
          <div className="aspect-[105/148.5] w-1/2">{page(left)}</div>
          <div className="aspect-[105/148.5] w-1/2">{page(right)}</div>
          {turn ? (
            <div
              className="absolute top-0 h-full w-1/2"
              style={{
                left: turn.dir === 1 ? "50%" : 0,
                transformStyle: "preserve-3d",
                transformOrigin: turn.dir === 1 ? "left center" : "right center",
                transition: `transform ${TURN_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                transform: `rotateY(${turn.go ? turn.dir * -180 : 0}deg)`,
              }}
            >
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                {page(turn.dir === 1 ? curR : curL)}
              </div>
              <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                {page(turn.dir === 1 ? nextL : nextR)}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => goto(-1)} disabled={spread === 0 || !!turn} aria-label="Previous spread">
            ←
          </Button>
          <span className="font-mono text-[13px] text-muted">{label}</span>
          <Button variant="secondary" onClick={() => goto(1)} disabled={spread === SPREADS.length - 1 || !!turn} aria-label="Next spread">
            →
          </Button>
        </div>
      </div>
    </div>
  );
}
