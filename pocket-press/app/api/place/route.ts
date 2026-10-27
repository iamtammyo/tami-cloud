import { NextResponse } from "next/server";
import { formatBigDataCloud, formatNominatim, roundKey } from "@/lib/placeFormat";

// Reverse geocoding for auto captions. Nominatim first (1 request/second, needs a
// User-Agent), BigDataCloud as the fallback. Results are cached per server instance
// by coordinates rounded to 3 decimals; the browser keeps its own cache too.

const cache = new Map<string, string>();
let nextSlot = 0;

async function nominatimSlot() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 1100;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

async function fetchJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawLat = searchParams.get("lat");
  const rawLng = searchParams.get("lng");
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!rawLat || !rawLng || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  const key = roundKey(lat, lng);
  const hit = cache.get(key);
  if (hit !== undefined) return NextResponse.json({ place: hit, cached: true });

  const [rlat, rlng] = key.split(",");
  let place = "";
  try {
    await nominatimSlot();
    place = formatNominatim(
      await fetchJson(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${rlat}&lon=${rlng}`,
        { "User-Agent": "PocketPress/0.1 (zine maker)", "Accept-Language": "en" },
      ),
    );
  } catch {
    // fall through to BigDataCloud
  }
  if (!place) {
    try {
      place = formatBigDataCloud(
        await fetchJson(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${rlat}&longitude=${rlng}&localityLanguage=en`,
        ),
      );
    } catch {
      return NextResponse.json({ place: "" }, { status: 502 });
    }
  }
  if (place) cache.set(key, place);
  return NextResponse.json({ place });
}
