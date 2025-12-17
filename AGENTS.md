# AGENTS.md

## Commands
```bash
bun dev                    # Start dev server (turbo)
bun check                  # Lint + typecheck (use SKIP_ENV_VALIDATION=1 if env vars missing)
bun run format:write       # Format code with prettier
```

## Database Commands (run from apps/web/)
```bash
bun db:generate            # Generate migration from schema changes
bun db:migrate             # Apply pending migrations (non-interactive)
bun db:seed                # Seed supplements and interactions
bun db:studio              # Open Drizzle Studio GUI
bun db:push                # Push schema directly (interactive - avoid in CI)
```

## Database Migration Workflow (CRITICAL)

### When Making Schema Changes
**ALWAYS use migrations, not `db:push`** for schema changes:

1. Edit `apps/web/src/server/db/schema.ts`
2. Generate migration: `cd apps/web && bun db:generate`
3. Review the generated SQL in `apps/web/drizzle/`
4. Apply migration: `bun db:migrate`
5. Commit BOTH the schema.ts AND the migration files together

### Why Not db:push?
- `db:push` is interactive (bad for CI/automation)
- `db:push` doesn't create migration files (no history)
- `db:push` can conflict with existing migrations table
- `db:push` makes it hard to sync schema across environments

### For Fresh Databases
```bash
cd apps/web
bun db:migrate    # Apply all migrations
bun db:seed       # Seed reference data
```

### Troubleshooting Migration Issues
If migrations fail with "already exists" errors, it means migrations were previously applied via `db:push`. Fix by manually marking them as applied:
```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('migration_tag_from_journal', unix_timestamp_ms);
```

## Workflow Requirements

### Always Run Before Committing
- **`bun run check`** must pass with 0 errors AND 0 warnings before any commit
- Fix all warnings (unused vars, etc.) - don't leave them for later

### Incremental Commits
- Make small, logical commits as you work - not one big commit at the end
- Commit after each completed unit of work (e.g., new component, server action, bug fix)
- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Example Workflow
```bash
# After creating a new component
bun run check              # Verify no errors/warnings
git add src/components/onboarding/welcome-step.tsx
git commit -m "feat(onboarding): add welcome step component"

# After adding server action
bun run check
git add src/server/actions/onboarding.ts
git commit -m "feat(onboarding): add createStackFromOnboarding action"

# After schema change - commit schema AND migration together
bun run check
git add src/server/db/schema.ts drizzle/
git commit -m "feat(schema): add research_url to ratio_rule table"
```

## Task Tracking
- Track features and bugs in `BACKLOG.md` at repository root
- Format: `- [ ]` pending, `- [x]` completed
- Sections: In Progress, Up Next, Completed, Ideas/Future
- Use this for anything outside current sprint scope

## Code Style
- **Imports**: Use `~/` alias for src imports. Use `import { type X }` for type-only imports
- **Env vars**: Always access via `import { env } from "~/env"` - never use `process.env` directly
- **Types**: Prefer interfaces for objects, type aliases for unions. No explicit `any`
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Errors**: Use `throw new Error()` in server actions, handle with try/catch on client
- **Unused vars**: Prefix with `_` (e.g., `_unused`) to suppress warnings
- **Drizzle**: Always use `.where()` with `db.delete()` and `db.update()` (enforced by lint)
- **Server Actions**: Must be `async`, use `"use server"` directive, return `void` for form actions
- **Nullish**: Prefer `??` over `||`, use `?.` optional chaining, use `??=` for assignment
