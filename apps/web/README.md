# `@rag-blog/web`

Next.js frontend (OpenNext → Cloudflare Workers).

## Auth cookies / API proxy

The browser only talks to this origin. Next rewrites `/api/*` to the API Worker (`API_BACKEND_URL`), so Better Auth session cookies stay same-site.

- Local: `.env.development` → `http://localhost:8787`
- Prod build: `.env.production` → Worker URL

## Scripts

```bash
pnpm --filter @rag-blog/web dev       # next dev + proxy
pnpm --filter @rag-blog/web preview   # OpenNext local Workers runtime
pnpm --filter @rag-blog/web run deploy
```

Or from repo root: `pnpm deploy:web`.

## After deploy

Prod URLs (current):

- Web: https://rag-blog-web.guidopasto05.workers.dev
- API: https://rag-blog-api.guidopasto05.workers.dev

After changing the web URL, update API `APP_URL` / `WEB_ORIGIN` in `apps/api/wrangler.toml` and run `pnpm deploy:api`.
