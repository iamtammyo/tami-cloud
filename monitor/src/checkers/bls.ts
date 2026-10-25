import path from 'node:path';
import type { Browser, Page } from 'playwright';
import { config } from '../config.js';
import { newContext, waitOutAntibot, pageText } from '../browser.js';
import type { CheckResult } from '../types.js';

const NO_SLOT_MARKERS = [
  'no appointment slots',
  'no slots available',
  'all appointments are booked',
  'appointments are not available',
  'slots are not available',
];

const SLOT_MARKERS = ['slots available', 'appointment slots are available', 'select appointment slot'];

export async function checkBls(browser: Browser, screenshotDir: string): Promise<CheckResult> {
  const base = {
    site: 'bls' as const,
    siteLabel: config.bls.label,
    checkedAt: new Date().toISOString(),
  };
  const context = await newContext(browser);
  const page = await context.newPage();
  const shot = path.join(screenshotDir, 'bls.png');

  const capture = async () => {
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    return shot;
  };

  try {
    await page.goto(config.bls.loginUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5_000);

    if (await waitOutAntibot(page)) {
      return {
        ...base,
        status: 'ANTIBOT_BLOCKED',
        detail: 'Anti-bot wall on the BLS login page did not clear. This runner IP is likely blocked.',
        screenshot: await capture(),
      };
    }

    // BLS renders decoy inputs; only interact with visible ones.
    const emailInput = page
      .locator('input[type="email"]:visible, input[id*="UserId" i]:visible, input[name*="UserId" i]:visible')
      .first();
    await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
    await emailInput.fill(config.bls.email);

    // Step 1 is usually email + "Verify" which then reveals a CAPTCHA.
    const verifyBtn = page.locator('button:visible, input[type="submit"]:visible', { hasText: /verify|continue|submit/i }).first();
    if (await verifyBtn.isVisible().catch(() => false)) {
      await verifyBtn.click();
      await page.waitForTimeout(6_000);
    }

    if (await hasBlsCaptcha(page)) {
      return {
        ...base,
        status: 'CAPTCHA_REQUIRED',
        detail:
          'BLS is showing its image/number CAPTCHA at login, which cannot be solved automatically. Log in manually when you get a slots alert from VFS, or check BLS by hand — the monitor will keep trying in case the CAPTCHA is intermittently absent.',
        screenshot: await capture(),
      };
    }

    const passwordInput = page.locator('input[type="password"]:visible').first();
    if (await passwordInput.isVisible().catch(() => false)) {
      await passwordInput.fill(config.bls.password);
      const loginBtn = page.locator('button:visible, input[type="submit"]:visible', { hasText: /log ?in|sign ?in|submit/i }).first();
      await loginBtn.click();
      await page.waitForTimeout(8_000);
    }

    if (await hasBlsCaptcha(page)) {
      return {
        ...base,
        status: 'CAPTCHA_REQUIRED',
        detail: 'BLS presented a CAPTCHA after the password step.',
        screenshot: await capture(),
      };
    }

    let text = await pageText(page);
    if (text.includes('invalid') && (text.includes('password') || text.includes('credential') || text.includes('user'))) {
      return {
        ...base,
        status: 'LOGIN_FAILED',
        detail: 'BLS rejected the credentials. Check BLS_EMAIL / BLS_PASSWORD.',
        screenshot: await capture(),
      };
    }

    // If login worked we should be on (or can reach) the visa type verification /
    // appointment page, which states whether slots are open.
    if (!page.url().toLowerCase().includes('visatype') && !text.includes('visa type')) {
      await page
        .goto(new URL('/Global/bls/visatypeverification', config.bls.loginUrl).toString(), {
          waitUntil: 'domcontentloaded',
        })
        .catch(() => {});
      await page.waitForTimeout(5_000);
      text = await pageText(page);
    }

    // On the visa-type page, choose the Digital Nomad option (substring,
    // case-insensitive) in every dropdown that has one, then submit.
    text = await selectVisaTypeAndSubmit(page, text);

    const screenshot = await capture();

    if (SLOT_MARKERS.some((m) => text.includes(m))) {
      return {
        ...base,
        status: 'SLOTS_AVAILABLE',
        detail: `BLS appears to have appointment slots — log in and book now: ${config.bls.loginUrl}`,
        screenshot,
      };
    }
    if (NO_SLOT_MARKERS.some((m) => text.includes(m))) {
      return { ...base, status: 'NO_SLOTS', detail: 'BLS reports no appointment slots available.', screenshot };
    }
    if (text.includes('log in') && text.includes('password')) {
      return {
        ...base,
        status: 'LOGIN_FAILED',
        detail: 'Still on the BLS login page after submitting — the multi-step login flow may have changed. See screenshot.',
        screenshot,
      };
    }
    return {
      ...base,
      status: 'ERROR',
      detail: 'Logged into BLS but could not find a recognizable availability message. See screenshot.',
      screenshot,
    };
  } catch (err) {
    return {
      ...base,
      status: 'ERROR',
      detail: `BLS check failed: ${err instanceof Error ? err.message : String(err)}`,
      screenshot: await capture(),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

/**
 * On the visa-type verification page, pick the configured visa type
 * (default "Digital Nomad") in any native <select> that offers it, pick the
 * first real option in the rest, submit, and return the resulting page text.
 */
async function selectVisaTypeAndSubmit(page: Page, currentText: string): Promise<string> {
  const wanted = config.bls.visaType.toLowerCase();
  const selects = page.locator('select:visible');
  const count = await selects.count().catch(() => 0);
  if (count === 0) return currentText;

  for (let i = 0; i < count; i++) {
    const sel = selects.nth(i);
    try {
      const labels: string[] = await sel.locator('option').allInnerTexts();
      const match = labels.find((l) => l.toLowerCase().includes(wanted));
      const fallback = labels.find((l) => l.trim() && !/select|choose/i.test(l));
      const pick = match ?? fallback;
      if (pick) {
        await sel.selectOption({ label: pick });
        if (!match) console.warn(`[bls] no option matching "${config.bls.visaType}" in dropdown ${i}; picked "${pick}"`);
        // Dropdowns cascade (visa type → sub type); let the next one populate.
        await page.waitForTimeout(2_500);
      }
    } catch {
      // Non-critical: keep going with whatever we could select.
    }
  }

  const submit = page.locator('button:visible, input[type="submit"]:visible', { hasText: /submit|continue|proceed|book/i }).first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click().catch(() => {});
    await page.waitForTimeout(6_000);
  }
  return pageText(page);
}

async function hasBlsCaptcha(page: Page): Promise<boolean> {
  const text = await pageText(page);
  if (text.includes('select all boxes with number') || text.includes('captcha')) return true;
  const captchaFrames = await page.locator('iframe[src*="captcha" i], div[id*="captcha" i]:visible, img[src*="captcha" i]:visible').count();
  return captchaFrames > 0;
}
