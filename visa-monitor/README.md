# Visa Slot Monitor — web app

A standalone Next.js app for managing the [appointment monitor](../monitor/README.md)
from your browser instead of the GitHub UI. Enter your VFS/BLS logins and alert
settings in a form; the app encrypts them and saves them as **GitHub Actions
secrets** on this repo, where the 2-hourly checker picks them up. Secrets are
write-only — the app (and anyone else) can only replace them, never read them back.

Also shows the last check's status and has a **Run check now** button.

## Deploy (Vercel, one time)

1. In Vercel: **Add New → Project**, import the `tami-cloud` repo, and set
   **Root Directory** to `visa-monitor`. This deploys it as its own app with its
   own URL, separate from Lensed.
2. Create a fine-grained GitHub token at
   <https://github.com/settings/personal-access-tokens/new>:
   - Repository access: **only** `iamtammyo/tami-cloud`
   - Repository permissions: **Secrets** (read/write), **Variables** (read/write),
     **Actions** (read/write)
3. In the Vercel project → Settings → Environment Variables, add:
   - `MONITOR_GITHUB_TOKEN` — the token from step 2
   - `MONITOR_PASSCODE` — any passphrase you choose; the page asks for it before
     doing anything
4. Redeploy, open the app, enter your passcode, fill in your details, **Save to
   GitHub**, then **Run check now**.

## Local dev

```bash
cd visa-monitor
npm install
MONITOR_GITHUB_TOKEN=... MONITOR_PASSCODE=... npm run dev   # http://localhost:3001
```

## Security notes

- The passcode gates every API route (timing-safe comparison, server-side).
- The GitHub token never reaches the browser; all GitHub calls happen in the
  server routes.
- The routes only allow writing the specific secret/variable names the monitor
  uses — the token can't be used through this app to touch anything else.
- Use a strong passcode: anyone who guesses it could overwrite your saved
  settings (though never read them).
