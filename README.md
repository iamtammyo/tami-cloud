# substack-mcp

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server for
public Substack publications. No auth required, no credentials stored.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_posts` | Recent posts from a publication's archive (`new` or `top`) |
| `get_post` | Full post (body_html) by URL or `(publication, slug)` |
| `search_posts` | Substring search across a publication's archive |
| `get_publication_metadata` | Name, subdomain, custom domain, author, description |

`publication` accepts a Substack subdomain (`platformer`), a full host
(`www.platformer.news`), or any URL on the publication.

## Install & run

```sh
npm install
npm run build
npm start              # speaks MCP over stdio
```

Dev loop without a build step:

```sh
npm run dev
```

## Wire it up to a client

`claude_desktop_config.json` (or any MCP-capable client):

```json
{
  "mcpServers": {
    "substack": {
      "command": "node",
      "args": ["/absolute/path/to/tami-cloud/dist/index.js"]
    }
  }
}
```

## Notes & limitations

- Substack has no official public API. This server uses the same public
  `/api/v1/archive` and `/api/v1/posts/{slug}` endpoints the website itself
  consumes. They can change without notice.
- `search_posts` is a client-side substring scan over the archive (Substack
  exposes no per-publication search endpoint), capped by `max_scanned`.
- Read-only by design. Authenticated actions (drafts, subscriber lists,
  publishing) are intentionally out of scope for this version.
