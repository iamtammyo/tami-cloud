import Menubar from "@/app/components/desktop/Menubar";
import DesktopIcons from "@/app/components/desktop/DesktopIcons";
import { site } from "@/content/site";

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="desk" style={{ ["--wallpaper" as string]: `url(${site.wallpaper})` }}>
      <Menubar />
      <DesktopIcons />
      {children}
      <p className="t-label pointer-events-none fixed bottom-3 left-4 text-[var(--desk-muted)] sm:left-6">
        {site.handle} · {site.motto}
      </p>
    </div>
  );
}
