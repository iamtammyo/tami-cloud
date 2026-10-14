import type { APIRoute } from 'astro';
import { publicSeries } from '~/lib/photo';
import { caseStudies } from '~/lib/cases';

/* Public pages only. Draft and held photo work and draft case studies never appear. */
export const GET: APIRoute = async ({ site }) => {
  const paths = [
    '/',
    '/photography',
    '/partnerships',
    '/about',
    ...(await publicSeries()).map((s) => `/photography/${s.id}`),
    ...(await caseStudies()).map((c) => `/partnerships/${c.id}`),
  ];
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
