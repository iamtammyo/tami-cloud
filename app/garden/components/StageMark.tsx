"use client";

import { STAGE_META, type GrowthStage } from "../lib/types";

export default function StageMark({
  stage,
  withLabel = false,
}: {
  stage: GrowthStage;
  withLabel?: boolean;
}) {
  const meta = STAGE_META[stage];
  return (
    <span
      className={`stage-${stage} inline-flex items-baseline gap-1.5`}
      title={meta.hint}
    >
      <span aria-hidden>{meta.glyph}</span>
      {withLabel && (
        <span className="g-smallcaps" style={{ color: "inherit" }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}
