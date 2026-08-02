# `@rag-blog/api`

Hono API on Cloudflare Workers (`nodejs_compat`).

## Local secrets

```bash
cp .dev.vars.example .dev.vars
```

Fill `BETTER_AUTH_SECRET` and optionally `DATABASE_URL` (local). R2 vars are optional — image uploads are disabled until R2 is enabled.

## Cloudflare setup

Login once:

```bash
pnpm --filter @rag-blog/api exec wrangler login
pnpm --filter @rag-blog/api exec wrangler whoami
```

Run these from the monorepo root (or `cd apps/api` and drop the filter). Paste any printed IDs into `wrangler.toml`.

### 1. R2 (optional — skipped for now)

Image uploads return `503` until R2 is enabled. When you want them:

1. Enable R2 in the dashboard (may require a payment method)
2. Uncomment `[[r2_buckets]]` in `wrangler.toml`
3. Create buckets:

```bash
pnpm --filter @rag-blog/api exec wrangler r2 bucket create rag-blog-images
pnpm --filter @rag-blog/api exec wrangler r2 bucket create rag-blog-images-preview
```

4. Optional: set `R2_PUBLIC_BASE_URL` in `.dev.vars` from the bucket public URL.

### 2. KV (rate limit)

```bash
pnpm --filter @rag-blog/api exec wrangler kv namespace create RATE_LIMIT
pnpm --filter @rag-blog/api exec wrangler kv namespace create RATE_LIMIT --preview
```

Put the returned values in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "<id from first command>"
preview_id = "<id from second command>"
```

### 3. Queue (async RAG indexing)

```bash
pnpm --filter @rag-blog/api exec wrangler queues create rag-index-queue
```

Queue name already matches `wrangler.toml`. Keep binding `RAG_INDEX_QUEUE` (used in code).

### 4. Hyperdrive (Neon)

```bash
pnpm --filter @rag-blog/api exec wrangler hyperdrive create rag-blog-neon --connection-string="YOUR_NEON_DATABASE_URL"
```

Put the returned `id` in `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-id>"
localConnectionString = "postgres://user:pass@localhost:5432/rag_blog"
```

Do not commit a real Neon URL in `localConnectionString`. Use `.dev.vars` → `DATABASE_URL` for local DB access.

### 5. Workers AI

Already configured:

```toml
[ai]
binding = "AI"
```

Accept Workers AI in the dashboard if prompted the first time.

## Dev / deploy

```bash
pnpm --filter @rag-blog/api dev      # wrangler dev → http://localhost:8787
pnpm --filter @rag-blog/api test
pnpm --filter @rag-blog/api deploy
```

Production secret:

```bash
pnpm --filter @rag-blog/api exec wrangler secret put BETTER_AUTH_SECRET
```
