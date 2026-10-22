import type { Folder } from "../types";

// The digital garden. `links` between notes draw the connections view.
export const fieldNotes: Folder = {
  slug: "field-notes",
  name: "Field notes",
  label: "GARDEN",
  blurb: "Half-formed thinking, kept in public. Notes link to each other; the map shows how.",
  view: "garden",
  accent: "dusty",
  files: [
    {
      slug: "why-not-me",
      title: "Why not me?",
      kind: "note",
      date: "2026-09-01",
      summary: "The sentence everything else hangs off.",
      body: [
        "Authorship over circumstance. Showing the work. Refusing to wait for permission. It's not a hustle line; it's a question I ask before I decide something is 'for other people'.",
      ],
      links: ["the-menu", "showing-the-work", "naming-the-structural"],
      tags: ["identity"],
    },
    {
      slug: "the-menu",
      title: "The menu",
      kind: "note",
      date: "2026-08-20",
      summary: "Most of us pick from whatever's placed in front of us and call it choice.",
      body: [
        "The layoff in 2020 didn't give me options. It showed me the menu I'd been ordering from was one page long. The work since then has been writing my own.",
      ],
      links: ["why-not-me"],
      tags: ["identity", "work"],
    },
    {
      slug: "showing-the-work",
      title: "Showing the work",
      kind: "note",
      date: "2026-08-10",
      summary: "Receipts beat advice.",
      body: [
        "Past-tense, personal-receipt voice lands harder than instructions. 'Every tool here came after I started posting' beats 'tools come after starting'.",
      ],
      links: ["why-not-me", "taste-is-a-practice"],
      tags: ["practice"],
    },
    {
      slug: "taste-is-a-practice",
      title: "Taste is a practice",
      kind: "note",
      date: "2026-07-30",
      summary: "You don't announce taste. You keep making choices until people notice a pattern.",
      body: [
        "Curator by example, not by headline. The camera roll folder on this site is doing more for 'taste' than any bio line could.",
      ],
      links: ["showing-the-work", "low-light"],
      tags: ["taste"],
    },
    {
      slug: "low-light",
      title: "Low light",
      kind: "note",
      date: "2026-07-12",
      summary: "Why I keep shooting in the dark.",
      body: [
        "Dim natural light hides the mess and keeps the mood honest. It's also the only light I get after work, which is the less romantic reason.",
      ],
      links: ["taste-is-a-practice"],
      tags: ["photography"],
    },
    {
      slug: "naming-the-structural",
      title: "Naming the structural",
      kind: "note",
      date: "2026-06-25",
      summary: "Luck, timing, geography. Dodging them costs trust.",
      body: [
        "I won't sell grit as the answer. I name the luck and the timing, then show the part that's still mine to choose. That's the whole difference between this and hustle content.",
      ],
      links: ["why-not-me", "the-menu"],
      tags: ["identity", "work"],
    },
    {
      slug: "this-site",
      title: "This site",
      kind: "note",
      date: "2026-09-22",
      summary: "Notes on building a desktop instead of a portfolio.",
      body: [
        "Folders, not pages. Files, not sections. Adding a thing to the site should feel like dragging it onto a desktop. The Trash is real and it has my abandoned ideas in it.",
      ],
      links: ["showing-the-work", "taste-is-a-practice"],
      tags: ["practice"],
    },
  ],
};
