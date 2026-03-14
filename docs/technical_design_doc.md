# Technical Design Document

## 1. System Architecture

Stochi uses a hybrid monorepo: a Next.js web app for the product surface and a Go service for compute-heavy interaction analysis.

- **Repository:** Monorepo with `apps/web` and `apps/engine`
- **Frontend:** Next.js 16 (App Router) + TypeScript.
  - **UI:** Tailwind CSS, shadcn/ui, Framer Motion
  - **Runtime:** Bun for local development and test execution
  - **Product role:** landing page, demo flow, dashboard, auth, server actions, and TypeScript fallback analysis
- **Backend engine:** Go 1.23.
  - **Role:** engine-first interaction, ratio, and timing analysis for heavier request paths
- **Database:** PostgreSQL with Drizzle ORM schema management in the web app

## 2. Engine-First With TypeScript Fallback

The primary analysis path lives in the web app at `apps/web/src/server/actions/interactions.ts`.

1. The web app prepares the analysis request.
2. If engine configuration is present, it calls the Go engine first.
3. The request includes internal service auth headers:
   - `X-Internal-Key`
   - `X-User-ID`
4. If the engine is unavailable, slow, or returns a non-OK response, the web app falls back to the TypeScript implementation.

This design keeps the product responsive and resilient while still allowing a faster specialized compute path.

## 3. Data Strategy

- **Schema definition:** `apps/web/src/server/db/schema.ts`
- **Migrations:** generated in `apps/web/drizzle/`
- **Database access:** Drizzle ORM in the web app; Go reads the same database for engine work

Drizzle is the source of truth for schema changes. The project uses migration files rather than direct schema pushes for durable history and predictable deploys.

## 4. Core Product Entities

- `supplement`: canonical supplement records and modeling metadata
- `interaction`: interaction rules across supplements
- `ratioRule`: stoichiometric balance rules such as Zn:Cu
- `timingRule`: spacing rules such as transporter conflicts
- `stack`, `stackItem`: reusable supplement groups
- `protocol`, `protocolItem`: user-facing daily schedule structure
- `log`: intake history used for timeline and warning computation

## 5. Auth and Service Boundary

- User auth is handled in the web app with Better Auth.
- The web app owns user sessions and authenticated UI routes.
- The Go engine is treated as an internal service, not a public user-authenticated API.
- Engine requests are authorized with an internal shared key plus the current user id supplied by the web tier.

## 6. Deployment Shape

- **Web:** Vercel-hosted Next.js app
- **Engine:** Go service deployed separately on Fly.io
- **Database:** Neon Postgres in production

The separation exists because the engine may do heavier compute than is comfortable inside standard web request constraints.

## 7. Quality Signals

- `apps/web`: `bun run check` and `bun test`
- `apps/engine`: `go test ./...`
- GitHub Actions runs these checks on pushes and pull requests
- Core engine parity and fallback behavior are covered by contract-style tests in `apps/web/src/lib/engine/`
