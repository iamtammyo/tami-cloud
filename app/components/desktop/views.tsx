import Image from "next/image";
import Link from "next/link";
import type { DesktopFile, Folder } from "@/content/types";
import { FileGlyph } from "./FolderIcon";

export function FolderHeader({ folder }: { folder: Folder }) {
  return (
    <div className="mb-6 border-b border-[var(--desk-line)] pb-5">
      <p className="t-label mb-2 text-[var(--desk-dusty)]">{folder.label}</p>
      <h2 className="t-serif text-[34px] sm:text-[42px]">{folder.name}</h2>
      <p className="t-body mt-2 max-w-[60ch]">{folder.blurb}</p>
    </div>
  );
}

export function FileList({ folder, strike = false }: { folder: Folder; strike?: boolean }) {
  return (
    <ul className="border-t border-[var(--desk-line)]">
      {folder.files.map((f) => (
        <li key={f.slug}>
          <Link href={`/${folder.slug}/${f.slug}`} className="row flex items-start gap-3 px-2 py-3.5">
            <FileGlyph kind={f.kind} />
            <div className="min-w-0 flex-1">
              <p className={`t-serif text-[21px] leading-tight ${strike ? "line-through decoration-[var(--desk-brown-2)]" : ""}`}>
                {f.title}
              </p>
              {f.summary && <p className="t-body mt-0.5 text-[13.5px]">{f.summary}</p>}
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              {f.publisher && <p className="t-label text-[var(--desk-muted)]">{f.publisher}</p>}
              {f.date && <p className="mt-1 text-[11px] text-[var(--desk-muted)]">{f.date}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function PhotoGrid({ folder }: { folder: Folder }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {folder.files.map((f) =>
        f.image ? (
          <li key={f.slug}>
            <Link href={`/${folder.slug}/${f.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[var(--desk-paper-2)] ring-1 ring-[var(--desk-line)]">
                <Image
                  src={f.image.src}
                  alt={f.image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 30vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <p className="t-serif mt-2 text-[17px] leading-tight">{f.title}</p>
              {f.photo?.settings && <p className="t-label mt-1 text-[var(--desk-muted)]">{f.photo.settings}</p>}
            </Link>
          </li>
        ) : null,
      )}
    </ul>
  );
}

/** Notes arranged in a ring, lines for links. Simple on purpose. */
export function GardenMap({ folder, current }: { folder: Folder; current?: string }) {
  const notes = folder.files;
  const n = notes.length;
  const W = 640;
  const H = 400;
  const cx = W / 2;
  const cy = H / 2;
  const r = Math.min(W, H) / 2 - 56;
  const pos = new Map<string, { x: number; y: number }>();
  notes.forEach((f, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pos.set(f.slug, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  });
  const edges: [string, string][] = [];
  const seen = new Set<string>();
  notes.forEach((f) =>
    (f.links ?? []).forEach((to) => {
      if (!pos.has(to)) return;
      const key = [f.slug, to].sort().join("|");
      if (seen.has(key)) return;
      seen.add(key);
      edges.push([f.slug, to]);
    }),
  );

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Map of how the notes connect">
      {edges.map(([a, b]) => {
        const p = pos.get(a)!;
        const q = pos.get(b)!;
        const hot = current && (a === current || b === current);
        return (
          <line
            key={`${a}-${b}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke={hot ? "#5b7897" : "#b9ae97"}
            strokeWidth={hot ? 2 : 1}
            strokeOpacity={hot ? 0.9 : 0.6}
          />
        );
      })}
      {notes.map((f) => {
        const p = pos.get(f.slug)!;
        const hot = f.slug === current;
        const left = p.x < cx - 10;
        return (
          <Link key={f.slug} href={`/${folder.slug}/${f.slug}`}>
            <g className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r={hot ? 9 : 6} fill={hot ? "#16151a" : "#5b7897"} stroke="#faf7f0" strokeWidth="2" />
              <text
                x={p.x + (left ? -14 : 14)}
                y={p.y + 4}
                textAnchor={left ? "end" : "start"}
                fontFamily="var(--font-serif)"
                fontSize="16"
                fill="#16151a"
              >
                {f.title}
              </text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}

export function GardenView({ folder }: { folder: Folder }) {
  return (
    <>
      <div className="mb-6 rounded-lg border border-[var(--desk-line)] bg-white/50 p-3 sm:p-5">
        <p className="t-label mb-2 text-[var(--desk-muted)]">Connections</p>
        <GardenMap folder={folder} />
      </div>
      <FileList folder={folder} />
    </>
  );
}

export function FileBody({ folder, file }: { folder: Folder; file: DesktopFile }) {
  const related = (file.links ?? [])
    .map((s) => folder.files.find((f) => f.slug === s))
    .filter(Boolean) as DesktopFile[];

  return (
    <article>
      <p className="t-label mb-2 text-[var(--desk-dusty)]">
        {folder.label}
        {file.publisher ? ` · ${file.publisher}` : ""}
      </p>
      <h2 className="t-serif text-[34px] sm:text-[44px]">{file.title}</h2>
      {file.summary && <p className="t-serif mt-3 text-[20px] italic text-[var(--desk-ink-2)]">{file.summary}</p>}

      {file.image && (
        <div className="relative mt-6 overflow-hidden rounded-md ring-1 ring-[var(--desk-line)]">
          <Image
            src={file.image.src}
            alt={file.image.alt}
            width={file.image.width}
            height={file.image.height}
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-auto w-full"
            priority
          />
        </div>
      )}

      {file.embedUrl && (
        <div className="mt-6 overflow-hidden rounded-md ring-1 ring-[var(--desk-line)]">
          <iframe src={file.embedUrl} title={file.title} className="h-[600px] w-full bg-white" loading="lazy" />
        </div>
      )}

      {file.body && (
        <div className="t-body mt-6 max-w-[62ch] space-y-4 text-[16px]">
          {file.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {file.url && !file.embedUrl && (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-md border border-[var(--desk-ink)] px-4 py-2 text-[13px] font-medium hover:bg-[var(--desk-ink)] hover:text-[var(--desk-cream)]"
        >
          Open on {file.publisher ?? "the web"} ↗
        </a>
      )}

      {folder.view === "garden" && (
        <div className="mt-10 rounded-lg border border-[var(--desk-line)] bg-white/50 p-3 sm:p-5">
          <p className="t-label mb-2 text-[var(--desk-muted)]">Where this sits</p>
          <GardenMap folder={folder} current={file.slug} />
        </div>
      )}

      {related.length > 0 && (
        <div className="mt-8">
          <p className="t-label mb-2 text-[var(--desk-muted)]">Linked notes</p>
          <ul className="flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/${folder.slug}/${r.slug}`} className="inline-block rounded-full border border-[var(--desk-line-strong)] px-3 py-1 text-[13px] hover:bg-white">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
