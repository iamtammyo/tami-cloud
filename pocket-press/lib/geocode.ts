import { db } from "./db";
import { roundKey } from "./placeFormat";

// Client side of auto captions: browser cache first, then the /api/place route,
// one request at a time so we stay inside Nominatim's rate limit.

let queue: Promise<unknown> = Promise.resolve();

export function placeFor(lat: number, lng: number): Promise<string> {
  const key = roundKey(lat, lng);
  const job = queue.then(async () => {
    const cached = await db().places.get(key);
    if (cached) return cached.place;
    try {
      const res = await fetch(`/api/place?lat=${lat}&lng=${lng}`);
      const { place } = (await res.json()) as { place?: string };
      if (place) await db().places.put({ key, place, savedAt: new Date().toISOString() });
      return place ?? "";
    } catch {
      return "";
    }
  });
  queue = job.catch(() => "");
  return job;
}
