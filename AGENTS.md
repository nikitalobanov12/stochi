# AGENTS.md

## Commands
```bash
bun dev                    # Start dev server (turbo)
bun check                  # Lint + typecheck (use SKIP_ENV_VALIDATION=1 if env vars missing)
bun run format:write       # Format code with prettier
bun db:push                # Push schema to database
bun db:seed                # Seed supplements and interactions
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
