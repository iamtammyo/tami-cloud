import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = process.env.MONITOR_GITHUB_REPO || "iamtammyo/tami-cloud";
const WORKFLOW_FILE = "appointment-monitor.yml";

export async function POST(req: Request) {
  const expected = process.env.MONITOR_PASSCODE;
  if (!expected) {
    return NextResponse.json({ error: "MONITOR_PASSCODE is not set on the server." }, { status: 503 });
  }
  const given = req.headers.get("x-monitor-passcode") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }
  const token = process.env.MONITOR_GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "MONITOR_GITHUB_TOKEN is not set on the server." }, { status: 503 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // The workflow only exists on the default branch; dispatch against it.
  const repoRes = await fetch(`https://api.github.com/repos/${REPO}`, { headers, cache: "no-store" });
  const defaultBranch = repoRes.ok ? (await repoRes.json()).default_branch || "main" : "main";

  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: defaultBranch }),
  });

  if (res.status === 404) {
    return NextResponse.json(
      { error: `Workflow not found on ${defaultBranch} — merge the monitor PR first, then try again.` },
      { status: 404 },
    );
  }
  if (!res.ok) {
    return NextResponse.json({ error: `GitHub returned ${res.status}: ${await res.text()}` }, { status: 502 });
  }
  return NextResponse.json({ dispatched: true, branch: defaultBranch });
}
