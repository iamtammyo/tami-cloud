import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PacksScreen } from "./PacksScreen";

export const metadata: Metadata = { title: "Type packs · Pocket Press" };

export default function PacksPage() {
  return (
    <>
      <SiteHeader />
      <PacksScreen />
    </>
  );
}
