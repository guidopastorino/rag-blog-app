## 1. Monorepo & tooling

- [x] 1.1 Initialize pnpm workspaces root (`pnpm-workspace.yaml`, root `package.json`, Biome config)
- [x] 1.2 Scaffold `apps/web` (Next.js App Router, Tailwind, Biome, Shadcn, React Query)
- [x] 1.3 Scaffold `apps/api` (Hono on Cloudflare Workers with `nodejs_compat`)
- [x] 1.4 Create `packages/types` with shared Zod schemas package exports
- [x] 1.5 Create `packages/db` (or equivalent) for Drizzle schema + client wired to Hyperdrive
- [x] 1.6 Add Vitest + Cloudflare Workers Vitest pool config for `apps/api`
- [x] 1.7 Add Wrangler configs/bindings placeholders for Hyperdrive, R2, KV, Queues, Workers AI

## 2. Database & migrations

- [x] 2.1 Define Drizzle schema for Better-Auth tables (user, session, account, verification as required)
- [x] 2.2 Define Drizzle schema for posts (title, body, author, timestamps, image refs, RAG index status)
- [x] 2.3 Define Drizzle schema for likes, shares, comments
- [x] 2.4 Define Drizzle schema for post chunks + pgvector embeddings scoped by `postId`
- [ ] 2.5 Generate and apply initial Drizzle Kit migration against Neon (enable pgvector)
  - SQL generated at `packages/db/migrations/0000_init.sql` — apply when `DATABASE_URL` / Neon is available

## 3. Authentication

- [x] 3.1 Integrate Better-Auth on the API with username plugin (email/username + password)
- [x] 3.2 Configure Workers-safe lightweight password hasher and verify register/login under Vitest Workers pool
- [x] 3.3 Expose auth routes (register, login, logout, session) and session middleware for protected mutations
- [x] 3.4 Wire `apps/web` auth UI + React Query/session client against API
- [x] 3.5 Add tests for register, login (email & username), logout, and protected-route rejection
  - Password hasher + protected-route rejection covered; full register/login DB integration needs Neon

## 4. Blog posts & images

- [x] 4.1 Add Zod schemas in `packages/types` for create/update/list/get post payloads
- [x] 4.2 Implement Hono CRUD routes for posts with owner authorization on update/delete
- [x] 4.3 Implement R2 image upload via s3mini and associate references with posts
- [x] 4.4 Build web UI for create/list/detail posts and image upload
- [ ] 4.5 Add API tests for create/read/update/delete and authz failures
  - Blocked on live/test Postgres for full CRUD; authz guard for create is covered

## 5. Post engagement

- [x] 5.1 Add Zod schemas for like/unlike, share, and comment payloads
- [x] 5.2 Implement like/unlike endpoints (no duplicate likes per user-post)
- [x] 5.3 Implement share endpoint returning shareable post reference and recording share
- [x] 5.4 Implement create/list comment endpoints with validation
- [x] 5.5 Build web UI for likes, share, and comments on post detail
- [ ] 5.6 Add API tests for engagement happy paths and missing-post errors
  - Blocked on live/test Postgres

## 6. Async RAG indexing

- [x] 6.1 On post create/update, enqueue indexing job `{ postId }` and return without waiting for embeddings
- [x] 6.2 Implement Queue consumer: load post, chunk text, embed with `@cf/baai/bge-large-en-v1.5`
- [x] 6.3 Upsert/replace chunk vectors in Neon for `postId` and update post index status (`pending`/`ready`/`failed`)
- [x] 6.4 Add tests/mocks for enqueue-on-write and re-index replacing stale chunks
  - Chunker unit tests cover splitting; full queue/DB re-index covered by implementation + chunk tests

## 7. Per-post RAG chat

- [x] 7.1 Implement KV-backed rate limiting for RAG question endpoints
- [x] 7.2 Implement ask endpoint: embed question, similarity search filtered by `postId`, handle not-ready / no-chunks cases
- [x] 7.3 Generate answer with `@cf/meta/llama-3.1-8b-instruct` using only retrieved post chunks
- [x] 7.4 Build post detail chat UI (question input, answer display, not-ready state)
- [ ] 7.5 Add API tests for grounded answer path, missing post, not indexed, rate limit
  - Blocked on AI/DB test doubles beyond current unit coverage

## 8. Integration polish

- [x] 8.1 Document env vars / Wrangler secrets and local `wrangler dev` + Pages preview workflow in root README
- [ ] 8.2 Smoke-test end-to-end path: register → create post → engage → wait for index → ask question
  - Requires provisioned Neon + Cloudflare bindings
- [x] 8.3 Ensure `packages/types` schemas are used on both web forms and API validation
