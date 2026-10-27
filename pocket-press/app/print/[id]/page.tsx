import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { PrintScreen } from "./PrintScreen";

export const metadata: Metadata = { title: "Print · Pocket Press" };

export default function PrintPage({ params }: { params: { id: string } }) {
  return (
    <>
      <SiteHeader />
      <PrintScreen id={params.id} />
    </>
  );
}
