"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/zines", label: "My zines" },
  { href: "/packs", label: "Type packs" },
  { href: "/print", label: "Print" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-content items-center gap-4 px-4 sm:gap-8 sm:px-8">
        <Link href="/" className="shrink-0 text-[17px] font-semibold tracking-[-0.02em]">
          pocket press
        </Link>
        <nav aria-label="Main" className="flex min-w-0 flex-1 gap-4 overflow-x-auto text-[15px] sm:gap-6">
          {NAV.map((n) => {
            const active = path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap transition duration-150 ease-out ${active ? "text-fg" : "text-muted hover:text-fg"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
        <Link
          href="/"
          className="hidden h-10 shrink-0 items-center rounded-full bg-inv-bg px-5 text-[15px] font-medium text-inv-fg transition duration-150 ease-out hover:opacity-90 sm:inline-flex"
        >
          New zine
        </Link>
      </div>
    </header>
  );
}
