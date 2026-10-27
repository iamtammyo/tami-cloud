// Small line diagrams for fold formats and folding steps. Interface colours only.

const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinejoin: "round" as const };

export function FoldDiagram({ fold }: { fold: "mini8" | "accordion16" | "pocket" | "booklet" }) {
  if (fold === "mini8") {
    return (
      <svg viewBox="0 0 88 50" className="h-12 w-auto" aria-hidden>
        <rect x="2" y="2" width="84" height="46" {...S} />
        {[23, 44, 65].map((x) => <line key={x} x1={x} y1="2" x2={x} y2="48" {...S} strokeWidth={0.75} />)}
        <line x1="2" y1="25" x2="86" y2="25" {...S} strokeWidth={0.75} />
        <line x1="23" y1="25" x2="65" y2="25" stroke="var(--accent)" strokeWidth={2} strokeDasharray="3 2" />
      </svg>
    );
  }
  if (fold === "accordion16") {
    return (
      <svg viewBox="0 0 88 50" className="h-12 w-auto" aria-hidden>
        <rect x="2" y="2" width="84" height="46" {...S} />
        {[12.5, 23, 33.5, 44, 54.5, 65, 75.5].map((x) => <line key={x} x1={x} y1="2" x2={x} y2="48" {...S} strokeWidth={0.75} />)}
        <line x1="2" y1="25" x2="86" y2="25" {...S} strokeWidth={0.75} />
      </svg>
    );
  }
  if (fold === "pocket") {
    return (
      <svg viewBox="0 0 88 50" className="h-12 w-auto" aria-hidden>
        <rect x="16" y="2" width="56" height="46" {...S} />
        <line x1="44" y1="2" x2="44" y2="48" {...S} strokeWidth={0.75} />
        <line x1="16" y1="25" x2="72" y2="25" {...S} strokeWidth={0.75} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 88 50" className="h-12 w-auto" aria-hidden>
      <path d="M44 6 L14 2 L14 46 L44 48 Z" {...S} />
      <path d="M44 6 L74 2 L74 46 L44 48 Z" {...S} />
      <line x1="44" y1="6" x2="44" y2="48" {...S} />
      <circle cx="44" cy="18" r="1.5" fill="currentColor" />
      <circle cx="44" cy="36" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function FoldStepDiagram({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <svg viewBox="0 0 120 70" className="h-auto w-full text-fg" aria-hidden>
      {step === 1 ? (
        <>
          <rect x="10" y="10" width="100" height="50" {...S} strokeDasharray="3 3" opacity={0.4} />
          <rect x="10" y="35" width="100" height="25" {...S} />
          <path d="M60 20 C 70 22, 72 28, 66 33" {...S} />
          <path d="M62 30 L66 33 L68 28" {...S} />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <rect x="10" y="30" width="100" height="25" {...S} />
          <line x1="35" y1="30" x2="85" y2="30" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="4 3" />
          <path d="M85 22 l6 -6 M85 22 l8 2" {...S} />
        </>
      ) : null}
      {step === 3 ? (
        <>
          <path d="M60 8 L78 26 L60 62 L42 26 Z" {...S} />
          <path d="M42 26 L20 35 L42 44 M78 26 L100 35 L78 44" {...S} />
          <path d="M14 35 h8 M98 35 h8" {...S} />
          <path d="M18 31 l4 4 l-4 4 M102 31 l-4 4 l4 4" {...S} />
        </>
      ) : null}
      {step === 4 ? (
        <>
          <rect x="44" y="10" width="34" height="50" rx="2" {...S} />
          <path d="M44 10 L40 14 L40 62 L74 62 L78 60" {...S} opacity={0.5} />
          <line x1="50" y1="22" x2="72" y2="22" {...S} strokeWidth={3} />
          <rect x="50" y="28" width="22" height="24" {...S} strokeWidth={1} />
        </>
      ) : null}
    </svg>
  );
}

/** Tiny layout icon drawn straight from the layout's frame data. */
export function LayoutIcon({ frames }: { frames: { x: number; y: number; w: number; h: number }[] }) {
  return (
    <svg viewBox="0 0 30 42" className="h-9 w-auto" aria-hidden>
      <rect x="0.75" y="0.75" width="28.5" height="40.5" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      {frames.map((f, i) => (
        <rect
          key={i}
          x={0.75 + (f.x / 100) * 28.5}
          y={0.75 + (f.y / 100) * 40.5}
          width={(f.w / 100) * 28.5}
          height={(f.h / 100) * 40.5}
          rx={f.w >= 100 ? 2 : 1}
          fill="currentColor"
          opacity={0.75}
        />
      ))}
    </svg>
  );
}
