# Core Loop Release Checklist

Use this checklist before shipping changes that affect the safety engine or dashboard warning flow.

## Goal

Protect the core user promise: fast logging plus trustworthy, actionable safety guidance.

## 1) Validation Commands (Required)

Run all of the following from the repository root unless noted.

```bash
cd apps/engine && go test ./...
cd apps/web && bun run check
cd /home/nikita/stochi
bun test apps/web/src/lib/engine/contract.test.ts
bun test apps/web/src/lib/engine/contract-fixtures.test.ts
bun test apps/web/src/lib/engine/timing.test.ts
bun test apps/web/src/lib/engine/telemetry.test.ts
bun test apps/web/src/components/dashboard/safety-actions.test.ts
```

Expected: all commands pass with zero lint/type warnings.

## 2) Engine Deploy Readiness

- Confirm `apps/engine/fly.toml` health check still points to `GET /health`.
- Confirm Fly secrets include required values:
  - `DATABASE_URL`
  - `INTERNAL_KEY`
  - `ALLOWED_ORIGINS` (comma-separated allowlist)
- Confirm web env has:
  - `ENGINE_URL`
  - `ENGINE_INTERNAL_KEY`

## 3) Post-Deploy Smoke Checks

- `curl https://stochi-engine.fly.dev/health` returns healthy status.
- Log one supplement interaction path in app and verify no 5xx errors.
- Verify engine fallback logs include reason when fallback occurs.
- Verify timing warnings show real conflict timestamps (not placeholders).

## 4) Degraded Mode Runbook

If the engine is unavailable or timing out:

1. Confirm health endpoint failure from Fly instance.
2. Check recent deploy and rollback if needed.
3. Ensure web app still serves TypeScript fallback path.
4. Track fallback reason mix (`timeout`, `non_ok_response`, `network_error`, `not_configured`, `no_session`).
5. After recovery, confirm engine-used path returns to expected level.

## 5) Ship / No-Ship Gate

Ship only if all are true:

- Required validation commands pass.
- Engine health endpoint is healthy after deploy.
- No new mismatch found in contract fixture tests.
- Core action buckets in System Console still render (`Do now`, `Avoid now`, `Optimize later`).

If any gate fails, do not ship. Open/append issue notes and fix first.
