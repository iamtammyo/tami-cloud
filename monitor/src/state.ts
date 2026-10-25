import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import type { CheckResult, MonitorState, SiteState } from './types.js';

export function loadState(): MonitorState {
  try {
    return JSON.parse(fs.readFileSync(config.stateFile, 'utf8')) as MonitorState;
  } catch {
    return {};
  }
}

export function saveState(state: MonitorState): void {
  fs.mkdirSync(path.dirname(config.stateFile), { recursive: true });
  fs.writeFileSync(config.stateFile, JSON.stringify(state, null, 2));
}

/**
 * Notification policy:
 *  - SLOTS_AVAILABLE: notify on every run (you don't want to miss it).
 *  - NO_SLOTS: never notify.
 *  - blocked/captcha/login/error states: notify only when the state CHANGES
 *    into that status, or after every 12th consecutive failure (~once a day
 *    at a 2-hour cadence) so a silently broken monitor doesn't stay silent.
 */
export function shouldNotify(prev: SiteState | undefined, result: CheckResult, consecutiveErrors: number): boolean {
  if (result.status === 'SLOTS_AVAILABLE') return true;
  if (result.status === 'NO_SLOTS') return false;
  if (!prev || prev.status !== result.status) return true;
  return consecutiveErrors % 12 === 0;
}

export function updateState(state: MonitorState, result: CheckResult): SiteState {
  const prev = state[result.site];
  const isProblem = result.status !== 'NO_SLOTS' && result.status !== 'SLOTS_AVAILABLE';
  const next: SiteState = {
    status: result.status,
    detail: result.detail,
    lastChange: prev && prev.status === result.status ? prev.lastChange : result.checkedAt,
    lastChecked: result.checkedAt,
    consecutiveErrors: isProblem ? (prev?.consecutiveErrors || 0) + 1 : 0,
  };
  state[result.site] = next;
  return next;
}
