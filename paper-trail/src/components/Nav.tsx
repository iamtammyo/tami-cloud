"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/deals", label: "Deals" },
  { href: "/invoices", label: "Invoices" },
  { href: "/brands", label: "Brands" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem("pt.theme") as "light" | "dark") || null;
    if (saved) {
      document.documentElement.setAttribute("data-theme", saved);
      setTheme(saved);
    }
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pt.theme", next);
    setTheme(next);
  }

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="border-line bg-surface md:sticky md:top-0 md:h-screen md:border-r">
      <div className="flex items-center justify-between px-5 py-5 md:block">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
            PT
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Paper Trail</span>
        </Link>
        <nav className="flex gap-1 md:mt-8 md:flex-col md:gap-0.5">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(l.href)
                  ? "bg-accent-soft font-medium text-accent"
                  : "text-muted hover:bg-ground hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        onClick={toggleTheme}
        className="text-muted hover:text-ink hidden px-5 py-2 text-xs md:absolute md:bottom-5 md:block"
      >
        {theme === "dark" ? "☾ Dark" : "☀ Light"} · toggle
      </button>
    </aside>
  );
}
