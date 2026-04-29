const USER_AGENT = "substack-mcp/0.1 (+https://github.com/iamtammyo/tami-cloud)";

export interface ArchivePost {
  id: number;
  slug: string;
  title: string | null;
  subtitle: string | null;
  post_date: string;
  audience: string;
  type: string;
  canonical_url: string;
  description: string | null;
  cover_image: string | null;
  truncated_body_text: string | null;
  wordcount: number | null;
  reactions?: Record<string, number>;
}

export interface PostDetail extends ArchivePost {
  body_html: string | null;
  body_text?: string | null;
  publication_id?: number;
}

export interface PublicationMetadata {
  id?: number;
  name: string;
  subdomain: string;
  custom_domain: string | null;
  hostname: string;
  description?: string | null;
  author_name?: string | null;
  logo_url?: string | null;
}

/**
 * Resolve a user-supplied publication identifier to a base URL.
 * Accepts: "platformer", "platformer.substack.com", "https://www.platformer.news",
 * or any URL pointing at a Substack post/page.
 */
export function resolveBaseUrl(publication: string): string {
  const trimmed = publication.trim();
  if (!trimmed) throw new Error("publication is required");

  if (/^https?:\/\//i.test(trimmed)) {
    const u = new URL(trimmed);
    return `${u.protocol}//${u.host}`;
  }
  if (trimmed.includes(".")) {
    return `https://${trimmed.replace(/^\/+|\/+$/g, "")}`;
  }
  return `https://${trimmed}.substack.com`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 200)}` : ""}`);
  }
  return (await res.json()) as T;
}

export async function listPosts(
  publication: string,
  opts: { limit?: number; offset?: number; sort?: "new" | "top" } = {},
): Promise<ArchivePost[]> {
  const base = resolveBaseUrl(publication);
  const limit = clamp(opts.limit ?? 12, 1, 50);
  const offset = Math.max(0, opts.offset ?? 0);
  const sort = opts.sort ?? "new";
  const url = `${base}/api/v1/archive?sort=${sort}&search=&offset=${offset}&limit=${limit}`;
  const raw = await fetchJson<unknown[]>(url);
  return raw.map(normalizeArchivePost);
}

export async function getPost(input: { url?: string; publication?: string; slug?: string }): Promise<PostDetail> {
  let base: string;
  let slug: string;

  if (input.url) {
    const u = new URL(input.url);
    base = `${u.protocol}//${u.host}`;
    const match = u.pathname.match(/\/p\/([^/?#]+)/);
    if (!match) throw new Error(`Could not extract post slug from URL: ${input.url}`);
    slug = match[1];
  } else if (input.publication && input.slug) {
    base = resolveBaseUrl(input.publication);
    slug = input.slug;
  } else {
    throw new Error("Provide either { url } or { publication, slug }");
  }

  const raw = await fetchJson<Record<string, unknown>>(`${base}/api/v1/posts/${encodeURIComponent(slug)}`);
  return normalizePostDetail(raw);
}

/**
 * Substack does not expose a documented per-publication search endpoint, so we
 * page through the archive client-side and match against title/subtitle/description.
 */
export async function searchPosts(
  publication: string,
  query: string,
  opts: { limit?: number; maxScanned?: number } = {},
): Promise<ArchivePost[]> {
  const q = query.trim().toLowerCase();
  if (!q) throw new Error("query is required");
  const limit = clamp(opts.limit ?? 10, 1, 50);
  const maxScanned = clamp(opts.maxScanned ?? 200, 1, 500);
  const pageSize = 50;

  const matches: ArchivePost[] = [];
  for (let offset = 0; offset < maxScanned && matches.length < limit; offset += pageSize) {
    const page = await listPosts(publication, { limit: pageSize, offset });
    if (page.length === 0) break;
    for (const post of page) {
      const haystack = [post.title, post.subtitle, post.description, post.truncated_body_text]
        .filter(Boolean)
        .join(" \n ")
        .toLowerCase();
      if (haystack.includes(q)) {
        matches.push(post);
        if (matches.length >= limit) break;
      }
    }
    if (page.length < pageSize) break;
  }
  return matches;
}

export async function getPublicationMetadata(publication: string): Promise<PublicationMetadata> {
  const base = resolveBaseUrl(publication);
  const host = new URL(base).host;
  const subdomain = host.endsWith(".substack.com") ? host.replace(/\.substack\.com$/, "") : host;
  const customDomain = host.endsWith(".substack.com") ? null : host;

  // The first post in the archive carries publication info that we surface as metadata.
  // If the archive is empty we fall back to a minimal record.
  let firstPost: Record<string, unknown> | undefined;
  try {
    const raw = await fetchJson<Record<string, unknown>[]>(`${base}/api/v1/archive?sort=new&limit=1&offset=0`);
    firstPost = raw[0];
  } catch {
    firstPost = undefined;
  }

  const pubFromPost = firstPost && (firstPost["publication"] as Record<string, unknown> | undefined);
  return {
    id: pubFromPost && typeof pubFromPost["id"] === "number" ? (pubFromPost["id"] as number) : undefined,
    name: (pubFromPost?.["name"] as string | undefined) ?? subdomain,
    subdomain,
    custom_domain: customDomain,
    hostname: host,
    description: (pubFromPost?.["hero_text"] as string | undefined) ?? null,
    author_name: (pubFromPost?.["author_name"] as string | undefined) ?? null,
    logo_url: (pubFromPost?.["logo_url"] as string | undefined) ?? null,
  };
}

function normalizeArchivePost(raw: unknown): ArchivePost {
  const r = raw as Record<string, unknown>;
  return {
    id: r["id"] as number,
    slug: r["slug"] as string,
    title: (r["title"] as string | null) ?? null,
    subtitle: (r["subtitle"] as string | null) ?? null,
    post_date: r["post_date"] as string,
    audience: (r["audience"] as string) ?? "everyone",
    type: (r["type"] as string) ?? "newsletter",
    canonical_url: r["canonical_url"] as string,
    description: (r["description"] as string | null) ?? null,
    cover_image: (r["cover_image"] as string | null) ?? null,
    truncated_body_text: (r["truncated_body_text"] as string | null) ?? null,
    wordcount: (r["wordcount"] as number | null) ?? null,
    reactions: (r["reactions"] as Record<string, number> | undefined) ?? undefined,
  };
}

function normalizePostDetail(raw: Record<string, unknown>): PostDetail {
  return {
    ...normalizeArchivePost(raw),
    body_html: (raw["body_html"] as string | null) ?? null,
    body_text: (raw["body_text"] as string | null) ?? null,
    publication_id: (raw["publication_id"] as number | undefined) ?? undefined,
  };
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
