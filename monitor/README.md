# Visa Appointment Monitor

Checks for open **Digital Nomad visa** appointment slots every 2 hours on:

- **VFS Global** — Portugal visa applications from Nigeria (`visa.vfsglobal.com/nga/en/prt`)
- **BLS Spain** — Spain visa applications from Nigeria (`nigeria.blsspainglobal.com`)

It logs into your accounts with Playwright, selects the Digital Nomad category
(configurable — falls back to the first option if the site labels it
differently), reads the availability message on the booking page, and pushes an
alert straight to your phone via **ntfy**, **Telegram**, and/or **email** the
moment slots appear. When nothing is open it stays silent; when it gets blocked (Cloudflare,
CAPTCHA, bad password) it tells you *once* per incident instead of spamming.

## ⚠️ Read this first — what to expect

Both sites actively fight automation:

- **VFS** sits behind Cloudflare. Requests from datacenter IPs (which includes
  GitHub Actions runners) are frequently blocked before the login page even
  loads. The monitor detects this and reports `ANTIBOT_BLOCKED` rather than
  pretending there are no slots.
- **BLS** shows an image/number CAPTCHA during login that cannot be solved
  automatically. When it appears, the monitor reports `CAPTCHA_REQUIRED`.
  It keeps retrying each cycle because the CAPTCHA isn't always shown.

So treat this as an **early-warning system, not an auto-booker**: when you get a
`SLOTS_AVAILABLE` alert, log in yourself immediately and book. If the GitHub
runner keeps getting blocked, your best options are:

1. **Run it on your own machine** (home/office IP) on a schedule — most reliable.
2. Set `PROXY_SERVER` to a **residential/ISP proxy** so the GitHub job exits the
   internet from a normal-looking IP.

## Setup

### 1. Phone notifications (pick at least one)

**ntfy (easiest — instant push, no account):**
1. Install the **ntfy** app ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)).
2. In the app, subscribe to a topic with a hard-to-guess name, e.g. `tami-visa-slots-x7k2m9` (topics are public — the name is the only secret).
3. Set `NTFY_TOPIC` to that same name. Slot alerts are sent with **urgent** priority, which the app can let through Do Not Disturb.

**Telegram (also instant, free):**
1. Message [@BotFather](https://t.me/BotFather) → `/newbot` → copy the bot token.
2. Send your new bot any message.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy your `chat.id`.

**Email (Gmail):**
1. Enable 2-Step Verification on your Google account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>.
3. Use your Gmail address as `SMTP_USER` and the app password as `SMTP_PASS`.

### 2. GitHub Actions (runs every 2 hours automatically)

In the repo: **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret | Value |
|---|---|
| `VFS_EMAIL` / `VFS_PASSWORD` | Your VFS Global login |
| `BLS_EMAIL` / `BLS_PASSWORD` | Your BLS Spain login |
| `NTFY_TOPIC` | Your ntfy topic name (if using ntfy) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | From step 1 (if using Telegram) |
| `SMTP_USER` / `SMTP_PASS` | Gmail + app password (if using email) |
| `NOTIFY_TO` | Where to email alerts (optional, defaults to `SMTP_USER`) |
| `PROXY_SERVER` / `PROXY_USERNAME` / `PROXY_PASSWORD` | Optional residential proxy |

A site is only checked when both its email and password secrets are set — so you
can start with just one site.

The monitor targets the **Digital Nomad** visa by default: on VFS it looks for a
booking category/sub-category containing "Digital Nomad", and on BLS it looks
for a visa type containing "Digital Nomad" (falling back to the first dropdown
option when no match exists, so a differently-worded label never kills the
check). To override, add repository **Variables**: `VFS_CENTRE` (e.g. `Lagos`),
`VFS_CATEGORY`, `VFS_SUBCATEGORY`, `BLS_VISA_TYPE` — all case-insensitive
substring matches against the dropdown text.

The workflow (`.github/workflows/appointment-monitor.yml`) then runs every 2
hours. You can also trigger it manually from the **Actions** tab ("Appointment
monitor" → "Run workflow") — do that once after adding secrets to confirm it
works. Every run uploads screenshots as artifacts so you can see exactly what
the monitor saw.

### 3. Running locally (more reliable IP)

```bash
cd monitor
cp .env.example .env      # then fill it in
npm install
npx playwright install chromium
npm run test:notify        # confirm your alert channel works
npm run check              # run one check now
```

Watch the browser while debugging with `HEADFUL=1 npm run check`.

Schedule it every 2 hours with cron (`crontab -e`):

```cron
0 */2 * * * cd /path/to/tami-cloud/monitor && /usr/bin/env npm run check >> monitor.log 2>&1
```

(Windows: use Task Scheduler with the same command; macOS: cron or launchd.)

## Statuses you'll see

| Status | Meaning | Notified? |
|---|---|---|
| `SLOTS_AVAILABLE` | Slots found — go book! | Every run, with screenshot |
| `NO_SLOTS` | Checked fine, nothing open | Never (silence = still watching) |
| `ANTIBOT_BLOCKED` | Cloudflare wall blocked the check | On change, then ~daily reminder |
| `CAPTCHA_REQUIRED` | CAPTCHA blocked the login | On change, then ~daily reminder |
| `LOGIN_FAILED` | Wrong password or login flow changed | On change, then ~daily reminder |
| `ERROR` | Unexpected failure (see screenshot) | On change, then ~daily reminder |

## Notes

- **Cadence:** every 2 hours is the configured default. To check more often, edit the cron in `.github/workflows/appointment-monitor.yml` (e.g. `'23 * * * *'` for hourly, `'*/30 * * * *'` for every 30 min). GitHub often delays scheduled runs by 5–15 minutes; if you truly need near-instant detection, run it locally on a tighter cron. Going below ~15 minutes raises the risk of the sites banning your account/IP.
- Credentials live only in GitHub Secrets / your local `.env` (git-ignored). Never commit them.
- Keep the cadence modest (every 2 h is fine). Hammering these sites gets accounts and IPs banned.
- These portals change their markup often. If you get repeated `ERROR` statuses, the selectors in `src/checkers/*.ts` likely need a small update — the screenshot artifact shows what the page looked like.
