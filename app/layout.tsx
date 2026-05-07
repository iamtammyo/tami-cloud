import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lensed — analyze your photos & find inspiration",
  description:
    "Upload your photography, get AI feedback, browse photographers by style, and learn what you gravitate toward.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
