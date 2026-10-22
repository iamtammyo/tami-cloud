"use client";

import { useEffect, useState } from "react";

export default function Clock({ timezone, city }: { timezone: string; city: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    function tick() {
      try {
        setNow(
          new Intl.DateTimeFormat("en-GB", {
            timeZone: timezone,
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date()),
        );
      } catch {
        setNow(null);
      }
    }
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, [timezone]);

  return (
    <span className="tabular-nums" aria-label={`Current time in ${city}`}>
      <span className="t-label text-[var(--desk-muted)]">{city}</span>
      <span className="ml-2 text-[12px] font-medium">{now ?? "—"}</span>
    </span>
  );
}
