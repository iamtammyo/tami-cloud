"use client";

import { useState } from "react";
import MyPhotos from "./components/MyPhotos";
import Inspiration from "./components/Inspiration";
import Stats from "./components/Stats";

type Tab = "photos" | "inspiration" | "stats";

const TABS: { id: Tab; label: string; sub: string }[] = [
  { id: "photos", label: "My Photos", sub: "Upload & analyze" },
  { id: "inspiration", label: "Inspiration", sub: "Photographers by style" },
  { id: "stats", label: "Stats", sub: "What you gravitate toward" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("photos");

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Lensed</h1>
          <span className="text-sm text-stone-400">
            a workbench for amateur photographers
          </span>
        </div>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2 border-b border-stone-800">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-left transition ${
                active
                  ? "border-stone-100 text-stone-100"
                  : "border-transparent text-stone-400 hover:text-stone-200"
              }`}
            >
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-stone-500">{t.sub}</div>
            </button>
          );
        })}
      </nav>

      {tab === "photos" && <MyPhotos />}
      {tab === "inspiration" && <Inspiration />}
      {tab === "stats" && <Stats />}
    </main>
  );
}
