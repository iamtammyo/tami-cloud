"use client";

import { Fragment, type ReactNode } from "react";
import { findByTitle } from "../lib/text";
import type { GardenNote } from "../lib/types";

interface Props {
  body: string;
  notes: GardenNote[];
  onVisit: (id: string) => void;
  onPlant: (title: string) => void;
  dropcap?: boolean;
}

/**
 * Renders the garden's markdown-lite dialect: paragraphs, ## headings,
 * > blockquotes, - lists, *italic*, **bold**, and [[wiki links]]. Links to
 * unplanted notes render pale and offer to plant them.
 */
export default function NoteBody({
  body,
  notes,
  onVisit,
  onPlant,
  dropcap = false,
}: Props) {
  const blocks = body.trim().split(/\n{2,}/);

  function inline(text: string, keyPrefix: string): ReactNode[] {
    const parts = text.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      const key = `${keyPrefix}-${i}`;
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const title = part.slice(2, -2).trim();
        const target = findByTitle(notes, title);
        if (target) {
          return (
            <button
              key={key}
              type="button"
              className="g-wikilink"
              onClick={() => onVisit(target.id)}
            >
              {title}
            </button>
          );
        }
        return (
          <button
            key={key}
            type="button"
            className="g-wikilink g-wikilink-absent"
            title="Not planted yet — click to plant it"
            onClick={() => onPlant(title)}
          >
            {title}
          </button>
        );
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      return <Fragment key={key}>{part}</Fragment>;
    });
  }

  return (
    <div className={`g-note-body ${dropcap ? "g-dropcap" : ""}`}>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");

        if (block.startsWith("## ")) {
          return <h2 key={bi}>{inline(block.slice(3), `h-${bi}`)}</h2>;
        }

        if (lines.every((l) => l.startsWith(">"))) {
          const text = lines
            .map((l) => l.replace(/^>\s?/, ""))
            .join(" ")
            .trim();
          return <blockquote key={bi}>{inline(text, `q-${bi}`)}</blockquote>;
        }

        if (lines.every((l) => l.startsWith("- "))) {
          return (
            <ul key={bi}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.slice(2), `l-${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={bi}>{inline(lines.join(" "), `p-${bi}`)}</p>;
      })}
    </div>
  );
}
