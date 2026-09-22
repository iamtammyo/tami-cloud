import Link from "next/link";
import { allFolders, apps } from "@/content/desktop";
import type { DesktopFile, Folder } from "@/content/types";
import { FolderIcon } from "./FolderIcon";
import GetInfo from "./GetInfo";

export default function Window({
  folder,
  file,
  children,
}: {
  folder: Folder;
  file?: DesktopFile;
  children: React.ReactNode;
}) {
  const closeHref = file ? `/${folder.slug}` : "/";
  const title = file ? file.title : folder.name;

  return (
    <div className="fixed inset-0 z-30 flex items-stretch justify-center md:items-center md:p-6 lg:p-10">
      <Link href="/" className="window-backdrop absolute inset-0" aria-label="Close window and return to desktop" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="window-title"
        className="window relative flex h-full w-full flex-col overflow-hidden md:h-[min(86vh,900px)] md:max-w-[1180px] md:rounded-xl"
      >
        <div className="window-titlebar flex h-11 shrink-0 items-center gap-3 px-3">
          <div className="flex items-center gap-1.5">
            <Link
              href={closeHref}
              className="group flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--desk-cream)]"
              aria-label={file ? "Back to folder" : "Close"}
              title={file ? "Back to folder" : "Close"}
            >
              <span className="text-[9px] leading-none text-[var(--desk-ink)] opacity-0 group-hover:opacity-100">×</span>
            </Link>
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--desk-blue)]" aria-hidden />
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--desk-brown-2)]" aria-hidden />
          </div>
          <h1 id="window-title" className="t-serif min-w-0 flex-1 truncate text-center text-[18px]">
            {title}
          </h1>
          <span className="t-label hidden text-[var(--desk-blue)] sm:inline">{folder.label}</span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav className="window-sidebar shrink-0 md:w-[200px]" aria-label="Folders">
            <div className="flex gap-1 overflow-x-auto px-2 py-2 md:flex-col md:overflow-visible md:px-3 md:py-4">
              <p className="t-label hidden px-2 pb-2 text-[var(--desk-muted)] md:block">Desktop</p>
              {allFolders.map((f) => {
                const active = f.slug === folder.slug;
                return (
                  <Link
                    key={f.slug}
                    href={`/${f.slug}`}
                    aria-current={active ? "page" : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] ${
                      active ? "bg-[rgba(183,205,230,0.5)] font-medium" : "hover:bg-white/60"
                    }`}
                  >
                    <FolderIcon accent={f.accent} size={20} />
                    <span className="whitespace-nowrap">{f.name}</span>
                  </Link>
                );
              })}
              <p className="t-label hidden px-2 pb-2 pt-4 text-[var(--desk-muted)] md:block">Apps</p>
              {apps.map((a) => (
                <Link key={a.slug} href={a.href} className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-white/60">
                  <span className="inline-block h-4 w-4 rounded-[4px] bg-[var(--desk-ink)]" aria-hidden />
                  <span className="whitespace-nowrap">{a.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="px-5 py-5 sm:px-8 sm:py-7">{children}</div>
            <div className="window-info border-t md:hidden" aria-label="Get info">
              <GetInfo folder={folder} file={file} />
            </div>
          </div>

          <aside className="window-info hidden shrink-0 overflow-y-auto md:block md:w-[260px]" aria-label="Get info">
            <GetInfo folder={folder} file={file} />
          </aside>
        </div>
      </section>
    </div>
  );
}
