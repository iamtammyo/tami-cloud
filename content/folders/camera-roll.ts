import type { Folder } from "../types";

// Placeholder frames until the real library is in. Replace `image.src` with
// files in /public/photos and the Get Info panel will read from `photo`.
const placeholder = (seed: number, w = 1200, h = 1500) => ({
  src: `https://picsum.photos/seed/${seed}/${w}/${h}`,
  alt: "Placeholder frame",
  width: w,
  height: h,
});

export const cameraRoll: Folder = {
  slug: "camera-roll",
  name: "Camera roll",
  label: "PHOTOGRAPHY",
  blurb: "Low light, mostly Lagos. Click a frame for the camera settings.",
  view: "grid",
  accent: "dusty",
  files: [
    {
      slug: "mirror-01",
      title: "Mirror, 6pm",
      kind: "photo",
      date: "2026-08-14",
      image: placeholder(1101),
      photo: { camera: "Fujifilm X100V", lens: "23mm f/2", settings: "23mm · f/2 · 1/60s · ISO 1600", location: "Lekki, Lagos" },
      summary: "The apartment mirror, the only good light in the flat.",
    },
    {
      slug: "flatlay-desk",
      title: "Desk, before the week starts",
      kind: "photo",
      date: "2026-08-03",
      image: placeholder(1102, 1500, 1200),
      photo: { camera: "Fujifilm X100V", lens: "23mm f/2", settings: "23mm · f/2.8 · 1/125s · ISO 800", location: "Home" },
      summary: "Notebook, camera, the coffee I didn't finish.",
    },
    {
      slug: "market-hands",
      title: "Hands at Balogun",
      kind: "photo",
      date: "2026-07-19",
      image: placeholder(1103),
      photo: { camera: "Fujifilm X100V", lens: "23mm f/2", settings: "23mm · f/4 · 1/250s · ISO 400", location: "Balogun Market, Lagos" },
      summary: "Fabric, hands, and about four seconds to get the frame.",
    },
    {
      slug: "window-light",
      title: "Window light study",
      kind: "photo",
      date: "2026-06-28",
      image: placeholder(1104, 1200, 1200),
      photo: { camera: "iPhone 15 Pro", lens: "24mm", settings: "24mm · f/1.8 · 1/30s · ISO 250", location: "Home" },
      summary: "Same corner, four times of day.",
    },
    {
      slug: "third-mainland",
      title: "Third Mainland, blue hour",
      kind: "photo",
      date: "2026-06-02",
      image: placeholder(1105, 1500, 1000),
      photo: { camera: "Fujifilm X100V", lens: "23mm f/2", settings: "23mm · f/2 · 1/15s · ISO 3200", location: "Third Mainland Bridge, Lagos" },
      summary: "Handheld, so forgive the softness.",
    },
    {
      slug: "self-portrait-hallway",
      title: "Self portrait, hallway",
      kind: "photo",
      date: "2026-05-11",
      image: placeholder(1106),
      photo: { camera: "Fujifilm X100V", lens: "23mm f/2", settings: "23mm · f/2 · 1/60s · ISO 2000", location: "Home" },
      summary: "Ten-second timer, six attempts.",
    },
  ],
};
