/*
  Engagement numbers pulled from Buffer ("Tami's Socials") into src/data/buffer-stats.json.
  Follower counts are not in Buffer's API, so those stay manual in the admin.
*/
import stats from '~/data/buffer-stats.json';

type Channel = 'linkedin' | 'instagram' | 'tiktok';

const compact = (n: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

/** The small line under each big number, e.g. "3.1K avg. impressions per post". */
export function bufferNote(channel: Channel): string | null {
  const c = stats.channels[channel] as Record<string, number | string> | undefined;
  if (!c || !c.posts) return null;
  const per = (n: unknown) => compact(Math.round(Number(n) / Number(c.posts)));
  switch (channel) {
    case 'linkedin':
      return `${per(c.impressions)} avg. impressions per post`;
    case 'instagram':
      return `${per(Number(c.saves ?? 0) + Number(c.shares ?? 0))} avg. saves and shares per post`;
    case 'tiktok':
      return `${per(c.views)} avg. views per video`;
  }
}

export const bufferUpdated = new Date(`${stats.updatedAt}T12:00:00Z`).toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const bufferSummary = `Averages cover posts from the last ${stats.windowDays} days, pulled from Buffer on ${bufferUpdated}.`;
