import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lensed — analyze your photos & find inspiration",
  description:
    "Upload your photography, get AI feedback, browse photographers by style, and learn what you gravitate toward.",
};

const themeBootScript = `(function(){try{var t=localStorage.getItem('lensed.theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
