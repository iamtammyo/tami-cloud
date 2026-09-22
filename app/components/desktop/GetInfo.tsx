import type { DesktopFile, Folder } from "@/content/types";
import { FileGlyph } from "./FolderIcon";

function fmtDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2 py-1.5 text-[12px]">
      <dt className="t-label pt-0.5 text-[var(--desk-muted)]">{k}</dt>
      <dd className="break-words text-[var(--desk-ink)]">{v}</dd>
    </div>
  );
}

export default function GetInfo({ folder, file }: { folder: Folder; file?: DesktopFile }) {
  const kindLabel: Record<string, string> = {
    note: "Note",
    photo: "Photograph",
    article: "Published writing",
    embed: "Social",
    deal: "Partnership",
  };

  return (
    <div className="px-4 py-4 md:px-5 md:py-5">
      <p className="t-label mb-3 text-[var(--desk-muted)]">Get info</p>
      {file ? (
        <>
          <div className="mb-3 flex items-start gap-3">
            <FileGlyph kind={file.kind} />
            <div className="min-w-0">
              <p className="t-serif text-[18px] leading-tight">{file.title}</p>
              <p className="text-[11px] text-[var(--desk-muted)]">{kindLabel[file.kind] ?? file.kind}</p>
            </div>
          </div>
          <dl className="divide-y divide-[var(--desk-line)] border-y border-[var(--desk-line)]">
            <Row k="In" v={folder.name} />
            {file.date && <Row k="Date" v={fmtDate(file.date)!} />}
            {file.publisher && <Row k="Published" v={file.publisher} />}
            {file.photo?.camera && <Row k="Camera" v={file.photo.camera} />}
            {file.photo?.lens && <Row k="Lens" v={file.photo.lens} />}
            {file.photo?.settings && <Row k="Settings" v={file.photo.settings} />}
            {file.photo?.location && <Row k="Where" v={file.photo.location} />}
            {file.info && Object.entries(file.info).map(([k, v]) => <Row key={k} k={k} v={v} />)}
            {file.tags && file.tags.length > 0 && <Row k="Tags" v={file.tags.join(", ")} />}
            {file.links && file.links.length > 0 && <Row k="Linked" v={`${file.links.length} notes`} />}
          </dl>
          {file.url && (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--desk-ink)] px-3 py-2 text-[12px] font-medium text-[var(--desk-cream)] hover:bg-[var(--desk-ink-2)]"
            >
              Open original ↗
            </a>
          )}
        </>
      ) : (
        <>
          <p className="t-serif mb-1 text-[18px] leading-tight">{folder.name}</p>
          <p className="mb-3 text-[12px] text-[var(--desk-muted)]">Folder</p>
          <dl className="divide-y divide-[var(--desk-line)] border-y border-[var(--desk-line)]">
            <Row k="Items" v={String(folder.files.length)} />
            <Row k="Kind" v={folder.label.charAt(0) + folder.label.slice(1).toLowerCase()} />
            <Row k="View" v={folder.view} />
          </dl>
          <p className="t-body mt-4 text-[13px]">{folder.blurb}</p>
        </>
      )}
    </div>
  );
}
