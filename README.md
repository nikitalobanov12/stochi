# stochi_

Stoichiometric intelligence for supplement protocols.

Stochi is a production-grade web app that helps users understand how compounds interact over time, not just what they logged.

**Live demo:** https://stochi.vercel.app/demo  
**App:** https://stochi.vercel.app  
**Repo:** https://github.com/nikitalobanov12/stochi

---

## Recruiter Quick Scan

If you only read one section, read this:

- **Real modeling, not UI theater:** timeline and warnings are driven by pharmacokinetic + interaction logic.
- **Resilient architecture:** Go engine with TypeScript fallback keeps the app usable if the engine is down.
- **Full-stack ownership:** product UX, data model, server actions, analytics, and docs are all in one codebase.
- **Shipping discipline:** typed boundaries, migrations, lint/typecheck gates, and reproducible dev workflow.

## Core Differentiators

### Product-facing

- Compound interaction analysis (synergy, competition, inhibition)
- Timing and stoichiometric ratio warnings (example: Zn:Cu balance)
- Biological timeline and active-compound state projection
- Fast command-style logging and protocol execution

### Engineering-facing

- Hybrid compute path:
  - `apps/engine` (Go service) for heavy analysis
  - `apps/web` TypeScript fallback when engine is unavailable
- PostgreSQL + Drizzle migrations with typed server actions
- Next.js App Router + Bun + Turborepo monorepo workflow
- Public demo mode with realistic seeded interactions and scenario flow

## Demo Walkthrough (2 minutes)

In `/demo`, do this sequence:

1. Log `mag 400mg` in the command bar.
2. Execute a protocol with one click.
3. Open `System Feed` and inspect interaction/ratio/timing outputs.
4. Review timeline + bio-score changes.

That flow demonstrates both product clarity and backend logic depth quickly.

## Architecture

```text
stochi/
  apps/
    web/      Next.js app (UI, auth, server actions, data layer)
    engine/   Go service (analysis + compute-heavy paths)
```

### Key pattern: Compute fallback

- The web app attempts the Go engine path first.
- If unavailable/timeouts occur, it uses an equivalent TypeScript path.
- Outcome: graceful degradation instead of total feature failure.

## Code Map

- `apps/web/src/app/demo/` public demo surfaces
- `apps/web/src/app/dashboard/` authenticated product surfaces
- `apps/web/src/components/dashboard/` timeline, score, HUD, feeds
- `apps/web/src/server/actions/` interaction/timing/ratio server logic
- `apps/web/src/server/services/` biological state + analytics services
- `apps/web/src/server/db/` schema + migration runner
- `apps/engine/` Go handlers + modeling internals

## Local Development

### Prerequisites

- Bun
- Docker

### Setup

```bash
git clone https://github.com/nikitalobanov12/stochi.git
cd stochi
bun install
cp apps/web/.env.example apps/web/.env
bun dev
```

### Database

```bash
cd apps/web
bun db:migrate
bun db:seed
```

Note: local DB must run the pgvector image for vector extension migrations.

## Quality Gates

Before commit:

```bash
cd apps/web
bun run check
```

This enforces lint + typecheck consistency.

## Additional Docs

- `docs/technical_design_doc.md`
- `docs/design-language/refined-clinical-editorial.md`
- `docs/showcase-for-employers.md`

## Author

Nikita Lobanov  
https://github.com/nikitalobanov12
