// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';
import { loadEnv } from 'vite';

// Domain is still open (tamioladipo.com or tamilore.com), so the site URL
// comes from SITE_URL. On Vercel it falls back to the production domain Vercel assigns.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const site =
  env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  'http://localhost:4321';

export default defineConfig({
  site,
  // Pages are prerendered (static). Only the admin at /keystatic and its API run on the server.
  output: 'static',
  adapter: vercel(),
  integrations: [react(), keystatic()],
  trailingSlash: 'never',
  // Old Squarespace URLs, so existing links and search results keep working.
  redirects: {
    '/contact': '/about#contact',
    '/press': '/about',
    '/my-work': '/partnerships',
    '/portfolio': '/photography',
    '/blog': '/about',
  },
  // The admin bundle is large but only loads at /keystatic, never on public pages.
  vite: { build: { chunkSizeWarningLimit: 4000 } },
});
