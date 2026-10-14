import { getCollection } from 'astro:content';

/** Public series only: draft and held work never builds. */
export const publicSeries = async () =>
  (await getCollection('photoSeries', (s) => s.data.status === 'public')).sort(
    (a, b) => a.data.order - b.data.order
  );

export const seriesMeta = (d: { place?: string; year?: string; camera?: string }) =>
  [d.place, d.year, d.camera].filter(Boolean).join(' · ');
