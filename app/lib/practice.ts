import { findCamera } from "./cameras";
import type { StoredPhoto, UserProfile } from "./types";

export type PracticePrompt = {
  id: string;
  title: string;
  body: string;
};

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function counts<T extends string>(items: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const x of items) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
}

function topShare<T extends string>(items: T[]): { key: T; share: number } | null {
  if (items.length === 0) return null;
  const c = counts(items);
  const sorted = [...c.entries()].sort((a, b) => b[1] - a[1]);
  return { key: sorted[0][0], share: sorted[0][1] / items.length };
}

const MOOD_OPPOSITES: Record<string, string> = {
  bright: "moody",
  moody: "bright",
  minimal: "energetic",
  energetic: "minimal",
  serene: "dramatic",
  dramatic: "serene",
  intimate: "sweeping or impersonal",
  melancholic: "joyful",
};

export function buildPracticePrompts(
  photos: StoredPhoto[],
  profile: UserProfile | null,
): PracticePrompt[] {
  const out: PracticePrompt[] = [];
  if (photos.length === 0) return out;

  const apertures = photos.map((p) => p.exif?.aperture).filter((x): x is number => typeof x === "number");
  const shutters = photos.map((p) => p.exif?.shutterSeconds).filter((x): x is number => typeof x === "number");
  const isos = photos.map((p) => p.exif?.iso).filter((x): x is number => typeof x === "number");
  const focals = photos.map((p) => p.exif?.focalLength).filter((x): x is number => typeof x === "number");

  const analyses = photos
    .map((p) => p.analysis)
    .filter((a): a is NonNullable<typeof a> => a !== null);
  const moods = analyses.map((a) => a.mood);
  const genres = analyses.map((a) => a.genre);

  // Aperture: if median is small, suggest stopping down; if large, suggest opening up
  const medAperture = median(apertures);
  if (apertures.length >= 3 && typeof medAperture === "number") {
    if (medAperture <= 2.8) {
      out.push({
        id: "stop-down",
        title: "Stop down for a change",
        body: "Most of your shots are wide open. Try f/8 with a wide lens — see how much detail comes back across the frame and how the light reads differently.",
      });
    } else if (medAperture >= 5.6) {
      out.push({
        id: "open-up",
        title: "Open up the aperture",
        body: `Your shots cluster around f/${Math.round(medAperture)}. Try f/1.8 or f/2 this week — get within 3 feet of a single subject and let the background dissolve.`,
      });
    }
  }

  // Shutter: if all fast, suggest slow; if all slow, suggest fast/freeze
  if (shutters.length >= 3) {
    const fastest = Math.min(...shutters);
    const slowest = Math.max(...shutters);
    if (fastest > 1 / 60 && slowest > 1 / 60) {
      // never went fast — unlikely
    }
    if (slowest < 1 / 60) {
      out.push({
        id: "freeze",
        title: "Freeze a moment",
        body: "Your shutter sits in handheld territory. Try 1/1000s on something moving — a cyclist, a dog, splashing water — and feel the difference between blur and snap.",
      });
    } else if (fastest >= 1 / 60) {
      out.push({
        id: "drag-shutter",
        title: "Try a slow shutter",
        body: "Brace your camera against a wall or use a railing as a tripod, and shoot 1/15s during golden hour or after dusk. Embrace small motion blur — it's a different kind of frame.",
      });
    }
  }

  // ISO: if max is low, push high
  if (isos.length >= 3) {
    const maxIso = Math.max(...isos);
    if (maxIso < 800) {
      out.push({
        id: "push-iso",
        title: "Embrace ISO",
        body: "All your shots are below ISO 800. Find a candle-lit room or a twilight street, push to ISO 3200, and shoot. Grain is texture, not failure.",
      });
    }
  }

  // Focal length variety
  if (focals.length >= 4) {
    const minF = Math.min(...focals);
    const maxF = Math.max(...focals);
    if (maxF - minF < 15) {
      out.push({
        id: "focal-stretch",
        title: "Step into a different focal length",
        body: `You shoot mostly around ${Math.round(minF)}–${Math.round(maxF)}mm. If you have a longer or wider lens, take it on a walk this week and force yourself to use only that one.`,
      });
    }
  }

  // Mood concentration
  const topMood = topShare(moods);
  if (topMood && topMood.share >= 0.6 && photos.length >= 4) {
    const opp = MOOD_OPPOSITES[topMood.key] ?? "the opposite";
    out.push({
      id: "mood-flip",
      title: "Flip the mood",
      body: `${Math.round(topMood.share * 100)}% of your photos read as ${topMood.key}. Try one ${opp} frame this week — different time of day, different subject choice. Notice what you instinctively avoid.`,
    });
  }

  // Genre concentration
  const topGenre = topShare(genres);
  if (topGenre && topGenre.share >= 0.7 && photos.length >= 4) {
    out.push({
      id: "genre-stretch",
      title: "Step outside your lane",
      body: `You're firmly a ${topGenre.key} photographer right now. For one week, only shoot something you don't normally — a still life, a portrait, a landscape — even if it feels weird.`,
    });
  }

  // Camera-specific
  const camera = findCamera(profile?.cameraId ?? null);
  if (camera?.brand === "Fujifilm") {
    out.push({
      id: "fuji-acros",
      title: "Try the Acros simulation",
      body: "Q menu → Film Simulation → Acros. Shoot a contrast-heavy scene (window light on a face, deep shadows). Don't post-process — print it as the camera saw it.",
    });
  } else if (camera?.bodyClass === "phone") {
    out.push({
      id: "phone-manual",
      title: "Try a manual app",
      body: "Install Halide or Lightroom Mobile. Shoot for 20 minutes with manual shutter and ISO. The point isn't to use it forever — it's to feel what your phone normally hides.",
    });
  }

  // Always-good-for-beginners
  if (profile?.skillLevel === "beginner" && out.length < 4) {
    out.push({
      id: "ten-frames",
      title: "Ten frames, one subject",
      body: "Pick one thing — a chair, a coffee cup, a friend. Stay in one place. Shoot ten different angles. Look at the contact sheet and pick the strongest one. Repeat next week.",
    });
  }

  // Generic fallback if nothing fired
  if (out.length === 0) {
    out.push({
      id: "limit-square",
      title: "Crop yourself square",
      body: "Set your camera (or crop overlay) to 1:1 for a whole walk. Square forces different framing instincts. See what changes.",
    });
  }

  return out.slice(0, 5);
}
