export type CheckStatus =
  | 'SLOTS_AVAILABLE'   // appointment slots found — go book!
  | 'NO_SLOTS'          // checked successfully, nothing open
  | 'ANTIBOT_BLOCKED'   // Cloudflare / anti-bot wall stopped us before login
  | 'CAPTCHA_REQUIRED'  // a CAPTCHA we can't solve is blocking the flow
  | 'LOGIN_FAILED'      // credentials rejected or login form errored
  | 'ERROR';            // unexpected failure (site changed, timeout, etc.)

export interface CheckResult {
  site: 'vfs' | 'bls';
  siteLabel: string;
  status: CheckStatus;
  detail: string;
  screenshot?: string;
  checkedAt: string;
}

export interface SiteState {
  status: CheckStatus;
  detail: string;
  lastChange: string;
  lastChecked: string;
  consecutiveErrors: number;
}

export type MonitorState = Partial<Record<'vfs' | 'bls', SiteState>>;
