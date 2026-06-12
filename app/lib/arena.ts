"use client";

import { useEffect, useState } from "react";

export type ArenaChannelInfo = {
  title: string;
  url: string;
  length: number;
  user: string;
  thumbs: string[];
};

/** Best-matching Are.na channel for a photographer, or null. */
export function useArenaChannel(
  name: string,
  enabled: boolean,
): ArenaChannelInfo | null {
  const [channel, setChannel] = useState<ArenaChannelInfo | null>(null);

  useEffect(() => {
    if (!enabled || !name) return;
    let cancelled = false;
    setChannel(null);
    fetch(`/api/arena?mode=match&q=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { channel?: ArenaChannelInfo | null } | null) => {
        if (!cancelled) setChannel(d?.channel ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [name, enabled]);

  return channel;
}

export type ArenaDiscovery = {
  channels: ArenaChannelInfo[] | null;
  needsToken: boolean;
};

/** Channels for a set of taste queries, merged and deduped. */
export function useArenaDiscovery(queries: string[] | null): ArenaDiscovery {
  const [state, setState] = useState<ArenaDiscovery>({
    channels: null,
    needsToken: false,
  });
  const key = queries?.join("|") ?? "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    type Resp = { channels?: ArenaChannelInfo[]; needsToken?: boolean };
    Promise.all(
      key.split("|").map((q) =>
        fetch(`/api/arena?mode=channels&q=${encodeURIComponent(q)}`)
          .then((r) => (r.ok ? (r.json() as Promise<Resp>) : ({ channels: [] } as Resp)))
          .catch(() => ({ channels: [] }) as Resp),
      ),
    ).then((results) => {
      if (cancelled) return;
      const seen = new Set<string>();
      const merged: ArenaChannelInfo[] = [];
      let needsToken = false;
      for (const r of results) {
        if (r.needsToken) needsToken = true;
        for (const c of r.channels ?? []) {
          if (!seen.has(c.url)) {
            seen.add(c.url);
            merged.push(c);
          }
        }
      }
      setState({ channels: merged.slice(0, 6), needsToken });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return state;
}
