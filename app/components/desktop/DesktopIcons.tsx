import Link from "next/link";
import { apps, folders, trashFolder } from "@/content/desktop";
import { AppIcon, FolderIcon, TrashIcon } from "./FolderIcon";

function Icon({
  href,
  name,
  label,
  children,
}: {
  href: string;
  name: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="icon-btn flex w-[128px] flex-col items-center gap-2 px-2 pb-3 pt-3 text-center">
      {children}
      <span className="t-serif text-[19px] leading-tight">{name}</span>
      <span className="t-label whitespace-nowrap text-[var(--desk-muted)]">{label}</span>
    </Link>
  );
}

export default function DesktopIcons() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-11 bottom-0">
      <div className="pointer-events-auto mx-auto flex max-w-[1400px] flex-wrap gap-x-2 gap-y-6 px-4 pt-8 sm:px-6 md:max-w-[540px] md:ml-0 md:pl-8 md:pt-10">
        {folders.map((f) => (
          <Icon key={f.slug} href={`/${f.slug}`} name={f.name} label={`${f.label} · ${f.files.length}`}>
            <FolderIcon accent={f.accent} />
          </Icon>
        ))}
        {apps.map((a) => (
          <Icon key={a.slug} href={a.href} name={a.name} label={a.label}>
            <AppIcon />
          </Icon>
        ))}
      </div>
      <div className="pointer-events-auto absolute bottom-6 right-4 sm:right-8">
        <Icon href={`/${trashFolder.slug}`} name={trashFolder.name} label={`${trashFolder.files.length} ITEMS`}>
          <TrashIcon />
        </Icon>
      </div>
    </div>
  );
}
