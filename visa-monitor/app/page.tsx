"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SecretInfo = { updatedAt: string };
type Status = {
  configured: boolean;
  reason?: string;
  repo?: string;
  secrets?: Record<string, SecretInfo>;
  variables?: Record<string, string>;
  lastRun?: { status: string; conclusion: string | null; url: string; startedAt: string } | null;
};

type Field = {
  name: string;
  label: string;
  kind: "secret" | "variable";
  type?: "password" | "text" | "email";
  hint?: string;
  placeholder?: string;
};

type Section = { title: string; blurb?: string; fields: Field[] };

const SECTIONS: Section[] = [
  {
    title: "VFS Portugal account",
    blurb: "Login for visa.vfsglobal.com (Nigeria → Portugal).",
    fields: [
      { name: "VFS_EMAIL", label: "Email", kind: "secret", type: "email" },
      { name: "VFS_PASSWORD", label: "Password", kind: "secret", type: "password" },
      { name: "VFS_CENTRE", label: "Application centre", kind: "variable", placeholder: "e.g. Lagos (blank = first option)" },
      { name: "VFS_CATEGORY", label: "Category", kind: "variable", placeholder: "default: Digital Nomad" },
      { name: "VFS_SUBCATEGORY", label: "Sub-category", kind: "variable", placeholder: "default: Digital Nomad" },
    ],
  },
  {
    title: "BLS Spain account",
    blurb: "Login for nigeria.blsspainglobal.com.",
    fields: [
      { name: "BLS_EMAIL", label: "Email", kind: "secret", type: "email" },
      { name: "BLS_PASSWORD", label: "Password", kind: "secret", type: "password" },
      { name: "BLS_VISA_TYPE", label: "Visa type", kind: "variable", placeholder: "default: Digital Nomad" },
    ],
  },
  {
    title: "Phone alerts",
    blurb:
      "Fill at least one channel. ntfy is the easiest: install the ntfy app, subscribe to a secret topic name, and enter the same topic here.",
    fields: [
      { name: "NTFY_TOPIC", label: "ntfy topic", kind: "secret", placeholder: "e.g. tami-visa-slots-x7k2m9" },
      { name: "TELEGRAM_BOT_TOKEN", label: "Telegram bot token", kind: "secret", type: "password" },
      { name: "TELEGRAM_CHAT_ID", label: "Telegram chat id", kind: "secret" },
      { name: "SMTP_USER", label: "Gmail address", kind: "secret", type: "email" },
      {
        name: "SMTP_PASS",
        label: "Gmail app password",
        kind: "secret",
        type: "password",
        hint: "Create one at myaccount.google.com/apppasswords (needs 2FA).",
      },
      { name: "NOTIFY_TO", label: "Send email alerts to", kind: "secret", type: "email", placeholder: "defaults to Gmail address" },
    ],
  },
  {
    title: "Proxy (optional)",
    blurb: "Residential proxy for the checker — GitHub's own IPs are often blocked by Cloudflare.",
    fields: [
      { name: "PROXY_SERVER", label: "Proxy server", kind: "secret", placeholder: "http://host:port" },
      { name: "PROXY_USERNAME", label: "Proxy username", kind: "secret" },
      { name: "PROXY_PASSWORD", label: "Proxy password", kind: "secret", type: "password" },
    ],
  },
];

export default function MonitorSettings() {
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("monitor.passcode");
    if (stored) setPasscode(stored);
  }, []);

  const headers = useMemo(
    () => ({ "x-monitor-passcode": passcode, "Content-Type": "application/json" }),
    [passcode],
  );

  const loadStatus = useCallback(async () => {
    setMessage(null);
    const res = await fetch("/api/settings", { headers });
    const data: Status & { error?: string } = await res.json();
    if (res.status === 401) {
      setUnlocked(false);
      setMessage({ kind: "err", text: "Wrong passcode." });
      return;
    }
    setUnlocked(true);
    localStorage.setItem("monitor.passcode", passcode);
    setStatus(data);
    if (data.variables) {
      setValues((prev) => ({ ...data.variables, ...prev }));
    }
  }, [headers, passcode]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const secrets: Record<string, string> = {};
      const variables: Record<string, string> = {};
      for (const section of SECTIONS) {
        for (const f of section.fields) {
          const v = values[f.name];
          if (v && v.trim()) (f.kind === "secret" ? secrets : variables)[f.name] = v.trim();
        }
      }
      const res = await fetch("/api/settings", { method: "POST", headers, body: JSON.stringify({ secrets, variables }) });
      const data = await res.json();
      if (!res.ok && res.status !== 207) {
        setMessage({ kind: "err", text: data.error || data.reason || `Save failed (${res.status}).` });
      } else {
        const failures = (data.failed || []).map((f: { name: string }) => f.name).join(", ");
        setMessage({
          kind: failures ? "err" : "ok",
          text: failures
            ? `Saved ${data.saved.length}, failed: ${failures}`
            : `Saved ${data.saved.length} setting${data.saved.length === 1 ? "" : "s"} to GitHub.`,
        });
        // Clear saved secret fields from the form; they now live only in GitHub.
        setValues((prev) => {
          const next = { ...prev };
          for (const name of data.saved || []) {
            const field = SECTIONS.flatMap((s) => s.fields).find((f) => f.name === name);
            if (field?.kind === "secret") delete next[name];
          }
          return next;
        });
        await loadStatus();
      }
    } catch (e) {
      setMessage({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  }

  async function runNow() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/run", { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) setMessage({ kind: "err", text: data.error || `Could not start a run (${res.status}).` });
      else setMessage({ kind: "ok", text: "Check started — any alert lands on your phone within a few minutes." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>🛂 Visa Slot Monitor</h1>
      <p className="subtitle">
        VFS Portugal &amp; BLS Spain · Digital Nomad appointments · automatic check every 2 hours. Everything you save
        here is written to encrypted GitHub Actions secrets — nothing is stored in this app, and saved passwords can
        never be read back (only replaced).
      </p>

      {!unlocked ? (
        <section className="card">
          <h2>Unlock</h2>
          <div className="row" style={{ marginTop: 14 }}>
            <input
              id="passcode"
              type="password"
              style={{ flex: 1, minWidth: 200 }}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadStatus()}
              placeholder="Passcode"
              aria-label="Passcode"
            />
            <button onClick={loadStatus}>Unlock</button>
          </div>
          {message && <p className="msg-err">{message.text}</p>}
        </section>
      ) : !status?.configured ? (
        <section className="card">
          <h2>One-time server setup needed</h2>
          <p className="msg-err" style={{ marginTop: 12 }}>
            {status?.reason}
          </p>
          <ol className="setup">
            <li>
              Create a fine-grained GitHub token at{" "}
              <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
                github.com/settings/personal-access-tokens/new
              </a>{" "}
              scoped to <b>only this repo</b> with <b>Secrets</b>, <b>Variables</b> and <b>Actions</b> read &amp; write
              permissions.
            </li>
            <li>
              Where this app is hosted (Vercel → Project → Settings → Environment Variables) add{" "}
              <code>MONITOR_GITHUB_TOKEN</code> (the token) and <code>MONITOR_PASSCODE</code> (any passphrase you
              choose), then redeploy.
            </li>
          </ol>
        </section>
      ) : (
        <>
          <section className="card">
            <div className="row">
              <h2 style={{ marginRight: 6 }}>Last check</h2>
              {status.lastRun ? (
                <>
                  <span
                    className={`led ${
                      status.lastRun.conclusion === "success" ? "ok" : status.lastRun.status === "completed" ? "err" : "pending"
                    }`}
                    aria-hidden
                  />
                  <span style={{ fontSize: 14, color: "var(--text-dim)" }}>
                    {status.lastRun.status === "completed" ? status.lastRun.conclusion : status.lastRun.status} ·{" "}
                    {new Date(status.lastRun.startedAt).toLocaleString()}
                  </span>
                  <a href={status.lastRun.url} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                    details
                  </a>
                </>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-faint)" }}>
                  no runs yet — save your details, then hit “Run check now”
                </span>
              )}
              <button style={{ marginLeft: "auto" }} onClick={runNow} disabled={busy}>
                Run check now
              </button>
            </div>
          </section>

          {SECTIONS.map((section) => (
            <section key={section.title} className="card">
              <h2>{section.title}</h2>
              {section.blurb && <p className="blurb">{section.blurb}</p>}
              <div className="grid">
                {section.fields.map((f) => {
                  const savedInfo = f.kind === "secret" ? status.secrets?.[f.name] : undefined;
                  return (
                    <div key={f.name}>
                      <label htmlFor={f.name}>
                        {f.label}
                        {savedInfo && (
                          <span className="saved-badge">✓ saved {new Date(savedInfo.updatedAt).toLocaleDateString()}</span>
                        )}
                      </label>
                      <input
                        id={f.name}
                        type={f.type || "text"}
                        autoComplete="off"
                        value={values[f.name] || ""}
                        onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                        placeholder={savedInfo ? "leave blank to keep current" : f.placeholder || ""}
                      />
                      {f.hint && <p className="hint">{f.hint}</p>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="row" style={{ marginTop: 24 }}>
            <button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save to GitHub"}
            </button>
            {message && <p className={message.kind === "ok" ? "msg-ok" : "msg-err"}>{message.text}</p>}
          </div>
          <p className="footnote">
            Repo: {status.repo} · Only filled-in fields are saved; blank fields keep their current value. Alerts fire
            the moment Digital Nomad slots open on either portal.
          </p>
        </>
      )}
    </main>
  );
}
