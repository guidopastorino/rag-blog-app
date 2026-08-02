## Purpose

Define la estructura del monorepo, el tooling compartido y los bindings de Cloudflare necesarios para desarrollar, testear y deployar web y API de forma consistente.

## ADDED Requirements

### Requirement: Monorepo workspace layout
The system MUST organize code as a pnpm workspaces monorepo with `apps/` for deployable applications and `packages/` for shared libraries.

#### Scenario: Workspace packages are discoverable
- **WHEN** a developer installs dependencies from the repository root
- **THEN** workspace packages under `apps/` and `packages/` resolve via pnpm workspaces without publishing to a registry

### Requirement: Shared validation package
The system MUST expose shared Zod schemas from a workspace package (e.g. `packages/types`) consumable by both frontend and backend.

#### Scenario: Client and server share request schemas
- **WHEN** frontend and backend validate the same API payload shape
- **THEN** both MUST import the schema from the shared types package and reject invalid input consistently

### Requirement: Frontend and API deploy targets
The system MUST provide a Next.js frontend deployable to Cloudflare Pages and a Hono API deployable to Cloudflare Workers with `nodejs_compat` enabled.

#### Scenario: API worker runs with nodejs_compat
- **WHEN** the API Worker is configured for deployment
- **THEN** the Worker configuration MUST enable `nodejs_compat` so Node-compatible auth and DB clients can run

### Requirement: Cloudflare resource bindings
The system MUST bind Hyperdrive, R2, KV, Queues, and Workers AI to the API Worker for database access, file storage, cache/rate limiting, background jobs, and AI inference.

#### Scenario: Worker has required bindings
- **WHEN** the API Worker starts handling requests
- **THEN** it MUST have access to Hyperdrive, R2, KV, Queues, and Workers AI bindings required by application features

### Requirement: Automated tests for Workers
The system MUST support unit/integration tests with Vitest and the Cloudflare Workers Vitest pool for Worker-side code.

#### Scenario: Worker tests execute in Workers runtime
- **WHEN** a developer runs the API test suite
- **THEN** Worker-targeted tests MUST run via Vitest with the Cloudflare Workers Vitest pool
