- App simple donde un usuario se pueda loguear y crear blogs.
- Los usuarios pueden likear/compartir/comentar posts.
- También tendrá una IA incluida para hacer RAG sobre los posts y poder hacer preguntas especificas de cada post a la IA.

Stack:
- Package Manager: Monorepo con pnpm workspaces (apps/ y packages/).
- Frontend: Next.js (App Router, Tailwind, Biome, Shadcn) + React Query hosteado en Cloudflare Pages.
- Backend: Hono + Cloudflare Workers (nodejs_compat activo).
- Autenticación: Better-Auth (se usará por ahora el plugin de username para manejar nombres de usuarios e inicio de sesión con email/username y password). Cambiar librería de hashing a una mas liviana para no romper la API y que no crashee.
- Validación: Zod (compartido vía packages/types).
- Base de Datos: Neon (Postgres) + pgvector + Cloudflare Hyperdrive.
- Manejo de DB: Drizzle ORM (Consultas) + Drizzle Kit (Migraciones).
- Archivos: Cloudflare R2 (Imágenes de los blogs con s3mini).
- Caché / Rate Limit: Workers KV.
- Tareas en segundo plano: Cloudflare Queues (Para procesar el RAG de forma asíncrona).
- Motor de IA (RAG): Cloudflare Workers AI (@cf/baai/bge-large-en-v1.5 y @cf/meta/llama-3.1-8b-instruct).
- Testing: Vitest + Cloudflare Workers Vitest Pool.
