"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ZinePage } from "@/components/ZinePage";
import { currentPack, useZine } from "@/lib/store";

/** Eight thumbnails in reading order. Pages 2–7 drag to reorder; cover and back stay put. */
export function PageRail() {
  const zine = useZine((s) => s.zine)!;
  const last = zine.pages.length - 1;
  const ids = zine.pages.slice(1, last).map((_, i) => `page-${i + 1}`);
  return (
    <nav aria-label="Pages" className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
      <ol className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        <RailItem pos={0} fixed />
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {zine.pages.slice(1, last).map((_, i) => (
            <RailItem key={ids[i]} pos={i + 1} />
          ))}
        </SortableContext>
        <RailItem pos={last} fixed />
      </ol>
      <p className="mt-2 hidden text-[13px] text-muted lg:block">Drag pages 2–7 to reorder.</p>
    </nav>
  );
}

function RailItem({ pos, fixed = false }: { pos: number; fixed?: boolean }) {
  const zine = useZine((s) => s.zine)!;
  const pack = useZine(currentPack);
  const assets = useZine((s) => s.assets);
  const selected = useZine((s) => s.selected.page === pos);
  const select = useZine((s) => s.select);
  const sortable = useSortable({ id: `page-${pos}`, data: { type: "page", pos }, disabled: fixed });
  const drop = useDroppable({ id: `fixed-${pos}`, data: { type: "page", pos }, disabled: !fixed });
  const setRef = fixed ? drop.setNodeRef : sortable.setNodeRef;
  const isOver = fixed ? drop.isOver : sortable.isOver;
  const style = fixed ? undefined : { transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition };
  const n = pos + 1;
  const label = n === 1 ? "Cover" : n === zine.pages.length ? "Back" : String(n);

  return (
    <li ref={setRef} style={style} className={`w-20 shrink-0 lg:w-full ${sortable.isDragging ? "z-10 opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => select(pos)}
        aria-current={selected ? "page" : undefined}
        aria-label={`${label === "Cover" || label === "Back" ? label : `Page ${label}`}${fixed ? "" : ", drag to reorder"}`}
        {...(fixed ? {} : sortable.attributes)}
        {...(fixed ? {} : sortable.listeners)}
        className={`block w-full rounded-[6px] p-1 text-left transition duration-150 ease-out ${
          selected ? "border-[1.5px] border-fg" : isOver ? "border border-fg" : "border border-line hover:border-fg"
        } ${fixed ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"}`}
      >
        <ZinePage zine={zine} pack={pack} assets={assets} n={n} variant="thumb" className="rounded-[2px]" />
        <span className="mt-1 block text-center font-mono text-[11px] text-muted">{label}</span>
      </button>
    </li>
  );
}
