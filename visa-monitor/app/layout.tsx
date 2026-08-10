import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visa Slot Monitor — VFS Portugal & BLS Spain",
  description:
    "Watches VFS Portugal and BLS Spain for Digital Nomad visa appointment slots and pushes an alert to your phone the moment one opens.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
