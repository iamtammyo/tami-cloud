"use client";

import { findCamera } from "../lib/cameras";
import type { UserProfile } from "../lib/types";

type Props = {
  profile: UserProfile | null;
  onClick: () => void;
};

// Lives on the metallic top plate, so it uses fixed dark ink rather than
// theme tokens.
export default function CameraBadge({ profile, onClick }: Props) {
  const camera = findCamera(profile?.cameraId ?? null);
  const name = camera?.model ?? profile?.customCameraName ?? null;

  return (
    <button
      onClick={onClick}
      title="Camera profile"
      className="flex items-center gap-2 rounded-full border border-black/15 px-3 py-1.5 text-[12px] text-[#17171a] transition-colors hover:bg-black/5"
    >
      <span
        className={`dot ${name ? "dot-ok" : ""}`}
        style={name ? undefined : { background: "rgba(0,0,0,0.3)" }}
      />
      <span className="font-mono">{name ?? "Set camera"}</span>
    </button>
  );
}
