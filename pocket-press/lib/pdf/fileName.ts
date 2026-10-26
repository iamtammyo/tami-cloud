import type { Paper } from "../paper";

/** {zine-title}-{paper}-print.pdf */
export function printFileName(title: string, paper: Paper): string {
  const slug =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "zine";
  return `${slug}-${paper.id}-print.pdf`;
}
