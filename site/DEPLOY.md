# Deploying the site

## Why it wasn't deploying

1. **The Lensed build was failing.** The Vercel project `tami-cloud` builds the repo root (Lensed, Next.js). Lensed type-checked every `.ts` file in the repo, including `site/`, and failed on Astro-only imports. Fixed: the root `tsconfig.json` now excludes `site`.
2. **The new site was never built.** The existing Vercel project points at the repo root, so it only ever builds Lensed. The site needs its own Vercel project with Root Directory `site` (steps below).
3. **The site only exists on this branch.** Production deploys come from `main`, so the branch has to be merged first.

## One-time setup (about 15 minutes)

1. **Merge** this branch into `main` (via a pull request).
2. **Create the Vercel project.** Vercel → Add New → Project → import `iamtammyo/tami-cloud` → set **Root Directory** to `site`. The framework is detected as Astro. Deploy.
   Keep the existing `tami-cloud` project for Lensed, or delete it if Lensed doesn't need hosting.
3. **Connect the admin to GitHub.** Visit `/keystatic` on the deployed site. Keystatic walks you through creating a GitHub App, then gives you four values. Add them in Vercel → Project → Settings → Environment Variables:
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
   - `KEYSTATIC_SECRET`
   - `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`

   Redeploy. Only people with write access to the repo can sign in to the admin.
4. **Domain.** Once you pick tamioladipo.com or tamilore.com: Vercel → Project → Domains → add it, follow the DNS steps, then set `SITE_URL` to `https://yourdomain.com` in Environment Variables and redeploy.

Easier alternative for step 3: Keystatic Cloud (keystatic.cloud) handles the sign-in for you, with no GitHub App or environment variables. Free for small teams. Change `storage` in `keystatic.config.ts` to `{ kind: 'cloud' }` and add `cloud: { project: 'your-team/your-project' }`.

## Automating the Buffer refresh

Buffer doesn't push numbers to the site, so the refresh is a scheduled job. Monthly, it:
1. Reads `aggregatedPostMetrics` for the last 90 days for each channel in the "Tami's Socials" organisation.
2. Writes the totals to `site/src/data/buffer-stats.json`, with today's date in `updatedAt`.
3. Commits to `main`, and Vercel redeploys.

This can run as a Claude routine with the Buffer and GitHub connectors.
