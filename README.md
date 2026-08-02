# RAG Blog App

Monorepo for a blog platform with auth, engagement (likes/shares/comments), and per-post RAG Q&A on Cloudflare.

## Stack

- **apps/web** — Next.js (App Router) + Tailwind + Biome + React Query → Cloudflare Pages
- **apps/api** — Hono on Cloudflare Workers (`nodejs_compat`)
- **packages/types** — shared Zod schemas
- **packages/db** — Drizzle schema + client (Neon + pgvector via Hyperdrive)

## Prerequisites

- Node 22+ and pnpm 10+
- Neon Postgres (enable `pgvector`)
- Cloudflare account: Workers, Pages, Hyperdrive, R2, KV, Queues, Workers AI

## Setup

```bash
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
```

Fill in:

| Variable | Where | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | `apps/api/.dev.vars` | Auth signing secret (32+ chars) |
| `DATABASE_URL` | `apps/api/.dev.vars` | Local/dev Postgres URL (or Hyperdrive localConnectionString) |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | API origin (`http://localhost:8787`) |

Update Wrangler binding IDs in `apps/api/wrangler.toml` after provisioning Hyperdrive, R2, KV, and Queues.

### Database

```bash
# Apply SQL migration to Neon (set DATABASE_URL)
pnpm db:migrate
# or run packages/db/migrations/0000_init.sql in the Neon SQL editor
```

### Local development

```bash
# API Worker
pnpm dev:api

# Web (separate terminal)
pnpm dev:web
```

- Web: http://localhost:3000
- API: http://localhost:8787/health

### Tests

```bash
pnpm test
```

Uses Vitest + Cloudflare Workers Vitest pool for `apps/api`.

### Deploy notes

1. Provision Hyperdrive pointing at Neon; paste ID into `wrangler.toml`.
2. Create R2 bucket `rag-blog-images`, KV namespace, Queue `rag-index-queue`.
3. Set Worker secrets: `wrangler secret put BETTER_AUTH_SECRET`
4. Deploy API: `pnpm --filter @rag-blog/api deploy`
5. Deploy web to Cloudflare Pages (Next.js build output / OpenNext as preferred by your Pages setup). Point `WEB_ORIGIN` / `APP_URL` / `API_URL` at production URLs.

## Smoke path

1. Register a user (email + username + password)
2. Create a post (optional image)
3. Like / share / comment
4. Wait until `ragIndexStatus` is `ready`
5. Ask a question on the post detail page
