import type { Folder } from "../types";

// For a real embed: Instagram posts take the post URL plus "embed/" as embedUrl.
// LinkedIn posts take the "Embed this post" URL from the post menu.
export const onRecord: Folder = {
  slug: "on-record",
  name: "On record",
  label: "SOCIAL",
  blurb: "Where I post in real time. Pinned posts get embedded here; everything else is a link out.",
  view: "list",
  accent: "brown",
  files: [
    {
      slug: "linkedin",
      title: "LinkedIn",
      kind: "embed",
      publisher: "LinkedIn",
      url: "https://www.linkedin.com/in/tamilore-o/",
      summary: "Career, creator practice, and the structural stuff nobody names.",
      info: { Handle: "tamilore-o", Cadence: "A few times a week" },
    },
    {
      slug: "instagram",
      title: "Instagram",
      kind: "embed",
      publisher: "Instagram",
      url: "https://www.instagram.com/tamioladipo/",
      summary: "Carousels, series, and the occasional mirror selfie.",
      info: { Handle: "@tamioladipo", Series: "Deals Decoded · 5K in 5 Weeks · On My Radar" },
    },
    {
      slug: "instagram-photo",
      title: "Instagram, photography",
      kind: "embed",
      publisher: "Instagram",
      url: "https://www.instagram.com/tamilore.jpeg/",
      summary: "The camera account.",
      info: { Handle: "@tamilore.jpeg" },
    },
    {
      slug: "tiktok",
      title: "TikTok",
      kind: "embed",
      publisher: "TikTok",
      url: "https://www.tiktok.com/@tripleotami",
      summary: "Experiments.",
      info: { Handle: "@tripleotami" },
    },
  ],
};
