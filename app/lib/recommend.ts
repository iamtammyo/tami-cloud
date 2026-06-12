import type { Photographer } from "./types";
import { PHOTOGRAPHERS } from "./photographers";

export type TasteProfile = {
  genres: [string, number][];
  moods: [string, number][];
  subjects: [string, number][];
  total: number;
};

export type Recommendation = {
  photographer: Photographer;
  /** 0–1, relative to the best match in this set. */
  strength: number;
  reasons: string[];
};

const GENRE_WEIGHT = 0.55;
const MOOD_WEIGHT = 0.3;
const SUBJECT_WEIGHT = 0.15;
const MAX_PER_PRIMARY_STYLE = 3;
const MIN_CONTEMPORARY = 2;

/**
 * Ranks photographers against what the user actually shoots: genre share
 * (weighted by how often each genre appears, not just the top three), mood
 * affinity, and whether their recurring subjects show up in a photographer's
 * body of work. The final list caps how many picks share a primary style and
 * guarantees contemporary voices are represented.
 */
export function recommendPhotographers(
  profile: TasteProfile,
  limit = 6,
  pool: Photographer[] = PHOTOGRAPHERS,
): Recommendation[] {
  if (profile.total === 0) return [];

  const genreShare = new Map(
    profile.genres.map(([g, n]) => [g, n / profile.total]),
  );
  const moodShare = new Map(
    profile.moods.map(([m, n]) => [m, n / profile.total]),
  );
  const topSubjects = profile.subjects.slice(0, 8).map(([s]) => s);

  const scored = pool.map((p) => {
    let genreScore = 0;
    const matchedGenres: string[] = [];
    for (const s of p.styles) {
      const share = genreShare.get(s) ?? 0;
      if (share > 0) {
        genreScore += share;
        matchedGenres.push(s);
      }
    }

    let moodScore = 0;
    const matchedMoods: string[] = [];
    for (const m of p.moods ?? []) {
      const share = moodShare.get(m) ?? 0;
      if (share > 0) {
        moodScore += share;
        matchedMoods.push(m);
      }
    }

    const haystack = `${p.signature} ${p.bio}`.toLowerCase();
    const matchedSubjects = topSubjects.filter((s) => haystack.includes(s));
    const subjectScore = Math.min(1, matchedSubjects.length / 3);

    const score =
      genreScore * GENRE_WEIGHT +
      moodScore * MOOD_WEIGHT +
      subjectScore * SUBJECT_WEIGHT;

    const reasons: string[] = [];
    if (matchedGenres.length > 0) {
      reasons.push(`overlaps your ${joinList(matchedGenres)} work`);
    }
    if (matchedMoods.length > 0) {
      reasons.push(`shares its ${joinList(matchedMoods)} sensibility`);
    }
    if (matchedSubjects.length > 0) {
      reasons.push(`known for ${joinList(matchedSubjects)}`);
    }

    return { photographer: p, score, reasons };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return [];

  // Don't let one genre's heavyweights crowd out the whole list.
  const picked: typeof scored = [];
  const perPrimaryStyle = new Map<string, number>();
  for (const r of scored) {
    if (picked.length >= limit) break;
    const primary = r.photographer.styles[0];
    const n = perPrimaryStyle.get(primary) ?? 0;
    if (n >= MAX_PER_PRIMARY_STYLE) continue;
    perPrimaryStyle.set(primary, n + 1);
    picked.push(r);
  }

  // Guarantee current voices: swap the weakest classic picks for the
  // strongest contemporary candidates not already chosen.
  const candidates = scored.filter(
    (r) => r.photographer.contemporary && !picked.includes(r),
  );
  for (const c of candidates) {
    const count = picked.filter((r) => r.photographer.contemporary).length;
    if (count >= MIN_CONTEMPORARY) break;
    if (picked.length < limit) {
      picked.push(c);
      continue;
    }
    let lowestClassic = -1;
    for (let i = picked.length - 1; i >= 0; i--) {
      if (!picked[i].photographer.contemporary) {
        lowestClassic = i;
        break;
      }
    }
    if (lowestClassic === -1) break;
    picked.splice(lowestClassic, 1);
    picked.push(c);
  }
  picked.sort((a, b) => b.score - a.score);

  const max = picked[0]?.score || 1;
  return picked.map((r) => ({
    photographer: r.photographer,
    strength: r.score / max,
    reasons: r.reasons,
  }));
}

function joinList(items: string[]): string {
  const list = items.slice(0, 3);
  if (list.length <= 1) return list[0] ?? "";
  return `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`;
}
