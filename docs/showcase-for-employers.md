# Showcase Guide For Employers

This doc is a quick evaluator guide for technical reviewers, hiring managers, and recruiters.

## 1) What To Look At First

1. **Live demo:** `/demo`
2. **Product dashboard:** `/dashboard` (after sign-in)
3. **Root README:** high-level architecture + development story

## 2) Why This Project Stands Out

- It solves a non-trivial domain problem (interaction/timing/ratio safety) rather than a generic CRUD app.
- It mixes UX and compute concerns: users get clear guidance from dense biological-state logic.
- It has architectural resilience: Go engine + TypeScript fallback.

## 3) Evidence In Code

- Interaction/timing/ratio actions: `apps/web/src/server/actions/interactions.ts`
- Biological state + timeline services: `apps/web/src/server/services/biological-state.ts`
- Demo composition: `apps/web/src/app/demo/demo-dashboard-client.tsx`
- Dashboard composition: `apps/web/src/app/dashboard/dashboard-client.tsx`
- Database schema + migrations: `apps/web/src/server/db/schema.ts`, `apps/web/drizzle/`

## 4) Engineering Signals

- Typed server boundaries and explicit domain models
- Migration-first DB workflow
- Lint + typecheck gate (`bun run check`)
- Practical UX tradeoffs (dense data, staged disclosure via collapsible panels)

## 5) Suggested Portfolio Talking Points

- "I built a domain-specific analysis product, not a template app."
- "I designed for both expert users and first-time evaluators via a focused demo flow."
- "I implemented resilient architecture where advanced compute can fail gracefully."
