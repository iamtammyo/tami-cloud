"use client";

import Link from "next/link";
import { isSupabaseEnabled } from "@/lib/supabase";

export default function LoginPage() {
  const supabase = isSupabaseEnabled();
  return (
    <div className="mx-auto max-w-sm py-16 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-accent text-lg font-bold text-white">PT</span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Paper Trail</h1>
      <p className="text-muted mt-1 text-sm">The paper trail behind every brand deal.</p>

      {supabase ? (
        <form className="mt-8 space-y-3">
          <input className="input" type="email" placeholder="you@example.com" />
          <button className="btn btn-primary w-full justify-center" type="submit">Send magic link</button>
          <p className="text-muted text-xs">Passwordless sign-in via Supabase.</p>
        </form>
      ) : (
        <div className="card mt-8 px-5 py-6 text-left">
          <p className="text-sm">
            Running in <span className="font-medium">local mode</span> — your data lives in this browser, no sign-in needed.
          </p>
          <p className="text-muted mt-2 text-xs">
            To enable Supabase magic-link auth, set <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>NEXT_PUBLIC_DATA_BACKEND=supabase</code>.
          </p>
          <Link href="/" className="btn btn-primary mt-4 w-full justify-center">Open Paper Trail →</Link>
        </div>
      )}
    </div>
  );
}
