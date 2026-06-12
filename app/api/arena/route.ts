import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const REVALIDATE_SECONDS = 21600; // be kind to Are.na's rate limits

type ArenaUser = { slug?: string; username?: string };
type ArenaChannel = {
  id: number;
  title?: string;
  slug?: string;
  length?: number;
  user?: ArenaUser;
};
type ArenaBlock = {
  class?: string;
  image?: { thumb?: { url?: string } };
};

function arenaHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env.ARENA_ACCESS_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function channelUrl(c: ArenaChannel): string {
  return c.user?.slug && c.slug
    ? `https://www.are.na/${c.user.slug}/${c.slug}`
    : `https://www.are.na/channels/${c.slug ?? ""}`;
}

async function searchChannels(
  q: string,
): Promise<{ channels: ArenaChannel[]; authFailed: boolean }> {
  const res = await fetch(
    `https://api.are.na/v2/search/channels?q=${encodeURIComponent(q)}&per_page=10`,
    { headers: arenaHeaders(), next: { revalidate: REVALIDATE_SECONDS } },
  );
  // Are.na requires auth for search; without ARENA_ACCESS_TOKEN this is
  // the expected outcome, not an error.
  if (res.status === 401 || res.status === 403) {
    console.error(`[arena] search unauthorized (${res.status}) — set ARENA_ACCESS_TOKEN`);
    return { channels: [], authFailed: true };
  }
  if (!res.ok) throw new Error(`Are.na search failed (${res.status})`);
  const data = (await res.json()) as { channels?: ArenaChannel[] };
  return { channels: data.channels ?? [], authFailed: false };
}

function slugify(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Direct channel lookup is public — no token needed. */
async function publicChannelBySlug(slug: string): Promise<ArenaChannel | null> {
  try {
    const res = await fetch(
      `https://api.are.na/v2/channels/${encodeURIComponent(slug)}?per_page=1`,
      { headers: arenaHeaders(), next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return null;
    return (await res.json()) as ArenaChannel;
  } catch {
    return null;
  }
}

async function channelThumbs(slug: string, n: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.are.na/v2/channels/${encodeURIComponent(slug)}/contents?per_page=${n * 2}`,
      { headers: arenaHeaders(), next: { revalidate: REVALIDATE_SECONDS } },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { contents?: ArenaBlock[] };
    return (data.contents ?? [])
      .filter((b) => b.class === "Image" && b.image?.thumb?.url)
      .map((b) => b.image!.thumb!.url!)
      .slice(0, n);
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const mode = searchParams.get("mode") ?? "channels";
  if (!q || q.length > 100) {
    return NextResponse.json(
      { error: "q (<=100 chars) is required." },
      { status: 400 },
    );
  }

  try {
    const { channels, authFailed } = await searchChannels(q);

    if (mode === "match") {
      // Best channel FOR a photographer: title must contain the name.
      const target = normalize(q);
      let match = channels
        .filter(
          (c) =>
            c.title &&
            c.slug &&
            (c.length ?? 0) >= 3 &&
            normalize(c.title).includes(target),
        )
        .sort((a, b) => (b.length ?? 0) - (a.length ?? 0))[0];
      if (!match) {
        // Search may be unavailable without a token; a direct slug guess
        // ("saul-leiter") hits the public channel endpoint instead.
        const guess = await publicChannelBySlug(slugify(q));
        if (
          guess?.title &&
          guess.slug &&
          (guess.length ?? 0) >= 3 &&
          normalize(guess.title).includes(target)
        ) {
          match = guess;
        }
      }
      return NextResponse.json({
        channel: match
          ? {
              title: match.title,
              url: channelUrl(match),
              length: match.length ?? 0,
              user: match.user?.username ?? "",
            }
          : null,
      });
    }

    // Discovery needs real search; without a token, say so instead of
    // silently returning nothing.
    if (authFailed) {
      return NextResponse.json({ channels: [], needsToken: true });
    }

    // Discovery: top channels for a taste query, with preview thumbs.
    const candidates = channels
      .filter((c) => c.title && c.slug && (c.length ?? 0) >= 5)
      .sort((a, b) => (b.length ?? 0) - (a.length ?? 0))
      .slice(0, 4);
    const withThumbs = await Promise.all(
      candidates.map(async (c) => ({
        title: c.title!,
        url: channelUrl(c),
        length: c.length ?? 0,
        user: c.user?.username ?? "",
        thumbs: await channelThumbs(c.slug!, 6),
      })),
    );
    return NextResponse.json({
      channels: withThumbs.filter((c) => c.thumbs.length > 0).slice(0, 3),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
