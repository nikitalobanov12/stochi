# Stochi Web App (`apps/web`)

This is the main Next.js app (product UI + server actions) and the public demo.

## Run locally

```bash
bun install
cp .env.example .env
bun dev
```

## Database

For schema changes, use migrations (do not use `db:push`):

```bash
bun db:generate
bun db:migrate
```

To seed reference/demo data:

```bash
bun db:seed
```

If you hit `extension "vector" is not available`, recreate the local DB with the pgvector image via `./start-database.sh`.

## Useful commands

```bash
bun dev                    # Start Next.js + local DB helper
bun check                  # Lint + typecheck
bun run format:write       # Format code

bun db:generate            # Generate migration from schema edits
bun db:migrate             # Apply migrations
bun db:seed                # Seed demo/reference data
bun db:studio              # Open Drizzle Studio
```

## Where to look

```text
src/
  app/
    dashboard/             Authenticated app pages
    demo/                  Public demo pages
    (auth)/                Sign-in/up routes
  components/
    dashboard/             Timeline, score, HUD, feeds
    demo/                  Demo data/provider/banner
    ui/                    Shared primitives
  server/
    actions/               Server actions (interactions/logs/stacks)
    services/              Biological state + analytics services
    db/                    Drizzle schema, migrations runner, seed
  styles/                  Global tokens and utility styles
```

## Checks

Run before committing:

```bash
bun run check
```
