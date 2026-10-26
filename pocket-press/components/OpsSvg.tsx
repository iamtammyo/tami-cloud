import type { DrawOp, FontRef } from "@/lib/render/ops";

// SVG backend for the shared Page renderer. The PDF backend (lib/pdf/drawOps.ts)
// consumes the exact same ops.

const FONT_FAMILY: Record<FontRef, { family: string; weight: number }> = {
  sans: { family: "Helvetica, Arial, sans-serif", weight: 400 },
  "sans-bold": { family: "Helvetica, Arial, sans-serif", weight: 700 },
};

export function OpsSvg({ ops }: { ops: DrawOp[] }) {
  return (
    <>
      {ops.map((op, i) => {
        switch (op.kind) {
          case "rect":
            return (
              <rect
                key={i}
                x={op.x}
                y={op.y}
                width={op.w}
                height={op.h}
                rx={op.r}
                fill={op.fill ?? "none"}
                stroke={op.stroke}
                strokeWidth={op.strokeWidth}
                strokeDasharray={op.dash?.join(" ")}
              />
            );
          case "path":
            return <path key={i} d={op.d} fill={op.fill ?? "none"} stroke={op.stroke} strokeWidth={op.strokeWidth} />;
          case "line":
            return (
              <line
                key={i}
                x1={op.x1}
                y1={op.y1}
                x2={op.x2}
                y2={op.y2}
                stroke={op.stroke}
                strokeWidth={op.strokeWidth}
                strokeDasharray={op.dash?.join(" ")}
              />
            );
          case "text": {
            const f = FONT_FAMILY[op.font];
            return (
              <text
                key={i}
                x={op.x}
                y={op.y}
                fontSize={op.size}
                fontFamily={f.family}
                fontWeight={f.weight}
                fill={op.color}
                textAnchor={op.anchor}
              >
                {op.text}
              </text>
            );
          }
        }
      })}
    </>
  );
}
