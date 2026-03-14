# stochi

Stochi is a supplement protocol intelligence app for building safer routines and seeing how compounds overlap over time.

Live demo: <https://stochi.vercel.app/demo>
App: <https://stochi.vercel.app>
Repo: <https://github.com/nikitalobanov12/stochi>

---

## What it does

- Turns a supplement routine into a protocol with timing, overlap, and safety context
- Analyzes compound interactions (synergy, competition, inhibition)
- Flags timing issues and ratio rules (example: Zn:Cu balance)
- Projects an "active compounds" timeline and related score/state changes
- Supports fast command-style logging and one-click protocol execution

## Try the demo (2 minutes)

In `/demo`:

1. Log `mag 400mg` in the command bar.
2. Execute a protocol.
3. Open `System Feed` to see interaction/ratio/timing output.
4. Check the timeline and score changes.

What is real in demo mode:

- The UI flow, timeline, warning surfaces, and protocol execution loop are interactive.
- Demo data is seeded and resettable; it does not persist to a real user account.
- Sign up if you want to save protocols, logs, and settings.

## How it's built

The repo is a monorepo with two apps:

```text
stochi/
  apps/
    web/      Next.js app (UI, auth, server actions, data layer)
    engine/   Go service (compute-heavy analysis)
```

Compute fallback:

- The web app tries the Go engine first for analysis.
- If the engine is unavailable or times out, it falls back to an equivalent TypeScript path.
- Result: the app degrades gracefully instead of hard failing.

Employer review path:

- Start with `/demo` for the fastest product proof.
- Then inspect `apps/web/src/app/demo/demo-dashboard-client.tsx` and `apps/web/src/server/actions/interactions.ts`.
- Finish with `docs/showcase-for-employers.md` and `docs/core-loop-release-checklist.md`.

## Code map

- `apps/web/src/app/demo/` public demo pages
- `apps/web/src/app/dashboard/` authenticated app pages
- `apps/web/src/components/dashboard/` timeline, score, HUD, feeds
- `apps/web/src/server/actions/` server actions (interaction/timing/ratio logic)
- `apps/web/src/server/services/` biological state + analytics services
- `apps/web/src/server/db/` schema + migrations runner
- `apps/engine/` Go handlers + modeling internals

## Local development

Prereqs:

- Bun
- Docker

Setup:

```bash
git clone https://github.com/nikitalobanov12/stochi.git
cd stochi
bun install
cp apps/web/.env.example apps/web/.env
bun dev
```

Database:

```bash
cd apps/web
bun db:migrate
bun db:seed
```

Note: your local DB needs pgvector available for vector-related migrations.

## Checks

Before committing:

```bash
cd apps/web
bun run check
```

GitHub Actions also runs the visible repo quality gate on pushes and pull requests:

- `apps/web`: `bun run check` and `bun test`
- `apps/engine`: `go test ./...`

## More docs

- `docs/technical_design_doc.md`
- `docs/design-language/refined-clinical-editorial.md`
- `docs/showcase-for-employers.md`
- `docs/core-loop-release-checklist.md`

## Author

Nikita Lobanov
<https://github.com/nikitalobanov12>
