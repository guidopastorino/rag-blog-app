# `@rag-blog/api`

Hono API on Cloudflare Workers (`nodejs_compat`).

## Local secrets

```bash
cp .dev.vars.example .dev.vars
```

Fill `BETTER_AUTH_SECRET`, `DATABASE_URL`, and optionally `R2_PUBLIC_BASE_URL`.

## Cloudflare setup

Login once:

```bash
pnpm --filter @rag-blog/api exec wrangler login
pnpm --filter @rag-blog/api exec wrangler whoami
```

Run these from the monorepo root (or `cd apps/api` and drop the filter). Paste any printed IDs into `wrangler.toml`.

### 1. Enable R2 in the dashboard first

Dashboard → **R2 Object Storage** → accept terms / enable (may require a payment method). Then:

```bash
pnpm --filter @rag-blog/api exec wrangler r2 bucket create rag-blog-images
pnpm --filter @rag-blog/api exec wrangler r2 bucket create rag-blog-images-preview
```

Optional public URL: R2 → bucket → Settings → Public access → copy `https://pub-….r2.dev` into `.dev.vars` as `R2_PUBLIC_BASE_URL`.

Bucket names already match `wrangler.toml` (`BLOG_IMAGES`).

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
