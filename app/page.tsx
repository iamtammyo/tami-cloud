"use client";

import { useEffect, useState, type ReactNode } from "react";
import MyPhotos from "./components/MyPhotos";
import Inspiration from "./components/Inspiration";
import Stats from "./components/Stats";
import ThemeToggle from "./components/ThemeToggle";
import Onboarding from "./components/Onboarding";
import CameraBadge from "./components/CameraBadge";
import { loadProfile } from "./lib/storage";
import type { UserProfile } from "./lib/types";

type Tab = "photos" | "inspiration" | "stats";

const TABS: { id: Tab; label: string; icon: () => ReactNode }[] = [
  { id: "photos", label: "Photos", icon: IconPhotos },
  { id: "inspiration", label: "Inspiration", icon: IconInspiration },
  { id: "stats", label: "Stats", icon: IconStats },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("photos");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    const p = loadProfile();
    setProfile(p);
    setLoaded(true);
    if (!p) setOnboardingOpen(true);
  }, []);

  function closeOnboarding(next: UserProfile | null) {
    setOnboardingOpen(false);
    setProfile(next);
    window.dispatchEvent(new CustomEvent("lensed:profile-changed", { detail: next }));
  }

  return (
    <>
      <header className="plate sticky top-0 z-40">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[26px] leading-none tracking-tight">
              Lensed
            </span>
            <span className="mb-[3px] h-1.5 w-1.5 rounded-full bg-[#e5484d]" aria-hidden />
          </div>
          <div className="flex items-center gap-2">
            <CameraBadge profile={profile} onClick={() => setOnboardingOpen(true)} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav aria-label="Primary" className="hidden border-b border-hair md:block">
        <div className="mx-auto flex h-11 max-w-6xl items-center gap-7 px-5">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 text-[13px] font-medium transition-colors ${
                  active ? "text-fg" : "text-fg3 hover:text-fg2"
                }`}
              >
                <span className={`dot ${active ? "dot-accent" : ""}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-8 md:pb-16">
        {tab === "photos" && <MyPhotos />}
        {tab === "inspiration" && <Inspiration />}
        {tab === "stats" && <Stats />}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hair bg-elev md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-3">
          {TABS.map((t) => {
            const active = t.id === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  active ? "text-fg" : "text-fg3"
                }`}
              >
                <span className="relative">
                  <Icon />
                  {active && (
                    <span className="dot dot-accent absolute -right-1.5 -top-0.5 h-1.5 w-1.5" />
                  )}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {loaded && (
        <Onboarding open={onboardingOpen} initial={profile} onClose={closeOnboarding} />
      )}
    </>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconPhotos() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 5" />
      <circle cx="15.5" cy="9.5" r="1.5" />
    </svg>
  );
}

function IconInspiration() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v5.5M21 12h-5.5M12 21v-5.5M3 12h5.5" />
    </svg>
  );
}

function IconStats() {
  return (
    <svg {...iconProps}>
      <path d="M5 20v-9M12 20V4M19 20v-7" />
    </svg>
  );
}
