import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Window from "@/app/components/desktop/Window";
import MediaKit from "@/app/components/desktop/MediaKit";
import { FileList, FolderHeader, GardenView, PhotoGrid } from "@/app/components/desktop/views";
import { allFolders, getFolder } from "@/content/desktop";
import { site } from "@/content/site";

export function generateStaticParams() {
  return allFolders.map((f) => ({ folder: f.slug }));
}

export function generateMetadata({ params }: { params: { folder: string } }): Metadata {
  const folder = getFolder(params.folder);
  return folder ? { title: `${folder.name} · ${site.name}`, description: folder.blurb } : {};
}

export default function FolderPage({ params }: { params: { folder: string } }) {
  const folder = getFolder(params.folder);
  if (!folder) notFound();

  return (
    <Window folder={folder}>
      <FolderHeader folder={folder} />
      {folder.view === "grid" && <PhotoGrid folder={folder} />}
      {folder.view === "garden" && <GardenView folder={folder} />}
      {folder.view === "mediakit" && <MediaKit folder={folder} />}
      {folder.view === "list" && <FileList folder={folder} strike={folder.slug === "trash"} />}
    </Window>
  );
}
