## Context

Greenfield repo; no existing apps or packages. Constraints from the product stack: pnpm monorepo, Next.js on Cloudflare Pages, Hono API on Cloudflare Workers (`nodejs_compat`), Neon + pgvector via Hyperdrive, Better-Auth with username plugin, R2 via s3mini, KV, Queues, Workers AI for embeddings + chat. See `proposal.md` for motivation and capability list.

## Goals / Non-Goals

**Goals:**
- Establish a deployable monorepo with clear app/package boundaries.
- Wire Cloudflare bindings (Hyperdrive, R2, KV, Queues, Workers AI) into the API Worker.
- Define auth, posts, engagement, and async per-post RAG flows that match the specs.
- Prefer Workers-safe password hashing so Better-Auth does not crash at runtime.

**Non-Goals:**
- OAuth/social login, email verification, or multi-tenant orgs.
- Real-time collaborative editing or full-text search product features beyond RAG retrieval.
- Multi-model routing, fine-tuning, or non-Cloudflare AI providers.
- Admin moderation tooling and analytics dashboards.

## Decisions

### 1. Monorepo layout
- **Choice:** `apps/web` (Next.js App Router + Tailwind + Biome + Shadcn + React Query), `apps/api` (Hono Worker), `packages/types` (Zod schemas), plus shared DB package if needed (`packages/db` for Drizzle schema/client).
- **Rationale:** Separates deploy targets (Pages vs Workers) while sharing validation and schema.
- **Alternatives:** Single Next.js app with route handlers — rejected because API needs Queues, Hyperdrive, Workers AI bindings more naturally on a dedicated Worker.

### 2. API runtime
- **Choice:** Hono on Cloudflare Workers with `nodejs_compat` enabled.
- **Rationale:** Required for Better-Auth / DB clients that expect Node APIs; Hono fits Workers routing and middleware.
- **Alternatives:** Pure Web-standards-only stack without `nodejs_compat` — higher friction with Better-Auth.

### 3. Auth: Better-Auth + username + light hashing
- **Choice:** Better-Auth with username plugin (email/username + password). Configure a lightweight password hasher compatible with Workers (avoid heavy native/Node-only bcrypt builds that break or OOM on Workers). Prefer Web Crypto–friendly or Workers-safe adapter (e.g. `@noble/hashes` / Argon2 or scrypt variant known to work under `nodejs_compat`, as validated during implementation).
- **Rationale:** Meets product auth UX; hashing swap keeps Better-Auth API surface while preventing Worker crashes.
- **Alternatives:** Lucia/custom JWT — more DIY; Clerk — conflicts with self-hosted Neon/Workers preference.

### 4. Data layer
- **Choice:** Neon Postgres + `pgvector`; Drizzle ORM for queries; Drizzle Kit for migrations; Cloudflare Hyperdrive binding for pooled DB access from the Worker.
- **Rationale:** Managed Postgres with vector search; Hyperdrive reduces connection churn on Workers.
- **Alternatives:** D1 — weaker fit for pgvector/RAG; embedding store only in Vectorize — rejected to keep relational + vectors in one DB for v1 simplicity.

### 5. Files
- **Choice:** Cloudflare R2 for blog images; access via `s3mini` S3-compatible client from the API.
- **Rationale:** Cheap object storage colocated with Cloudflare; s3mini is small enough for Workers.
- **Alternatives:** UploadThing / external CDN — extra vendor; direct browser→R2 with signed URLs is a later optimization.

### 6. Cache and rate limits
- **Choice:** Workers KV for rate-limit counters (especially RAG queries) and selective response caching (e.g. post list hot paths where safe).
- **Rationale:** Simple, globally distributed; sufficient for v1 throttling.
- **Alternatives:** Durable Objects for stricter atomic counters — deferred until needed.

### 7. Async RAG pipeline (Queues + Workers AI)

```
Client → API (create/update post)
       → persist post in Neon
       → enqueue { postId } on indexing Queue
       → return 2xx immediately

Queue consumer (same or dedicated Worker handler)
       → load post body
       → chunk text
       → embed chunks with @cf/baai/bge-large-en-v1.5 (Workers AI)
       → upsert chunk rows + vectors in Neon (pgvector), scoped by postId
       → mark post index status ready / failed

Client → API (ask question about postId)
       → rate-limit check (KV)
       → if index not ready → 409/503 "not ready"
       → embed question (same embedding model)
       → similarity search chunks WHERE post_id = :postId
       → if no relevant chunks → grounded "no supporting content" response
       → prompt @cf/meta/llama-3.1-8b-instruct with retrieved chunks + question
       → return answer (+ optional citations of chunk ids)
```

- **Rationale:** Keeps write path fast; isolates embedding cost/latency; scopes retrieval per post for correct grounding.
- **Alternatives:** Sync embedding in request — rejected (latency/timeouts). Cloudflare Vectorize — deferred; pgvector keeps one data plane for v1.

### 8. Frontend data fetching
- **Choice:** React Query against the Hono API (typed with shared Zod types where practical).
- **Rationale:** Cache/invalidation for posts, comments, and chat UX without inventing a custom store.

### 9. Testing
- **Choice:** Vitest + `@cloudflare/vitest-pool-workers` for API/Worker tests; frontend unit tests as needed with Vitest.
- **Rationale:** Matches Workers runtime behavior for bindings-dependent code.

## Risks / Trade-offs

- **[Risk] Better-Auth hashing / Node APIs on Workers** → Mitigation: enable `nodejs_compat`; pick and verify a light hasher in CI with Workers Vitest pool before wiring UI.
- **[Risk] Hyperdrive + Neon cold starts / migration drift** → Mitigation: Drizzle Kit migrations in CI; document Hyperdrive config; health check endpoint.
- **[Risk] RAG hallucination or cross-post leakage** → Mitigation: hard filter `post_id` in retrieval; refuse when index empty/unready; instruct model to only use provided context.
- **[Risk] Queue retries duplicating vectors** → Mitigation: upsert by stable chunk keys; delete-by-postId before reinsert on re-index.
- **[Risk] KV rate limits are eventually consistent** → Mitigation: accept soft limits for v1; tighten later with DO if abuse appears.
- **[Trade-off] Single Llama 8B model** → Lower quality than larger models; acceptable for scoped post Q&A cost/latency on Workers AI.

## Migration Plan

1. Scaffold monorepo + tooling; empty apps deployable (hello Worker / Pages).
2. Provision Neon, Hyperdrive, R2, KV, Queue, Workers AI; wire wrangler bindings.
3. Apply Drizzle migrations (users/auth tables, posts, engagement, chunks+vector).
4. Ship auth → posts → engagement → RAG indexing/chat in that order.
5. Rollback: redeploy previous Worker/Pages artifacts; DB migrations are forward-only with expand/contract if destructive changes appear later.

## Open Questions

- Exact Better-Auth password hasher package/version: pin during apply after Workers Vitest validation (approach locked to Workers-safe light hasher).

**Resolved for v1:** Posts are public (readable without auth). RAG questions are allowed for any client but rate-limited via KV; mutations (create/engage) require auth.
