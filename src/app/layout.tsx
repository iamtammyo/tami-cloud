import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Tami Cloud — Post Template Generator",
  description: "Generate content templates from your successful social media posts using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        <div className="pl-64">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
