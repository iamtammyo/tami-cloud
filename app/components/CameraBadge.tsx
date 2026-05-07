"use client";

import { findCamera } from "../lib/cameras";
import type { UserProfile } from "../lib/types";

type Props = {
  profile: UserProfile | null;
  onClick: () => void;
};

export default function CameraBadge({ profile, onClick }: Props) {
  const camera = findCamera(profile?.cameraId ?? null);
  const label =
    camera?.fullName ??
    profile?.customCameraName ??
    "No camera set";
  const isSet = !!camera || !!profile?.customCameraName;

  return (
    <button
      onClick={onClick}
      title="Camera profile"
      className="plate-cream flex items-center gap-2 rounded-sm px-2 py-1"
    >
      <span className={`h-2 w-2 rounded-full ${isSet ? "led-green" : "port"}`} />
      <span className="text-left">
        <span className="engrave-cream block text-[8px]">CAMERA</span>
        <span className="block max-w-[160px] truncate font-mono text-[11px]">
          {label}
        </span>
      </span>
    </button>
  );
}
