"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

const SKILLS = [
  ["beginner", "Beginner", "Still learning aperture, shutter, and ISO."],
  ["developing", "Developing", "Comfortable with manual; refining a style."],
  ["advanced", "Advanced", "Confident technically; pushing creatively."],
] as const;

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

  const camerasInBrand = useMemo(() => CAMERAS.filter((c) => c.brand === brand), [brand]);

  if (!open) return null;

  function commit() {
    const profile: UserProfile = {
      cameraId: cameraId === "other" || cameraId === "" ? null : cameraId,
      customCameraName: cameraId === "other" && customName.trim() ? customName.trim() : null,
      skillLevel: skill,
      mainSubjects: subjects,
      completedAt: Date.now(),
    };
    saveProfile(profile);
    onClose(profile);
  }

  function toggleSubject(s: string) {
    setSubjects((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  const isEdit = !!initial;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-7">
        <h2 className="font-display text-[30px] leading-tight text-fg">
          {isEdit ? "Camera settings" : "Set up your camera"}
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-fg2">
          Tell me what you shoot with so advice can name your actual dials and buttons. You can
          skip this and change it later.
        </p>

        <div className="mt-7 space-y-7">
          <Step n="01" label="Brand">
            <div className="flex flex-wrap gap-2">
              {CAMERA_BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBrand(b);
                    setCameraId("");
                  }}
                  className={`chip ${brand === b && cameraId !== "other" ? "chip-on" : ""}`}
                >
                  {b}
                </button>
              ))}
              <button
                onClick={() => setCameraId("other")}
                className={`chip ${cameraId === "other" ? "chip-on" : ""}`}
              >
                Other / not listed
              </button>
            </div>
          </Step>

          {cameraId !== "other" ? (
            <Step n="02" label="Model">
              <select
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                className="input w-full"
              >
                <option value="">Pick a model…</option>
                {camerasInBrand.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.model} ({c.sensorClass})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[12px] text-fg3">
                Don&apos;t see yours? Pick &ldquo;Other / not listed&rdquo; above.
              </p>
            </Step>
          ) : (
            <Step n="02" label="What camera are you using?">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Ricoh GR IIIx"
                className="input w-full"
              />
              <p className="mt-1.5 text-[12px] text-fg3">
                Advice will name your camera, but can&apos;t give dial-specific instructions.
              </p>
            </Step>
          )}

          <Step n="03" label="Skill level">
            <div className="grid gap-2 sm:grid-cols-3">
              {SKILLS.map(([id, label, desc]) => (
                <button
                  key={id}
                  onClick={() => setSkill(id)}
                  className="rounded-lg border p-3 text-left transition-colors"
                  style={{
                    borderColor: skill === id ? "var(--fg)" : "var(--hair-strong)",
                    background: skill === id ? "var(--bg-elev-2)" : "transparent",
                  }}
                >
                  <div className="text-[14px] font-medium text-fg">{label}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-fg3">{desc}</div>
                </button>
              ))}
            </div>
          </Step>

          <Step n="04" label="What do you mostly shoot? (optional)">
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`chip ${subjects.includes(s) ? "chip-on" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Step>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-hair pt-5">
          <button
            onClick={() => onClose(null)}
            className="text-[13px] text-fg3 transition-colors hover:text-fg"
          >
            {isEdit ? "Cancel" : "Skip for now"}
          </button>
          <button
            onClick={commit}
            disabled={cameraId === "other" && !customName.trim()}
            className="btn"
          >
            {isEdit ? "Save" : "Start shooting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ n, label, children }: { n: string; label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-fg3">{n}</span>
        <span className="label">{label}</span>
      </div>
      {children}
    </div>
  );
}
