## Why

Necesitamos bootstrapear desde cero una app de blogs con autenticación, engagement social y preguntas con IA (RAG) por post. Sin un baseline greenfield claro (monorepo, Workers/Pages, auth, DB y pipeline RAG), no se puede iterar de forma segura ni deployar en Cloudflare.

## What Changes

- Crear monorepo pnpm (`apps/`, `packages/`) con frontend Next.js y API Hono en Cloudflare Workers.
- Implementar autenticación con Better-Auth (username plugin: email/username + password) y hashing liviano compatible con Workers.
- Permitir crear y gestionar posts/blogs, incluyendo imágenes en R2.
- Agregar likes, shares y comentarios sobre posts.
- Incluir chat RAG por post: embeddings + generación con Workers AI, indexación asíncrona vía Queues.
- Definir validación Zod compartida, schema Drizzle (Neon + pgvector + Hyperdrive), KV para caché/rate limit, y Vitest con Workers pool.

## Capabilities

### New Capabilities

- `monorepo-infra`: Estructura del monorepo, tooling, bindings Cloudflare y empaquetado apps/packages.
- `user-auth`: Registro/login con email o username + password, sesiones y rutas protegidas.
- `blog-posts`: CRUD de posts/blogs y upload de imágenes.
- `post-engagement`: Likes, shares y comentarios sobre posts.
- `post-rag-chat`: Indexación RAG asíncrona y preguntas específicas por post a la IA.

### Modified Capabilities

- _(ninguno — greenfield sin specs existentes)_

## Impact

- Repo vacío → monorepo completo (`apps/web`, `apps/api`, `packages/types`, etc.).
- Dependencias nuevas: Next.js, Hono, Better-Auth, Drizzle, Zod, React Query, Biome, Shadcn, Vitest, bindings Cloudflare (Workers, Pages, Hyperdrive, R2, KV, Queues, Workers AI).
- Sistemas externos: Neon Postgres + pgvector, Cloudflare Hyperdrive/R2/KV/Queues/Workers AI.
- APIs HTTP nuevas para auth, posts, engagement y chat RAG; sin APIs previas que romper.
