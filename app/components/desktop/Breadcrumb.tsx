"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getFile, getFolder } from "@/content/desktop";

export default function Breadcrumb() {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);

  const crumbs: { href: string; label: string }[] = [{ href: "/", label: "Desktop" }];

  if (parts[0] === "apps") {
    crumbs.push({ href: pathname, label: parts[1] ?? "App" });
  } else if (parts[0]) {
    const folder = getFolder(parts[0]);
    if (folder) {
      crumbs.push({ href: `/${folder.slug}`, label: folder.name });
      if (parts[1]) {
        const hit = getFile(folder.slug, parts[1]);
        if (hit) crumbs.push({ href: `/${folder.slug}/${hit.file.slug}`, label: hit.file.title });
      }
    }
  }

  return (
    <nav aria-label="Path" className="flex min-w-0 items-center gap-1.5 text-[12px]">
      {crumbs.map((c, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={c.href} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <span className="text-[var(--desk-muted)]" aria-hidden>›</span>}
            {last ? (
              <span className="truncate font-medium" aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.href} className="truncate text-[var(--desk-muted)] hover:text-[var(--desk-ink)]">
                {c.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
