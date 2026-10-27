import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = { title: "Editor · Pocket Press" };

export default function EditorPage({ params }: { params: { id: string } }) {
  return <Editor id={params.id} />;
}
