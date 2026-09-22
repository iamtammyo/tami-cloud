import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: `${site.name} · desktop`,
  description: `${site.name}. Writer, creator, and photographer. Everything in one place, arranged like a desktop.`,
  metadataBase: new URL("https://tami.cloud"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
