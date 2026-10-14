// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// Domain is still open (tamioladipo.com or tamilore.com), so the site URL
// comes from the SITE_URL environment variable. See .env.example.
const { SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');

export default defineConfig({
  site: SITE_URL || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'never',
});
