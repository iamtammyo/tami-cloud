"use client";

import { Tag, fieldClass } from "@/components/ui";
import { layoutSpec } from "@/lib/layouts";
import { pageNum } from "@/lib/render/page";
import { useZine } from "@/lib/store";

/** Inline text for the selected page: caption fields, note text, or the title on cover and back. */
export function PageFields() {
  const zine = useZine((s) => s.zine)!;
  const pos = useZine((s) => s.selected.page);
  const setCaption = useZine((s) => s.setCaption);
  const resetCaption = useZine((s) => s.resetCaption);
  const setBody = useZine((s) => s.setBody);
  const setTitle = useZine((s) => s.setTitle);
  const page = zine.pages[pos];
  const L = layoutSpec(page.layout);

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
      {L.title ? (
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">Title</span>
          <input className={fieldClass} value={zine.title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      ) : null}

      {L.body ? (
        <label className="flex flex-col gap-1">
          <span className="text-[13px] text-muted">Note</span>
          <textarea
            className={`${fieldClass} h-28 resize-y py-2`}
            value={page.body ?? ""}
            placeholder="A few lines about the trip. It's set big, so keep it short."
            onChange={(e) => setBody(pos, e.target.value)}
          />
        </label>
      ) : null}

      {L.captions.length ? (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 flex w-full items-center justify-between text-[13px] text-muted">
            <span>Caption</span>
            {page.caption?.auto === false ? (
              <button type="button" onClick={() => resetCaption(pos)} className="text-[13px] text-muted underline hover:text-fg">
                Back to auto
              </button>
            ) : zine.autoCaptions ? (
              <Tag>auto</Tag>
            ) : null}
          </legend>
          <div className="grid grid-cols-[auto_1fr_120px] items-center gap-2">
            <span className="font-mono text-[13px] text-muted" aria-label={`Page number ${pageNum(page.index)}`}>
              {pageNum(page.index)}
            </span>
            <input
              aria-label="Caption location"
              className={fieldClass}
              placeholder="Location"
              value={page.caption?.location ?? ""}
              onChange={(e) => setCaption(pos, { location: e.target.value })}
            />
            <input
              aria-label="Caption date"
              className={`${fieldClass} font-mono text-[13px]`}
              placeholder="DD.MM.YY"
              value={page.caption?.date ?? ""}
              onChange={(e) => setCaption(pos, { date: e.target.value })}
            />
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
