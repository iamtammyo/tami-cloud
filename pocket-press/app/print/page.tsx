"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { LinkButton } from "@/components/ui";
import { db } from "@/lib/db";
import { LAST_ZINE_KEY } from "@/lib/store";

/** "Print" in the nav: goes to the zine you had open last, if there is one. */
export default function PrintRedirect() {
  const router = useRouter();
  const [none, setNone] = useState(false);
  useEffect(() => {
    (async () => {
      let id: string | null = null;
      try {
        id = localStorage.getItem(LAST_ZINE_KEY);
      } catch {}
      const zine = id ? await db().zines.get(id) : (await db().zines.orderBy("updatedAt").reverse().first()) ?? undefined;
      if (zine) router.replace(`/print/${zine.id}`);
      else setNone(true);
    })();
  }, [router]);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 py-16 sm:px-8">
        {none ? (
          <div className="flex flex-col items-start gap-4">
            <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Nothing to print yet.</h1>
            <p className="text-muted">Make a zine first, then come back here for the print sheet.</p>
            <LinkButton href="/">New zine</LinkButton>
          </div>
        ) : (
          <p className="font-mono text-[13px] text-muted">Opening your last zine…</p>
        )}
      </main>
    </>
  );
}
