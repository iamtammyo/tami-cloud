// Supabase client factory. Paper Trail runs local-first by default; when
// NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are set and NEXT_PUBLIC_DATA_BACKEND=supabase,
// a Supabase-backed data adapter can implement the same mutators as src/lib/store.tsx.
import { createBrowserClient } from "@supabase/ssr";

export function isSupabaseEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_DATA_BACKEND === "supabase" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
