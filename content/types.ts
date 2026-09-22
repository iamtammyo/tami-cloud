/**
 * The site is a desktop. A desktop holds folders. Folders hold files.
 * Adding a section to the site means adding a folder to `content/desktop.ts`.
 * Adding a piece of work means adding a file to that folder.
 */

export type FileKind =
  | "note" // a piece of writing that lives on this site
  | "photo" // an image with camera metadata
  | "article" // writing published somewhere else
  | "embed" // a social post, embedded or linked
  | "deal"; // a brand partnership

export type Accent = "blue" | "dusty" | "brown" | "ink";

export type PhotoMeta = {
  camera?: string;
  lens?: string;
  settings?: string; // "35mm · f/2 · 1/125s · ISO 800"
  location?: string;
};

export type DesktopFile = {
  slug: string;
  title: string;
  kind: FileKind;
  /** ISO date, shown in Get Info and used for sorting. */
  date?: string;
  /** One line under the title in list views. */
  summary?: string;
  /** Paragraphs. Rendered in order. */
  body?: string[];
  /** Where it lives if it lives somewhere else. */
  url?: string;
  /** Who published it, who it was for. */
  publisher?: string;
  /** For photos and embeds with a preview. */
  image?: { src: string; alt: string; width: number; height: number };
  photo?: PhotoMeta;
  /** Set on embeds that support an iframe (Instagram post URL + "embed/", LinkedIn embed URL). */
  embedUrl?: string;
  /** Free-form rows for the Get Info panel. */
  info?: Record<string, string>;
  /** Field notes: slugs of related notes. Draws the connections graph. */
  links?: string[];
  tags?: string[];
};

export type FolderView = "list" | "grid" | "garden" | "mediakit";

export type Folder = {
  slug: string;
  /** Serif label under the icon, sentence case. */
  name: string;
  /** Tracked all-caps wayfinding label, e.g. "PHOTOGRAPHY". */
  label: string;
  /** One or two sentences at the top of the window. */
  blurb: string;
  view: FolderView;
  accent: Accent;
  files: DesktopFile[];
};

export type DesktopApp = {
  slug: string;
  name: string;
  label: string;
  href: string;
  blurb: string;
};

export type MediaKitRate = {
  deliverable: string;
  rate: string;
  note?: string;
};

export type MediaKitChannel = {
  /** Buffer channel id. Not a secret, but only useful with the token. */
  bufferChannelId: string;
  service: "linkedin" | "instagram" | "tiktok" | "substack" | "threads";
  handle: string;
  url: string;
  /** Manually kept. The Buffer API doesn't expose follower totals. */
  followers?: string;
  audienceNote?: string;
};
