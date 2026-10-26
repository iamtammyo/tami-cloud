import { defineMiddleware } from 'astro:middleware';

/*
  The admin signs in through a GitHub App. Until its settings are added in
  Vercel, Keystatic's sign-in routes crash with a bare server error. Send
  people to a page that says what's missing instead.
*/
const REQUIRED = ['KEYSTATIC_GITHUB_CLIENT_ID', 'KEYSTATIC_GITHUB_CLIENT_SECRET', 'KEYSTATIC_SECRET'] as const;

export const onRequest = defineMiddleware((context, next) => {
  if (import.meta.env.DEV || !context.url.pathname.startsWith('/api/keystatic/github/')) return next();

  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length === 0) return next();

  console.error(`Keystatic admin not connected. Missing in Vercel: ${missing.join(', ')}`);
  if (context.request.method === 'GET') return context.redirect('/admin-setup', 302);
  return new Response(JSON.stringify({ error: 'Admin not connected yet', missing }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
});
