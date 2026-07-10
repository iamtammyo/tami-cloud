import fs from 'node:fs';
import { config, enabledSites } from './config.js';
import { launchBrowser } from './browser.js';
import { checkVfs } from './checkers/vfs.js';
import { checkBls } from './checkers/bls.js';
import { sendNotification } from './notify.js';
import { loadState, saveState, shouldNotify, updateState } from './state.js';
import type { CheckResult } from './types.js';

const STATUS_EMOJI: Record<CheckResult['status'], string> = {
  SLOTS_AVAILABLE: '🎉',
  NO_SLOTS: '😴',
  ANTIBOT_BLOCKED: '🧱',
  CAPTCHA_REQUIRED: '🤖',
  LOGIN_FAILED: '🔑',
  ERROR: '⚠️',
};

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--test-notify')) {
    await sendNotification({
      subject: '✅ Appointment monitor: test notification',
      body: 'If you can read this, your notification channel is working.',
    });
    return;
  }

  const requested = args.filter((a): a is 'vfs' | 'bls' => a === 'vfs' || a === 'bls');
  const available = enabledSites();
  const sites = requested.length ? requested : available;

  if (!sites.length) {
    console.error(
      'No sites to check. Set VFS_EMAIL/VFS_PASSWORD and/or BLS_EMAIL/BLS_PASSWORD (see monitor/.env.example).',
    );
    process.exitCode = 1;
    return;
  }
  for (const s of sites) {
    if (!available.includes(s)) {
      console.error(`Site "${s}" requested but its credentials are not set.`);
      process.exitCode = 1;
      return;
    }
  }

  fs.mkdirSync(config.artifactsDir, { recursive: true });
  const state = loadState();
  const browser = await launchBrowser();
  const results: CheckResult[] = [];

  try {
    // Sequential on purpose: keeps the traffic pattern human-ish.
    for (const site of sites) {
      console.log(`[monitor] checking ${site}...`);
      const result = site === 'vfs' ? await checkVfs(browser, config.artifactsDir) : await checkBls(browser, config.artifactsDir);
      results.push(result);
      console.log(`[monitor] ${site}: ${result.status} — ${result.detail}`);
    }
  } finally {
    await browser.close().catch(() => {});
  }

  for (const result of results) {
    const prev = state[result.site];
    const next = updateState(state, result);
    if (shouldNotify(prev, result, next.consecutiveErrors)) {
      const emoji = STATUS_EMOJI[result.status];
      await sendNotification({
        subject: `${emoji} ${result.siteLabel}: ${result.status.replaceAll('_', ' ')}`,
        body: `${result.detail}\n\nChecked at: ${result.checkedAt}`,
        screenshots: result.screenshot ? [result.screenshot] : [],
      });
    }
  }

  saveState(state);

  const summary = results.map((r) => `${r.site}=${r.status}`).join(' ');
  console.log(`[monitor] done: ${summary}`);
}

main().catch((err) => {
  console.error('[monitor] fatal:', err);
  process.exitCode = 1;
});
