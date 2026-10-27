"use client";

import type { DrawOp } from "@/lib/render/ops";
import { OpsSvg } from "./OpsSvg";

/** One page drawn upright at its own size. Used for the editor canvas, thumbnails and cards. */
export function PageSvg({
  ops,
  w,
  h,
  label,
  className = "",
  variant = "full",
}: {
  ops: DrawOp[];
  w: number;
  h: number;
  label: string;
  className?: string;
  variant?: "full" | "thumb";
}) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`block h-auto w-full ${className}`} role="img" aria-label={label}>
      <OpsSvg ops={ops} variant={variant} />
    </svg>
  );
}
