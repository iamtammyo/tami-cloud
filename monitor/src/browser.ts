import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { config } from './config.js';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export async function launchBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: config.headless,
    // Point at a system Chromium when the Playwright-managed download isn't
    // available (e.g. sandboxes with a preinstalled browser).
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    ...(config.proxy.server
      ? {
          proxy: {
            server: config.proxy.server,
            username: config.proxy.username || undefined,
            password: config.proxy.password || undefined,
          },
        }
      : {}),
  });
}

export async function newContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1366, height: 768 },
    locale: 'en-NG',
    timezoneId: 'Africa/Lagos',
  });
  // Basic fingerprint softening; these sites check navigator.webdriver.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-NG', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
  });
  context.setDefaultTimeout(config.navTimeoutMs);
  context.setDefaultNavigationTimeout(config.navTimeoutMs);
  return context;
}

/** True when the page is stuck on a Cloudflare / anti-bot interstitial. */
export async function isAntibotWall(page: Page): Promise<boolean> {
  try {
    const title = (await page.title()).toLowerCase();
    if (title.includes('just a moment') || title.includes('attention required') || title.includes('access denied')) {
      return true;
    }
    const body = ((await page.locator('body').innerText({ timeout: 5_000 }).catch(() => '')) || '').toLowerCase();
    return (
      body.includes('verify you are human') ||
      body.includes('checking your browser') ||
      body.includes('enable javascript and cookies to continue') ||
      body.includes('you have been blocked')
    );
  } catch {
    return false;
  }
}

/** Give an anti-bot interstitial a chance to auto-clear, then report if it's still there. */
export async function waitOutAntibot(page: Page, maxMs = 30_000): Promise<boolean> {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    if (!(await isAntibotWall(page))) return false;
    await page.waitForTimeout(3_000);
  }
  return isAntibotWall(page);
}

export async function pageText(page: Page): Promise<string> {
  return ((await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '')) || '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}
