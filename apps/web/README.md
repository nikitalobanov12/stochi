# Stochi Web App (`apps/web`)

Main product application and public demo for Stochi.

## What This App Demonstrates

- High-density product UX for protocol tracking and safety analysis
- Real-time interaction/timing/ratio insights from server logic
- Public demo that highlights meaningful flows quickly for reviewers

## Run Locally

```bash
bun install
cp .env.example .env
bun dev
```

## Database Workflow (Important)

Use migrations, not `db:push`, for schema changes.

```bash
bun db:generate
bun db:migrate
bun db:seed
```

If you see `extension "vector" is not available`, recreate local DB with pgvector image via `./start-database.sh`.

## Commands

```bash
bun dev                    # Start Next.js + local DB helper
bun check                  # Lint + typecheck
bun run format:write       # Format code
bun db:generate            # Generate migration from schema edits
bun db:migrate             # Apply migrations
bun db:seed                # Seed demo/reference data
bun db:studio              # Open Drizzle Studio
```

## Structure

```text
src/
  app/
    dashboard/             Authenticated product surfaces
    demo/                  Public showcase mode
    (auth)/                Sign-in/up routes
  components/
    dashboard/             Timeline, bio-score, HUD, feeds
    demo/                  Demo data/provider/banner
    ui/                    Shared primitives
  server/
    actions/               Server actions (interactions/logs/stacks)
    services/              Biological-state and analytics services
    db/                    Drizzle schema, migrate runner, seed
  styles/                  Global token and utility styles
```

## Quality Gate

Run before commit:

```bash
bun run check
```
