"use client";

import { useEffect, useState } from "react";
import MyPhotos from "./components/MyPhotos";
import Inspiration from "./components/Inspiration";
import Stats from "./components/Stats";
import ThemeToggle from "./components/ThemeToggle";
import Onboarding from "./components/Onboarding";
import CameraBadge from "./components/CameraBadge";
import { loadProfile } from "./lib/storage";
import type { UserProfile } from "./lib/types";

type Tab = "photos" | "inspiration" | "stats";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "photos", label: "Photos", sub: "Upload & analyze" },
  { id: "inspiration", label: "Inspiration", sub: "Photographers" },
  { id: "stats", label: "Stats", sub: "Your fingerprint" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("photos");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [focusPhotographerId, setFocusPhotographerId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setProfile(loadProfile());
    setLoaded(true);
    // Onboarding is deferred: it opens from the camera badge or the inline
    // prompt that appears after a first critique, not before first value.
    function onOpenRequest() {
      setOnboardingOpen(true);
    }
    function onViewPhotographer(e: Event) {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      setFocusPhotographerId(id);
      setTab("inspiration");
    }
    window.addEventListener("lensed:open-onboarding", onOpenRequest);
    window.addEventListener("lensed:view-photographer", onViewPhotographer);
    return () => {
      window.removeEventListener("lensed:open-onboarding", onOpenRequest);
      window.removeEventListener(
        "lensed:view-photographer",
        onViewPhotographer,
      );
    };
  }, []);

  function closeOnboarding(next: UserProfile | null) {
    setOnboardingOpen(false);
    setProfile(next);
    window.dispatchEvent(
      new CustomEvent("lensed:profile-changed", { detail: next }),
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 pb-28 md:px-6 md:py-10 md:pb-10">
      <header className="plate-chrome relative mb-2 rounded-md px-6 py-4">
        <Screws />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="wordmark text-3xl engrave-deep">LENSED</div>
            <div className="engrave mt-0.5 text-[10px]">
              MODEL 01 · A WORKBENCH FOR AMATEUR PHOTOGRAPHERS
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <CameraBadge
              profile={profile}
              onClick={() => setOnboardingOpen(true)}
            />
            <ThemeToggle />
            <PortRow />
            <div className="flex items-center gap-1.5">
              <span className="led-red h-2.5 w-2.5" />
              <span className="engrave text-[9px]">REC</span>
            </div>
          </div>
        </div>
      </header>

      <div className="sprocket mb-6 rounded-sm" />

      <nav className="plate-black mb-8 hidden flex-wrap items-center gap-3 rounded-md p-3 md:flex">
        <span className="engrave-cream pl-2 pr-1 text-[10px] text-stone-400">
          MODE
        </span>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`group flex items-center gap-2 rounded-full pl-1 pr-4 py-1 transition ${
                active ? "" : "opacity-80 hover:opacity-100"
              }`}
              aria-pressed={active}
            >
              <span
                className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full ${
                  active ? "dial dial-active" : "dial"
                }`}
              >
                <span
                  className="absolute inset-1 rounded-full knurl-h opacity-70"
                  aria-hidden
                />
                <span
                  className={`relative h-1.5 w-1.5 rounded-full ${
                    active ? "led-red" : "bg-stone-800"
                  }`}
                />
              </span>
              <span className="text-left">
                <span className="block text-[11px] uppercase tracking-[0.18em] text-stone-200">
                  {t.label}
                </span>
                <span className="block text-[9px] uppercase tracking-[0.14em] text-stone-500">
                  {t.sub}
                </span>
              </span>
            </button>
          );
        })}
        <span className="ml-auto flex items-center gap-2 pr-2">
          <span className="port h-2 w-2" />
          <span className="port h-2 w-2" />
          <span className="port h-2 w-2" />
        </span>
      </nav>

      {tab === "photos" && <MyPhotos />}
      {tab === "inspiration" && (
        <Inspiration
          focusId={focusPhotographerId}
          onFocusConsumed={() => setFocusPhotographerId(null)}
        />
      )}
      {tab === "stats" && <Stats />}

      <footer className="mt-16">
        <div className="plate-chrome flex items-center justify-between rounded-md px-4 py-2">
          <span className="engrave text-[10px]">SERIAL · L-0001 · MADE FOR LIGHT</span>
          <span className="flex items-center gap-2">
            <span className="port-light h-2.5 w-2.5" />
            <span className="port-light h-2.5 w-2.5" />
            <span className="engrave text-[10px]">f/1.4 — ∞</span>
          </span>
        </div>
      </footer>

      {/* Thumb-reachable tab bar on small screens */}
      <nav className="plate-black fixed inset-x-0 bottom-0 z-40 border-t border-stone-800 md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                aria-pressed={active}
                className="flex flex-1 flex-col items-center gap-1 py-2.5"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    active ? "led-red" : "bg-stone-700"
                  }`}
                />
                <span
                  className={`text-[9px] uppercase tracking-[0.16em] ${
                    active ? "text-stone-100" : "text-stone-400"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {loaded && (
        <Onboarding
          open={onboardingOpen}
          initial={profile}
          onClose={closeOnboarding}
        />
      )}
    </main>
  );
}

function Screws() {
  return (
    <>
      <span className="screw absolute left-2 top-2" />
      <span className="screw absolute right-2 top-2" />
      <span className="screw absolute bottom-2 left-2" />
      <span className="screw absolute bottom-2 right-2" />
    </>
  );
}

function PortRow() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="port-light h-3 w-3" />
      <span className="port-light h-3 w-3" />
      <span className="port-light h-3 w-3" />
    </div>
  );
}
