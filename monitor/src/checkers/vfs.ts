import path from 'node:path';
import type { Browser, Page } from 'playwright';
import { config } from '../config.js';
import { newContext, isAntibotWall, waitOutAntibot, pageText } from '../browser.js';
import type { CheckResult } from '../types.js';

const NO_SLOT_MARKERS = [
  'no appointment slots are currently available',
  'currently no slots are available',
  'no slots available',
  'sorry, all appointments',
];

const SLOT_MARKERS = ['earliest available slot', 'slots are available', 'appointment slots are available'];

export async function checkVfs(browser: Browser, screenshotDir: string): Promise<CheckResult> {
  const base = {
    site: 'vfs' as const,
    siteLabel: config.vfs.label,
    checkedAt: new Date().toISOString(),
  };
  const context = await newContext(browser);
  const page = await context.newPage();
  const shot = path.join(screenshotDir, 'vfs.png');

  const capture = async () => {
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    return shot;
  };

  try {
    await page.goto(config.vfs.loginUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5_000);

    if (await waitOutAntibot(page)) {
      return {
        ...base,
        status: 'ANTIBOT_BLOCKED',
        detail: 'Cloudflare anti-bot wall on the VFS login page did not clear. This runner IP is likely blocked — see README for options (run locally or via a residential proxy).',
        screenshot: await capture(),
      };
    }

    // Dismiss cookie banner if present.
    await page
      .locator('button', { hasText: /accept all|allow all|agree/i })
      .first()
      .click({ timeout: 5_000 })
      .catch(() => {});

    // Login form (Angular app: email + password inputs).
    const email = page.locator('input[type="email"], input#email, input[formcontrolname="username"]').first();
    const password = page.locator('input[type="password"]').first();
    await email.waitFor({ state: 'visible', timeout: 30_000 });
    await email.fill(config.vfs.email);
    await password.fill(config.vfs.password);

    const signIn = page.locator('button', { hasText: /sign in/i }).first();
    await signIn.click();
    await page.waitForTimeout(8_000);

    if (await isAntibotWall(page)) {
      return {
        ...base,
        status: 'ANTIBOT_BLOCKED',
        detail: 'Cloudflare challenge appeared after submitting VFS login.',
        screenshot: await capture(),
      };
    }

    let text = await pageText(page);
    if (text.includes('invalid') && (text.includes('password') || text.includes('credential'))) {
      return {
        ...base,
        status: 'LOGIN_FAILED',
        detail: 'VFS rejected the credentials. Check VFS_EMAIL / VFS_PASSWORD.',
        screenshot: await capture(),
      };
    }
    if (text.includes('captcha') || (await page.locator('iframe[src*="turnstile"], iframe[src*="captcha"]').count()) > 0) {
      const stillBlocked = await waitOutAntibot(page, 20_000);
      if (stillBlocked || !(await loggedIn(page))) {
        return {
          ...base,
          status: 'CAPTCHA_REQUIRED',
          detail: 'A CAPTCHA is blocking the VFS login flow.',
          screenshot: await capture(),
        };
      }
    }

    if (!(await loggedIn(page))) {
      return {
        ...base,
        status: 'LOGIN_FAILED',
        detail: 'Could not reach the VFS dashboard after login (no "Start New Booking" button found).',
        screenshot: await capture(),
      };
    }

    // Start a new booking to reach the slot-availability screen.
    await page.locator('button, a', { hasText: /start new booking/i }).first().click();
    await page.waitForTimeout(6_000);

    // The booking page has up to three mat-select dropdowns:
    // application centre, appointment category, sub-category.
    // hasText matching is a case-insensitive substring, so "Digital Nomad"
    // matches e.g. "National Visa D8 - Digital Nomad".
    const choices = [config.vfs.centre, config.vfs.category, config.vfs.subcategory];
    const dropdowns = page.locator('mat-select');
    const count = await dropdowns.count();
    for (let i = 0; i < count; i++) {
      const dd = dropdowns.nth(i);
      if (!(await dd.isVisible().catch(() => false))) continue;
      await dd.click();
      await page.waitForTimeout(1_500);
      const wanted = choices[i];
      let option = wanted ? page.locator('mat-option', { hasText: wanted }).first() : page.locator('mat-option').first();
      if (wanted && (await option.count()) === 0) {
        console.warn(`[vfs] no dropdown option matching "${wanted}" — falling back to first option`);
        option = page.locator('mat-option').first();
      }
      if ((await option.count()) === 0) {
        await page.keyboard.press('Escape');
        continue;
      }
      await option.click();
      // Selecting a value triggers an availability request; give it time.
      await page.waitForTimeout(4_000);
    }
    await page.waitForTimeout(4_000);

    text = await pageText(page);
    const screenshot = await capture();

    if (SLOT_MARKERS.some((m) => text.includes(m))) {
      const snippet = extractSnippet(text, SLOT_MARKERS);
      return {
        ...base,
        status: 'SLOTS_AVAILABLE',
        detail: `VFS is showing availability: "${snippet}" — log in and book now: ${config.vfs.loginUrl}`,
        screenshot,
      };
    }
    if (NO_SLOT_MARKERS.some((m) => text.includes(m))) {
      return { ...base, status: 'NO_SLOTS', detail: 'VFS reports no appointment slots available.', screenshot };
    }
    return {
      ...base,
      status: 'ERROR',
      detail:
        'Reached the VFS booking page but could not find a recognizable availability message — the page layout may have changed, or the dropdown selections need configuring (VFS_CENTRE / VFS_CATEGORY / VFS_SUBCATEGORY). See screenshot.',
      screenshot,
    };
  } catch (err) {
    return {
      ...base,
      status: 'ERROR',
      detail: `VFS check failed: ${err instanceof Error ? err.message : String(err)}`,
      screenshot: await capture(),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

async function loggedIn(page: Page): Promise<boolean> {
  return (
    (await page
      .locator('button, a', { hasText: /start new booking/i })
      .first()
      .isVisible()
      .catch(() => false)) || /dashboard/i.test(page.url())
  );
}

function extractSnippet(text: string, markers: string[]): string {
  for (const m of markers) {
    const i = text.indexOf(m);
    if (i >= 0) return text.slice(Math.max(0, i - 40), i + m.length + 60).trim();
  }
  return markers[0];
}
