# AGENTS.md

## Commands
```bash
bun dev                    # Start dev server (turbo)
bun check                  # Lint + typecheck (use SKIP_ENV_VALIDATION=1 if env vars missing)
bun run format:write       # Format code with prettier
bun db:push                # Push schema to database
bun db:seed                # Seed supplements and interactions
```

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
