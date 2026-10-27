import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import "./zine-fonts.css";

export const metadata: Metadata = {
  title: "Pocket Press",
  description: "Turn camera-roll photos into a print-ready, foldable zine.",
};

// Applies a saved theme before first paint, so there's no flash. "system" leaves
// data-theme off and the prefers-color-scheme rules take over.
const themeScript = `try{var t=localStorage.getItem("pp-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans text-[15px] antialiased">{children}</body>
    </html>
  );
}
