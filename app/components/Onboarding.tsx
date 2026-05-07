"use client";

import { useEffect, useMemo, useState } from "react";
import { CAMERAS, CAMERA_BRANDS } from "../lib/cameras";
import { saveProfile } from "../lib/storage";
import type { SkillLevel, UserProfile } from "../lib/types";

const SUBJECTS = [
  "portrait",
  "street",
  "landscape",
  "travel",
  "wildlife",
  "architecture",
  "still-life",
  "documentary",
  "abstract",
  "fashion",
];

type Props = {
  open: boolean;
  initial: UserProfile | null;
  onClose: (profile: UserProfile | null) => void;
};

export default function Onboarding({ open, initial, onClose }: Props) {
  const [brand, setBrand] = useState<string>("Fujifilm");
  const [cameraId, setCameraId] = useState<string | "other" | "">("");
  const [customName, setCustomName] = useState("");
  const [skill, setSkill] = useState<SkillLevel>("beginner");
  const [subjects, setSubjects] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const camera = CAMERAS.find((c) => c.id === initial.cameraId);
      if (camera) {
        setBrand(camera.brand);
        setCameraId(camera.id);
        setCustomName("");
      } else if (initial.customCameraName) {
        setCameraId("other");
        setCustomName(initial.customCameraName);
      } else {
        setCameraId("");
      }
      setSkill(initial.skillLevel ?? "beginner");
      setSubjects(initial.mainSubjects);
    } else {
      setBrand("Fujifilm");
      setCameraId("");
      setCustomName("");
      setSkill("beginner");
      setSubjects([]);
    }
  }, [open, initial]);

  const camerasInBrand = useMemo(
    () => CAMERAS.filter((c) => c.brand === brand),
    [brand],
  );

  if (!open) return null;

  function commit() {
    const profile: UserProfile = {
      cameraId: cameraId === "other" || cameraId === "" ? null : cameraId,
      customCameraName:
        cameraId === "other" && customName.trim() ? customName.trim() : null,
      skillLevel: skill,
      mainSubjects: subjects,
      completedAt: Date.now(),
    };
    saveProfile(profile);
    onClose(profile);
  }

  function skip() {
    onClose(null);
  }

  function toggleSubject(s: string) {
    setSubjects((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );
  }

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="plate-black relative w-full max-w-2xl overflow-hidden rounded-md">
        <span className="screw absolute left-2 top-2" />
        <span className="screw absolute right-2 top-2" />
        <span className="screw absolute bottom-2 left-2" />
        <span className="screw absolute bottom-2 right-2" />

        <div className="plate-chrome flex items-center justify-between gap-3 px-5 py-3">
          <div>
            <div className="wordmark text-lg engrave-deep">
              {isEdit ? "CAMERA SETTINGS" : "FIRST-TIME SETUP"}
            </div>
            <div className="engrave text-[9px]">
              CALIBRATE YOUR PERSONAL COACH
            </div>
          </div>
          <span className="led-red h-2.5 w-2.5" />
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm text-stone-300">
            Tell me what you shoot with so I can phrase advice in terms of your
            actual dials and buttons. You can skip this and change it later.
          </p>

          {/* Brand */}
          <div>
            <Label step="01">Camera brand</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {CAMERA_BRANDS.map((b) => (
                <Pill
                  key={b}
                  active={brand === b}
                  onClick={() => {
                    setBrand(b);
                    setCameraId("");
                  }}
                >
                  {b}
                </Pill>
              ))}
              <Pill
                active={cameraId === "other"}
                onClick={() => setCameraId("other")}
              >
                Other / not listed
              </Pill>
            </div>
          </div>

          {/* Model */}
          {cameraId !== "other" && (
            <div>
              <Label step="02">Model</Label>
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="input-port mt-2 w-full px-3 py-2 text-sm"
              >
                <option value="">Pick a model…</option>
                {camerasInBrand.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.model} ({c.sensorClass})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-stone-500">
                Don't see yours? Pick "Other / not listed" above.
              </p>
            </div>
          )}

          {cameraId === "other" && (
            <div>
              <Label step="02">What camera are you using?</Label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Ricoh GR IIIx"
                className="input-port mt-2 w-full px-3 py-2 text-sm"
              />
              <p className="mt-1 text-[10px] text-stone-500">
                I'll still mention your camera by name in advice, but I won't be
                able to give specific dial instructions.
              </p>
            </div>
          )}

          {/* Skill */}
          <div>
            <Label step="03">Skill level</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["beginner", "Beginner", "Still learning aperture/shutter/ISO."],
                  ["developing", "Developing", "Comfortable with manual; refining style."],
                  ["advanced", "Advanced", "Confident technically; pushing creatively."],
                ] as const
              ).map(([id, label, desc]) => (
                <button
                  key={id}
                  onClick={() => setSkill(id)}
                  className={`flex-1 min-w-[160px] rounded-md border p-3 text-left transition ${
                    skill === id
                      ? "border-stone-200 bg-stone-900/60"
                      : "border-stone-700 hover:border-stone-500"
                  }`}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[11px] text-stone-500">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <Label step="04">What do you mostly shoot? (optional)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <Pill
                  key={s}
                  active={subjects.includes(s)}
                  onClick={() => toggleSubject(s)}
                >
                  {s}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        <div className="plate-chrome flex flex-wrap items-center justify-between gap-2 px-5 py-3">
          <button
            onClick={skip}
            className="text-[10px] uppercase tracking-[0.18em] text-stone-700 hover:text-stone-900"
          >
            {isEdit ? "Cancel" : "Skip for now"}
          </button>
          <button
            onClick={commit}
            disabled={cameraId === "other" && !customName.trim()}
            className="btn-chrome px-5 py-2"
          >
            <span className="engrave text-[11px]">
              {isEdit ? "Save" : "Start shooting"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-[10px] text-stone-500">{step}</span>
      <span className="engrave-cream text-[10px]">{children}</span>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="btn-chrome inline-flex items-center px-3 py-1"
      >
        <span className="engrave text-[11px]">{children}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-stone-700 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-stone-300 hover:border-stone-500"
    >
      {children}
    </button>
  );
}
