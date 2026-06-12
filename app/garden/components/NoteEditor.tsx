"use client";

import { useState } from "react";
import {
  STAGE_META,
  STAGE_ORDER,
  type GardenNote,
  type GrowthStage,
} from "../lib/types";

export interface NoteDraft {
  title: string;
  body: string;
  topics: string[];
  stage: GrowthStage;
}

interface Props {
  initial: GardenNote | null;
  prefillTitle?: string;
  onSave: (draft: NoteDraft) => void;
  onCancel: () => void;
}

export default function NoteEditor({
  initial,
  prefillTitle,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? prefillTitle ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [topicsRaw, setTopicsRaw] = useState(initial?.topics.join(", ") ?? "");
  const [stage, setStage] = useState<GrowthStage>(initial?.stage ?? "seedling");

  const canSave = title.trim().length > 0 && body.trim().length > 0;

  function save() {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      body: body.trim(),
      topics: topicsRaw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      stage,
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8 text-center">
        <div className="g-smallcaps">
          {initial ? "tending a planting" : "a new planting"}
        </div>
        <h1 className="g-display mt-2 text-4xl font-semibold italic">
          {initial ? initial.title : "Plant a thought"}
        </h1>
        <div className="g-ornament mx-auto mt-5 max-w-xs">
          <span aria-hidden>✧</span>
        </div>
      </header>

      <div className="space-y-6">
        <label className="block">
          <span className="g-smallcaps g-smallcaps-dark">title</span>
          <input
            className="g-input mt-2 w-full text-lg"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What shall we call it?"
            autoFocus
          />
        </label>

        <label className="block">
          <span className="g-smallcaps g-smallcaps-dark">the thought</span>
          <textarea
            className="g-input g-textarea mt-2 w-full"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Half-formed is fine. That is the point."
          />
          <span
            className="mt-1.5 block text-[0.85rem] italic"
            style={{ color: "var(--ink-faint)" }}
          >
            Link plantings with [[their title]] · *italic* · **bold** · &gt;
            for quotations · - for lists · ## for headings
          </span>
        </label>

        <label className="block">
          <span className="g-smallcaps g-smallcaps-dark">
            beds (topics, comma-separated)
          </span>
          <input
            className="g-input mt-2 w-full"
            value={topicsRaw}
            onChange={(e) => setTopicsRaw(e.target.value)}
            placeholder="gardening the web, practice…"
          />
        </label>

        <div>
          <span className="g-smallcaps g-smallcaps-dark">growth stage</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {STAGE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                className={`g-stage-option ${
                  stage === s ? "g-stage-option-active" : ""
                }`}
                onClick={() => setStage(s)}
                aria-pressed={stage === s}
              >
                <span className={`stage-${s}`} aria-hidden>
                  {STAGE_META[s].glyph}
                </span>
                <span>
                  <span className="g-smallcaps g-smallcaps-dark block">
                    {STAGE_META[s].label}
                  </span>
                  <span
                    className="block text-[0.82rem] italic"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    {STAGE_META[s].hint}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button type="button" className="g-btn" onClick={onCancel}>
            leave it
          </button>
          <button
            type="button"
            className="g-btn g-btn-fig"
            onClick={save}
            disabled={!canSave}
            style={!canSave ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
          >
            {initial ? "tend it" : "plant it"}
          </button>
        </div>
      </div>
    </div>
  );
}
