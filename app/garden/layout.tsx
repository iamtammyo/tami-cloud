import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond } from "next/font/google";
import "./garden.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-garden-display",
});

const text = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-garden-text",
});

export const metadata: Metadata = {
  title: "The Digital Garden — a commonplace of growing thoughts",
  description:
    "Half-formed ideas planted in public, linked by theme rather than time, and tended as they grow.",
};

export default function GardenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`garden-root ${display.variable} ${text.variable}`}>
      {children}
    </div>
  );
}
