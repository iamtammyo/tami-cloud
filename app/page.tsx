"use client";

import { useState } from "react";
import MyPhotos from "./components/MyPhotos";
import Inspiration from "./components/Inspiration";
import Stats from "./components/Stats";

type Tab = "photos" | "inspiration" | "stats";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "photos", label: "Photos", sub: "Upload & analyze" },
  { id: "inspiration", label: "Inspiration", sub: "Photographers" },
  { id: "stats", label: "Stats", sub: "Your fingerprint" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("photos");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Top plate — chrome nameplate */}
      <header className="plate-chrome relative mb-2 rounded-md px-6 py-4">
        <Screws />
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="wordmark text-3xl engrave-deep">LENSED</div>
            <div className="engrave mt-0.5 text-[10px]">
              MODEL 01 · A WORKBENCH FOR AMATEUR PHOTOGRAPHERS
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PortRow />
            <div className="flex items-center gap-1.5">
              <span className="led-red h-2.5 w-2.5" />
              <span className="engrave text-[9px]">REC</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sprocket-hole divider */}
      <div className="sprocket mb-6 rounded-sm" />

      {/* Mode-dial row: tabs */}
      <nav className="plate-black mb-8 flex flex-wrap items-center gap-3 rounded-md p-3">
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
      {tab === "inspiration" && <Inspiration />}
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
