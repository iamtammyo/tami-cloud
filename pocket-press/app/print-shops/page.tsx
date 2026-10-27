import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Print shops · Pocket Press" };

const TIPS = [
  { title: "Ask for one-sided, actual size", body: "Say “no scaling”. Most copy shops will happily print a single PDF sheet at 100%." },
  { title: "Pick the paper size", body: "A3 gives you A6 pages, the size of a postcard. A4 gives A7 pages, palm-sized." },
  { title: "Thicker paper folds crisper", body: "Around 100–120gsm is the sweet spot. Card over 160gsm gets hard to fold into the plus shape." },
  { title: "Colour copiers are fine", body: "You don't need a photo printer. A laser colour copy looks great on a zine this size." },
  { title: "Print a few", body: "Mini zines are made for handing out. Copies of one sheet are cheap at any copy shop." },
];

export default function PrintShops() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-content px-4 pb-24 sm:px-8">
        <section className="pb-10 pt-12 sm:pt-16">
          <h1 className="max-w-[18ch] text-[40px] font-semibold leading-[1.04] tracking-[-0.035em] sm:text-[52px]">
            Printing at a shop
          </h1>
          <p className="mt-4 max-w-[56ch] text-[17px] text-muted">
            No home printer, or want it on A3? Any copy shop, library or office-supply store can print your sheet. Take
            the PDF on your phone or a USB stick and tell them this:
          </p>
        </section>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((t, i) => (
            <li key={t.title} className="rounded-[12px] border border-line p-4">
              <p className="font-mono text-[13px] text-muted">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-2 font-medium">{t.title}</p>
              <p className="mt-1 text-muted">{t.body}</p>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
