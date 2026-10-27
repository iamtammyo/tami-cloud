import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { ZinesScreen } from "./ZinesScreen";

export const metadata: Metadata = { title: "My zines · Pocket Press" };

export default function ZinesPage() {
  return (
    <>
      <SiteHeader />
      <ZinesScreen />
    </>
  );
}
