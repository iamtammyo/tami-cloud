import type { Metadata } from "next";
import { FoldTest } from "./FoldTest";

export const metadata: Metadata = { title: "Fold test · Pocket Press" };

export default function FoldTestPage() {
  return <FoldTest />;
}
