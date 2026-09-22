import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Window from "@/app/components/desktop/Window";
import { FileBody } from "@/app/components/desktop/views";
import { allFolders, getFile } from "@/content/desktop";
import { site } from "@/content/site";

export function generateStaticParams() {
  return allFolders.flatMap((f) => f.files.map((file) => ({ folder: f.slug, file: file.slug })));
}

export function generateMetadata({ params }: { params: { folder: string; file: string } }): Metadata {
  const hit = getFile(params.folder, params.file);
  return hit ? { title: `${hit.file.title} · ${site.name}`, description: hit.file.summary } : {};
}

export default function FilePage({ params }: { params: { folder: string; file: string } }) {
  const hit = getFile(params.folder, params.file);
  if (!hit) notFound();

  return (
    <Window folder={hit.folder} file={hit.file}>
      <FileBody folder={hit.folder} file={hit.file} />
    </Window>
  );
}
