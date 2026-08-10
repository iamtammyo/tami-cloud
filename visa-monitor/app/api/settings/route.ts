import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createRequire } from "node:module";
import type _sodium from "libsodium-wrappers";

// libsodium-wrappers' ESM build is broken (missing libsodium.mjs); load the
// CommonJS build directly.
const sodium: typeof _sodium = createRequire(import.meta.url)("libsodium-wrappers");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.MONITOR_GITHUB_REPO || "iamtammyo/tami-cloud";
const WORKFLOW_FILE = "appointment-monitor.yml";

// Only these names may be written — the token can touch nothing else via this app.
const SECRET_NAMES = [
  "VFS_EMAIL",
  "VFS_PASSWORD",
  "BLS_EMAIL",
  "BLS_PASSWORD",
  "NTFY_TOPIC",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
  "SMTP_USER",
  "SMTP_PASS",
  "NOTIFY_TO",
  "PROXY_SERVER",
  "PROXY_USERNAME",
  "PROXY_PASSWORD",
] as const;

const VARIABLE_NAMES = ["VFS_CENTRE", "VFS_CATEGORY", "VFS_SUBCATEGORY", "BLS_VISA_TYPE"] as const;

function checkAuth(req: Request): NextResponse | null {
  const expected = process.env.MONITOR_PASSCODE;
  if (!expected) {
    return NextResponse.json(
      { configured: false, reason: "MONITOR_PASSCODE environment variable is not set on the server." },
      { status: 503 },
    );
  }
  const given = req.headers.get("x-monitor-passcode") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }
  return null;
}

async function gh(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.MONITOR_GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  const denied = checkAuth(req);
  if (denied) return denied;
  if (!process.env.MONITOR_GITHUB_TOKEN) {
    return NextResponse.json(
      { configured: false, reason: "MONITOR_GITHUB_TOKEN environment variable is not set on the server." },
      { status: 503 },
    );
  }

  const [secretsRes, variablesRes, runsRes] = await Promise.all([
    gh("/actions/secrets?per_page=100"),
    gh("/actions/variables?per_page=100"),
    gh(`/actions/workflows/${WORKFLOW_FILE}/runs?per_page=1`),
  ]);

  if ([401, 403, 404].includes(secretsRes.status)) {
    return NextResponse.json(
      {
        configured: false,
        reason: `GitHub API returned ${secretsRes.status} — check that MONITOR_GITHUB_TOKEN has Secrets, Variables and Actions read/write access to ${REPO}.`,
      },
      { status: 503 },
    );
  }

  const secretsJson = await secretsRes.json();
  const secrets: Record<string, { updatedAt: string }> = {};
  for (const s of secretsJson.secrets || []) {
    if ((SECRET_NAMES as readonly string[]).includes(s.name)) {
      secrets[s.name] = { updatedAt: s.updated_at };
    }
  }

  const variables: Record<string, string> = {};
  if (variablesRes.ok) {
    const variablesJson = await variablesRes.json();
    for (const v of variablesJson.variables || []) {
      if ((VARIABLE_NAMES as readonly string[]).includes(v.name)) variables[v.name] = v.value;
    }
  }

  let lastRun: { status: string; conclusion: string | null; url: string; startedAt: string } | null = null;
  if (runsRes.ok) {
    const runsJson = await runsRes.json();
    const run = runsJson.workflow_runs?.[0];
    if (run) {
      lastRun = { status: run.status, conclusion: run.conclusion, url: run.html_url, startedAt: run.run_started_at };
    }
  }

  return NextResponse.json({ configured: true, repo: REPO, secrets, variables, lastRun });
}

export async function POST(req: Request) {
  const denied = checkAuth(req);
  if (denied) return denied;
  if (!process.env.MONITOR_GITHUB_TOKEN) {
    return NextResponse.json(
      { configured: false, reason: "MONITOR_GITHUB_TOKEN environment variable is not set on the server." },
      { status: 503 },
    );
  }

  let body: { secrets?: Record<string, string>; variables?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const saved: string[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  const secretEntries = Object.entries(body.secrets || {}).filter(
    ([name, value]) =>
      (SECRET_NAMES as readonly string[]).includes(name) && typeof value === "string" && value.trim() !== "",
  );

  if (secretEntries.length > 0) {
    const keyRes = await gh("/actions/secrets/public-key");
    if (!keyRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch the repository public key (${keyRes.status}). Check the token's Secrets permission.` },
        { status: 502 },
      );
    }
    const { key, key_id } = await keyRes.json();
    await sodium.ready;
    const publicKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);

    for (const [name, value] of secretEntries) {
      const sealed = sodium.crypto_box_seal(sodium.from_string(value.trim()), publicKey);
      const res = await gh(`/actions/secrets/${name}`, {
        method: "PUT",
        body: JSON.stringify({
          encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
          key_id,
        }),
      });
      if (res.ok) saved.push(name);
      else failed.push({ name, error: `GitHub returned ${res.status}` });
    }
  }

  for (const [name, value] of Object.entries(body.variables || {})) {
    if (!(VARIABLE_NAMES as readonly string[]).includes(name) || typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed === "") continue;
    // Upsert: PATCH the existing variable, create it on 404.
    let res = await gh(`/actions/variables/${name}`, {
      method: "PATCH",
      body: JSON.stringify({ name, value: trimmed }),
    });
    if (res.status === 404) {
      res = await gh("/actions/variables", { method: "POST", body: JSON.stringify({ name, value: trimmed }) });
    }
    if (res.ok) saved.push(name);
    else failed.push({ name, error: `GitHub returned ${res.status}` });
  }

  return NextResponse.json({ saved, failed }, { status: failed.length ? 207 : 200 });
}
