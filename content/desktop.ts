import type { DesktopApp, DesktopFile, Folder } from "./types";
import { readme } from "./folders/readme";
import { cameraRoll } from "./folders/camera-roll";
import { showingMyWork } from "./folders/showing-my-work";
import { onRecord } from "./folders/on-record";
import { workWithMe } from "./folders/work-with-me";
import { fieldNotes } from "./folders/field-notes";
import { trash } from "./folders/trash";

export { site, sticky } from "./site";
export { mediaKitChannels, mediaKitRates } from "./folders/work-with-me";

/** Order here is the order on the desktop. Add a folder: import it, list it. */
export const folders: Folder[] = [
  readme,
  cameraRoll,
  showingMyWork,
  onRecord,
  workWithMe,
  fieldNotes,
];

/** Trash sits apart from the other folders, bottom of the desktop. */
export const trashFolder: Folder = trash;

/** Apps are routes with their own UI, not folders of files. */
export const apps: DesktopApp[] = [
  {
    slug: "lensed",
    name: "Lensed",
    label: "APP",
    href: "/apps/lensed",
    blurb: "A photo critique workbench I built for myself.",
  },
];

export const allFolders: Folder[] = [...folders, trashFolder];

export function getFolder(slug: string): Folder | undefined {
  return allFolders.find((f) => f.slug === slug);
}

export function getFile(folderSlug: string, fileSlug: string): { folder: Folder; file: DesktopFile } | undefined {
  const folder = getFolder(folderSlug);
  if (!folder) return undefined;
  const file = folder.files.find((f) => f.slug === fileSlug);
  return file ? { folder, file } : undefined;
}
