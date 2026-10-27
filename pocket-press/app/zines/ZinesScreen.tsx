"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetUrlContext, type AssetUrlResolver } from "@/components/assetUrls";
import { LinkButton } from "@/components/ui";
import { ZinePage } from "@/components/ZinePage";
import { db } from "@/lib/db";
import { findPack } from "@/lib/packs";
import { SAMPLE_META, isSample, sampleUrl } from "@/lib/samples";
import type { AssetMeta, TypePack, Zine } from "@/lib/types";

export function ZinesScreen() {
  const [zines, setZines] = useState<Zine[] | null>(null);
  const [custom, setCustom] = useState<TypePack[]>([]);
  const [metas, setMetas] = useState<Record<string, AssetMeta>>(SAMPLE_META);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    let urls: string[] = [];
    (async () => {
      const list = await db().zines.orderBy("updatedAt").reverse().toArray();
      setCustom(await db().packs.toArray());
      // Only the covers are shown, so only load their photos.
      const ids = [...new Set(list.flatMap((z) => (z.pages[0]?.photos ?? []).filter(Boolean).map((p) => p!.assetId)))].filter((id) => !isSample(id));
      const assets = (await db().assets.bulkGet(ids)).filter(Boolean);
      const t: Record<string, string> = {};
      const m: Record<string, AssetMeta> = { ...SAMPLE_META };
      for (const a of assets) {
        if (!a) continue;
        const { blob, thumb, ...meta } = a;
        void blob;
        m[a.id] = meta;
        t[a.id] = URL.createObjectURL(thumb);
      }
      urls = Object.values(t);
      setMetas(m);
      setThumbs(t);
      setZines(list);
    })();
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const resolver = useMemo<AssetUrlResolver>(() => (id) => thumbs[id] ?? (isSample(id) ? sampleUrl(id) : undefined), [thumbs]);

  async function remove(z: Zine) {
    if (!confirm(`Delete “${z.title}”? Its photos are removed from this device too.`)) return;
    await db().assets.where("zineId").equals(z.id).delete();
    await db().zines.delete(z.id);
    setZines((list) => list?.filter((x) => x.id !== z.id) ?? null);
  }

  return (
    <AssetUrlContext.Provider value={resolver}>
      <main className="mx-auto max-w-content px-4 pb-24 sm:px-8">
        <section className="flex flex-wrap items-end justify-between gap-4 pb-8 pt-12 sm:pt-16">
          <div>
            <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">My zines</h1>
            <p className="mt-2 text-muted">Saved in this browser. Nothing leaves your device.</p>
          </div>
          <LinkButton href="/">New zine</LinkButton>
        </section>

        {zines === null ? (
          <p className="font-mono text-[13px] text-muted">Loading…</p>
        ) : zines.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-[12px] bg-surface p-8">
            <p className="text-[17px] font-medium">No zines yet.</p>
            <p className="text-muted">Start one from your camera roll. It takes about ten minutes.</p>
            <LinkButton href="/">Make your first zine</LinkButton>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {zines.map((z) => (
              <li key={z.id} className="flex flex-col gap-2">
                <Link href={`/editor/${z.id}`} className="block rounded-[6px] border border-line p-1 transition duration-150 ease-out hover:border-fg">
                  <ZinePage zine={z} pack={findPack(z.typePackId, custom)} assets={metas} n={1} variant="thumb" className="rounded-[3px]" />
                </Link>
                <div className="px-1">
                  <Link href={`/editor/${z.id}`} className="block truncate font-medium hover:underline">
                    {z.title}
                  </Link>
                  <p className="font-mono text-[11px] text-muted">
                    {new Date(z.updatedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {z.paper}
                  </p>
                  <div className="mt-1 flex gap-3 text-[13px]">
                    <Link href={`/print/${z.id}`} className="text-muted underline hover:text-fg">
                      Print
                    </Link>
                    <button type="button" onClick={() => remove(z)} className="text-muted underline hover:text-fg">
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AssetUrlContext.Provider>
  );
}
