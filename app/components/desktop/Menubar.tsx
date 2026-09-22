import Link from "next/link";
import { site } from "@/content/site";
import Clock from "./Clock";
import Breadcrumb from "./Breadcrumb";

export default function Menubar() {
  return (
    <header className="menubar sticky top-0 z-40">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="t-serif shrink-0 text-[19px] leading-none">
          {site.name}
        </Link>
        <span className="t-label hidden text-[var(--desk-muted)] md:inline">{site.descriptor}</span>
        <span className="hidden h-4 w-px bg-[var(--desk-line-strong)] sm:block" aria-hidden />
        <div className="min-w-0 flex-1">
          <Breadcrumb />
        </div>
        <Link
          href="/work-with-me"
          className="hidden items-center gap-2 rounded-full border border-[var(--desk-line-strong)] px-3 py-1 text-[11px] font-medium hover:bg-white/60 sm:inline-flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--desk-dusty)]" aria-hidden />
          {site.status}
        </Link>
        <Clock timezone={site.timezone} city={site.city} />
      </div>
    </header>
  );
}
