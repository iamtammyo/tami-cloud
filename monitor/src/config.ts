import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monitorRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const config = {
  monitorRoot,
  artifactsDir: process.env.ARTIFACTS_DIR || path.join(monitorRoot, 'artifacts'),
  stateFile: process.env.STATE_FILE || path.join(monitorRoot, '.state', 'state.json'),
  headless: process.env.HEADFUL !== '1',
  navTimeoutMs: Number(process.env.NAV_TIMEOUT_MS || 60_000),

  vfs: {
    label: 'VFS Global — Portugal visa (Nigeria)',
    loginUrl: process.env.VFS_LOGIN_URL || 'https://visa.vfsglobal.com/nga/en/prt/login',
    email: process.env.VFS_EMAIL || '',
    password: process.env.VFS_PASSWORD || '',
    // Visible text (substring, case-insensitive) of the dropdown options on the
    // booking page. Centre defaults to the first option; category/subcategory
    // default to the Digital Nomad visa, falling back to the first option if
    // no matching entry exists in that dropdown.
    centre: process.env.VFS_CENTRE || '',
    category: process.env.VFS_CATEGORY || 'Digital Nomad',
    subcategory: process.env.VFS_SUBCATEGORY || 'Digital Nomad',
  },

  bls: {
    label: 'BLS Spain visa (Nigeria)',
    loginUrl:
      process.env.BLS_LOGIN_URL ||
      'https://nigeria.blsspainglobal.com/Global/Account/LogIn?ReturnUrl=%2FGlobal%2Fbls%2Fvisatypeverification',
    email: process.env.BLS_EMAIL || '',
    password: process.env.BLS_PASSWORD || '',
    // Substring (case-insensitive) matched against the visa-type dropdowns.
    visaType: process.env.BLS_VISA_TYPE || 'Digital Nomad',
  },

  notify: {
    // ntfy.sh — simplest phone push: install the ntfy app, subscribe to your
    // topic, set NTFY_TOPIC to the same value.
    ntfyTopic: process.env.NTFY_TOPIC || '',
    ntfyServer: process.env.NTFY_SERVER || 'https://ntfy.sh',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: Number(process.env.SMTP_PORT || 465),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    emailTo: process.env.NOTIFY_TO || process.env.SMTP_USER || '',
  },

  // Optional residential/ISP proxy — datacenter IPs (like GitHub-hosted runners)
  // are frequently blocked by Cloudflare on these sites.
  proxy: {
    server: process.env.PROXY_SERVER || '',
    username: process.env.PROXY_USERNAME || '',
    password: process.env.PROXY_PASSWORD || '',
  },
};

export function enabledSites(): Array<'vfs' | 'bls'> {
  const sites: Array<'vfs' | 'bls'> = [];
  if (config.vfs.email && config.vfs.password) sites.push('vfs');
  if (config.bls.email && config.bls.password) sites.push('bls');
  return sites;
}
