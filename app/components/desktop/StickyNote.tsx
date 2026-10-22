import { sticky, site } from "@/content/site";

export default function StickyNote() {
  return (
    <aside
      className="sticky-note absolute right-5 top-24 hidden w-[230px] p-5 md:block lg:right-16 lg:top-28"
      aria-label="Sticky note"
    >
      <p className="t-label mb-2 text-[var(--desk-dusty)]">{sticky.title}</p>
      <ul className="t-hand space-y-1 text-[22px] text-[var(--desk-ink)]">
        {sticky.lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <p className="t-label mt-4 text-[var(--desk-muted)]">{site.handle}</p>
    </aside>
  );
}
