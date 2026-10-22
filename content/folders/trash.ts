import type { Folder } from "../types";

export const trash: Folder = {
  slug: "trash",
  name: "Trash",
  label: "ABANDONED",
  blurb: "Ideas I started and stopped. Kept here because the stopping is part of the work.",
  view: "list",
  accent: "brown",
  files: [
    {
      slug: "daily-vlog",
      title: "A daily vlog",
      kind: "note",
      date: "2026-03-02",
      summary: "Lasted nine days. I like editing photos, not footage.",
      info: { Died: "March 2026", Cause: "Editing time" },
    },
    {
      slug: "productivity-newsletter",
      title: "A productivity newsletter",
      kind: "note",
      date: "2025-11-15",
      summary: "Too close to the thing I'm tired of. Became Field notes instead.",
      info: { Died: "November 2025", Cause: "Wrong lane" },
    },
    {
      slug: "macos-clone",
      title: "A pixel-perfect macOS clone for this site",
      kind: "note",
      date: "2026-09-20",
      summary: "Draggable windows, a dock, a boot chime. Fun for ninety seconds, useless on a phone.",
      info: { Died: "September 2026", Cause: "Novelty" },
    },
  ],
};
