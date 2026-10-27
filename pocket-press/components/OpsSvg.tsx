"use client";

import { useId } from "react";
import { cssFamily } from "@/lib/fonts";
import { coverPlacement, rectPath, type DrawOp } from "@/lib/render/ops";
import { useAssetUrl } from "./assetUrls";

// SVG backend for the shared Page renderer. The PDF backend (lib/pdf/drawOps.ts)
// consumes the exact same ops.

const TEXT_STYLE = { fontKerning: "none", fontVariantLigatures: "none", whiteSpace: "pre" } as const;

export function OpsSvg({ ops, variant = "full" }: { ops: DrawOp[]; variant?: "full" | "thumb" }) {
  const uid = useId().replace(/:/g, "");
  const resolve = useAssetUrl();
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
          case "text":
            return (
              <text
                key={i}
                x={op.x}
                y={op.y}
                fontSize={op.size}
                fontFamily={cssFamily(op.font)}
                fill={op.color}
                textAnchor={op.anchor}
                textLength={op.text.length > 1 ? op.width : undefined}
                lengthAdjust="spacing"
                transform={op.rotate ? `rotate(${op.rotate} ${op.x} ${op.y})` : undefined}
                style={TEXT_STYLE}
              >
                {op.text}
              </text>
            );
          case "image": {
            const url = resolve(op.assetId, variant);
            const clipId = `${uid}-c${i}`;
            const d = coverPlacement(op.imgW, op.imgH, op, op.crop).draw;
            return (
              <g key={i}>
                <clipPath id={clipId}>
                  <path d={rectPath(op.x, op.y, op.w, op.h, op.r)} />
                </clipPath>
                {url ? (
                  <image
                    href={url}
                    x={d.x}
                    y={d.y}
                    width={d.w}
                    height={d.h}
                    preserveAspectRatio="none"
                    clipPath={`url(#${clipId})`}
                  />
                ) : (
                  <path d={rectPath(op.x, op.y, op.w, op.h, op.r)} fill="#D9D9D9" />
                )}
                {op.stroke ? (
                  <path d={rectPath(op.x, op.y, op.w, op.h, op.r)} fill="none" stroke={op.stroke} strokeWidth={op.strokeWidth} />
                ) : null}
              </g>
            );
          }
        }
      })}
    </>
  );
}
