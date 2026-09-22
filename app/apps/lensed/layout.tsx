import type { Metadata } from "next";
import "./lensed.css";

export const metadata: Metadata = {
  title: "Lensed · Tami Oladipo",
  description:
    "A workbench for amateur photographers. Upload your work, get a critique, and learn what you gravitate toward.",
};

const themeBootScript = `(function(){try{var t=localStorage.getItem('lensed.theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function LensedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lensed-root" data-theme="dark">
      <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      <div className="px-6 pt-4">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-400 hover:text-stone-200"
        >
          ← Back to desktop
        </a>
      </div>
      {children}
    </div>
  );
}
