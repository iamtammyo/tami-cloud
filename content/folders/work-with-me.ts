import type { Folder, MediaKitChannel, MediaKitRate } from "../types";

export const mediaKitChannels: MediaKitChannel[] = [
  {
    bufferChannelId: "6410a90469748d20c9c6c79c",
    service: "linkedin",
    handle: "Tamilore Oladipo",
    url: "https://www.linkedin.com/in/tamilore-o/",
    audienceNote: "Early-to-mid career professionals, creator-economy aware, tired of LinkedIn-core.",
  },
  {
    bufferChannelId: "694116d229ea336fd685a7e6",
    service: "instagram",
    handle: "@tamioladipo",
    url: "https://www.instagram.com/tamioladipo/",
    audienceNote: "25 to 35, aesthetically driven, quietly ambitious.",
  },
  {
    bufferChannelId: "6a5526c180cc80cdcaac7fa2",
    service: "instagram",
    handle: "@tamilore.jpeg",
    url: "https://www.instagram.com/tamilore.jpeg/",
    audienceNote: "Photography account.",
  },
  {
    bufferChannelId: "68822f6296f2ca7f1ccb3518",
    service: "tiktok",
    handle: "@tripleotami",
    url: "https://www.tiktok.com/@tripleotami",
  },
  {
    bufferChannelId: "6aa0122fcd8b9c702c2cc85b",
    service: "substack",
    handle: "tami",
    url: "https://substack.com/@tami",
  },
];

// Rates are placeholders. Edit freely; this is the only place they live.
export const mediaKitRates: MediaKitRate[] = [
  { deliverable: "Instagram carousel (in-feed, editorial integration)", rate: "from $600", note: "Includes one round of edits and 30-day usage." },
  { deliverable: "LinkedIn post (tool-in-workflow)", rate: "from $500", note: "Written in my voice. No copy-pasted briefs." },
  { deliverable: "Newsletter feature (Substack)", rate: "from $400", note: "Editor's-pick framing alongside non-sponsored picks." },
  { deliverable: "Bundle: carousel + LinkedIn + newsletter", rate: "from $1,200" },
  { deliverable: "Photography (product or lifestyle, half day)", rate: "ask" },
];

export const workWithMe: Folder = {
  slug: "work-with-me",
  name: "Work with me",
  label: "MEDIA KIT",
  blurb: "Live channel numbers, what a partnership looks like, and rates. I only take deals with tools I already use.",
  view: "mediakit",
  accent: "ink",
  files: [
    {
      slug: "how-i-work-with-brands",
      title: "How I work with brands",
      kind: "note",
      date: "2026-09-22",
      summary: "Tool-in-workflow, editor's-pick framing, disclosed and integrated.",
      body: [
        "I treat partnerships editorially. The post shows the tool in use inside my actual practice, next to the non-sponsored things I also use. Disclosed, never hidden, never apologised for.",
        "I don't read briefs into camera and I don't do 'so excited to partner with' announcements. If that's the format you need, I'm the wrong creator and I'll say so early.",
      ],
    },
    {
      slug: "sample-partnership",
      title: "Sample partnership (replace me)",
      kind: "deal",
      publisher: "Brand name",
      date: "2026-07-01",
      summary: "Carousel + LinkedIn post. Swap in a real deal with a link to the live post.",
      info: { Deliverables: "1 carousel, 1 LinkedIn post", Result: "Add reach and saves here" },
    },
  ],
};
