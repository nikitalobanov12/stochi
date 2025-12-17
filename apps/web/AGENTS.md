# AGENTS.md - Stochi Project

This file provides guidance for AI agents working on the Stochi codebase.

## CRITICAL: Database Migration Rules

**NEVER use `db:push` for schema changes.** Always use migrations:

```bash
# Schema change workflow:
1. Edit src/server/db/schema.ts
2. bun db:generate              # Creates migration file in drizzle/
3. bun db:migrate               # Applies migration (non-interactive)
4. git add src/server/db/schema.ts drizzle/
5. git commit -m "feat(schema): description of change"
```

**Why?**
- `db:push` is interactive (breaks CI/automation)
- `db:push` doesn't track history (no migration files)
- `db:push` causes conflicts with `__drizzle_migrations` table
- Migrations ensure schema syncs across all environments

**If migrations fail with "already exists" errors:**
The database was likely set up with `db:push`. Manually mark migrations as applied:
```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
VALUES ('migration_tag_from_journal', unix_timestamp_ms);
```

## CRITICAL: Workflow Requirements

### Before Every Commit
```bash
bun run check  # Must pass with 0 errors AND 0 warnings
```
- Fix ALL warnings (unused vars, imports, etc.) before committing
- Never leave warnings for "later" - they must be resolved immediately

### Incremental Commits (REQUIRED)
Make small, encapsulated commits **as you work** - not one large commit at the end.

**Commit after each logical unit:**
- New component created → commit
- Server action added → commit  
- Bug fixed → commit
- Refactor completed → commit

**Example session:**
```bash
# 1. Create step component
bun run check
git add src/components/onboarding/welcome-step.tsx
git commit -m "feat(onboarding): add welcome step component"

# 2. Create server action
bun run check
git add src/server/actions/onboarding.ts
git commit -m "feat(onboarding): add createStackFromOnboarding action"

# 3. Wire up in page
bun run check
git add src/app/dashboard/page.tsx
git commit -m "feat(onboarding): integrate welcome flow in dashboard"
```

### Commit Message Format
```
<type>(<scope>): <description>

[optional body with details]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `docs`: Documentation only
- `style`: Formatting, no code change
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples
```bash
git commit -m "feat(schema): add ratio rule table for stoichiometric warnings"
git commit -m "feat(log): display timing warnings in sidebar"
git commit -m "fix(auth): handle expired session redirect"
git commit -m "refactor(settings): extract export button to client component"
```

### When to Commit
- After completing a logical unit of work
- Schema changes separate from seed data
- Backend functions separate from UI integration
- Each feature/fix should be independently revertable

## Project Overview

**Stochi** is a "stoichiometric engine for bio-optimization" - a PWA for tracking supplements, detecting molecular interactions, and optimizing supplement stacks.

**Target Users**: Biohackers who value precision, speed, privacy, and high data density.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Runtime**: Bun
- **Database**: PostgreSQL (local Docker for dev, Neon for production)
- **ORM**: Drizzle
- **Auth**: BetterAuth with `@daveyplate/better-auth-ui`
- **Styling**: Tailwind CSS + shadcn/ui
- **PWA**: `@ducanh2912/next-pwa`

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (auth)/auth/[...path]/     # Auth pages (sign-in, sign-up, etc.)
│   │   ├── dashboard/                  # Protected dashboard routes
│   │   │   ├── log/                   # Logging interface
│   │   │   ├── settings/              # User settings & data export
│   │   │   ├── stacks/                # Stack management
│   │   │   │   └── [id]/              # Individual stack detail
│   │   │   ├── layout.tsx             # Dashboard shell with nav
│   │   │   └── page.tsx               # Dashboard home
│   │   ├── api/auth/[...all]/         # BetterAuth API routes
│   │   ├── layout.tsx                 # Root layout
│   │   └── page.tsx                   # Landing page
│   ├── components/
│   │   ├── log/                       # Log-specific components
│   │   │   └── command-bar.tsx        # Natural language input
│   │   ├── onboarding/                # Onboarding flow components
│   │   │   ├── welcome-flow.tsx       # Main orchestrator with animations
│   │   │   ├── step-indicator.tsx     # Progress dots
│   │   │   └── steps/                 # Individual step components
│   │   │       ├── welcome-step.tsx
│   │   │       ├── goal-step.tsx
│   │   │       ├── supplements-step.tsx
│   │   │       ├── interactions-step.tsx
│   │   │       └── save-stack-step.tsx
│   │   ├── ui/                        # shadcn components
│   │   ├── nav-links.tsx              # Navigation link components
│   │   └── providers.tsx              # Client providers (AuthUI)
│   ├── lib/
│   │   └── utils.ts                   # Utility functions (cn)
│   └── server/
│       ├── actions/                   # Server Actions
│       │   ├── interactions.ts        # Interaction checking engine
│       │   ├── logs.ts                # Log CRUD operations
│       │   ├── onboarding.ts          # Template instantiation, fork, clear
│       │   └── stacks.ts              # Stack CRUD operations
│       ├── better-auth/               # Auth configuration
│       │   ├── client.ts              # Client-side auth
│       │   ├── config.ts              # Server auth config
│       │   ├── index.ts               # Auth exports
│       │   └── server.ts              # Server-side session
│       ├── data/                       # Static data definitions
│       │   ├── stack-templates.ts     # Legacy template definitions
│       │   └── goal-recommendations.ts # Goal-based supplement suggestions
│       └── db/
│           ├── index.ts               # Database connection
│           ├── schema.ts              # Drizzle schema
│           └── seed.ts                # Seed data script
├── public/
│   ├── icons/                         # PWA icons (SVG)
│   └── manifest.json                  # PWA manifest
└── drizzle.config.ts                  # Drizzle configuration
```

## Database Schema

### Core Tables

- **supplement**: Master list of supplements (name, form, elemental weight)
- **interaction**: Supplement interactions (source, target, type, severity)
- **ratioRule**: Stoichiometric ratio rules (e.g., Zn:Cu 8-15:1)
- **timingRule**: Time-spacing rules (e.g., Tyrosine and 5-HTP 4h apart)
- **stack**: User's supplement bundles
- **stackItem**: Items within a stack (supplement, dosage, unit)
- **log**: User's supplement intake logs

### Auth Tables (managed by BetterAuth)

- **user**, **session**, **account**, **verification**

### Enums

- `interactionTypeEnum`: inhibition, synergy, competition
- `severityEnum`: low, medium, critical
- `dosageUnitEnum`: mg, mcg, g, IU, ml

## Commands

```bash
# Development
bun dev                  # Start database + dev server (auto-stops DB on exit)
bun dev:next             # Start dev server only (no database management)
bun check                # Lint + TypeCheck (use SKIP_ENV_VALIDATION=1 if env vars missing)

# Database
./start-database.sh      # Start local Postgres container manually
./scripts/stop-db.sh     # Stop Postgres container manually
bun db:generate          # Generate new migration from schema changes
bun db:migrate           # Run pending migrations (non-interactive)
bun db:push              # Push schema directly (interactive - use for quick dev)
bun db:studio            # Open Drizzle Studio
bun db:seed              # Seed supplements and interactions
```

### Migration Workflow

**For schema changes:**
1. Edit `src/server/db/schema.ts`
2. Run `bun db:generate` to create a migration file
3. Run `bun db:migrate` to apply it
4. Commit both the schema and migration files

**For fresh databases:**
```bash
bun db:migrate           # Apply all migrations
bun db:seed              # Seed reference data
```

**Note:** If migrations fail because tables already exist (from prior `db:push`), you may need to manually mark migrations as applied in the `drizzle.__drizzle_migrations` table.

## Design Guidelines

### "Terminal Chic" Aesthetic

- **Background**: #0D1117 (near-black)
- **Primary**: #39FF14 (neon green)
- **Accent**: #00F0FF (cyan)
- **Fonts**: JetBrains Mono (headers/data), Inter (body)
- **Theme**: Dark mode only

### UI Principles

- High data density
- No gamification (no streaks, badges, etc.)
- Privacy-first (local-first where possible)
- Fast interactions (command bar, one-click logging)

## Key Implementation Details

### Auth Flow

1. OAuth only (Google + GitHub) - no email/password
2. Auth UI provided by `@daveyplate/better-auth-ui`
3. Protected routes check session in layout.tsx

### Server Actions

All mutations use Next.js Server Actions:
- Always call `getSession()` to verify auth
- Use `revalidatePath()` after mutations
- Return void from form actions (not data)

### Command Bar

Natural language input for quick logging:
- Type `mag 200mg` to log 200mg of Magnesium
- Fuzzy matching on supplement names
- Tab/Enter to autocomplete suggestions

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret key (generate with: `openssl rand -base64 32`)
- At least ONE OAuth provider must be configured:
  - GitHub: `BETTER_AUTH_GITHUB_CLIENT_ID` + `BETTER_AUTH_GITHUB_CLIENT_SECRET`
  - Google: `BETTER_AUTH_GOOGLE_CLIENT_ID` + `BETTER_AUTH_GOOGLE_CLIENT_SECRET`

### OAuth Redirect URLs

For local development:
- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

For production (replace with your domain):
- GitHub: `https://yourdomain.com/api/auth/callback/github`
- Google: `https://yourdomain.com/api/auth/callback/google`

## Next Steps / TODO

### Completed
- [x] **Interaction Detection**: Query interactions based on logged supplements
- [x] **Data Export**: Allow users to export their logs (JSON/CSV in Settings)
- [x] **Dashboard**: Real-time interaction warnings, quick stack logging
- [x] **Stack Detail**: Show interaction warnings/synergies + ratio warnings per stack
- [x] **Log Page**: Today's interactions sidebar with timing warnings
- [x] **Onboarding Flow**: Template stack selection for new users ("git clone strategy")
- [x] **Ratio Rules**: Stoichiometric balance warnings (Zn:Cu etc.)
- [x] **Timing Rules**: Transporter competition warnings (supplements too close together)

### In Progress
1. **Enhanced Logging**: Time-of-day awareness, notes field
2. **Analytics Dashboard**: Visualize intake patterns over time

### Future
1. **PWA Testing**: Verify installability and offline support
2. **Supplement Database Expansion**: Add more supplements and interactions
3. **Go Engine Integration**: High-performance graph traversal for complex stacks

## Interaction Engine

The interaction checking system (`server/actions/interactions.ts`) provides:

### Core Functions

- `checkInteractions(supplementIds)`: Find interactions between a set of supplements
- `checkRatioWarnings(supplements)`: Check stoichiometric ratio imbalances (e.g., Zn:Cu ratio)
- `checkTimingWarnings(userId, supplementId, loggedAt)`: Check timing conflicts for logged supplements
- `checkLogWarnings(userId, supplementId, dosage, unit, loggedAt)`: Comprehensive check for new log entry
- `getTodayInteractionSummary(userId)`: Dashboard stats (warnings/synergies count)
- `getUserInteractions(userId)`: Detailed interactions for user's stacks

### Interaction Types
- **competition**: Supplements compete for absorption (e.g., Zinc vs Copper)
- **inhibition**: One supplement reduces effect of another (e.g., Caffeine depletes Magnesium)
- **synergy**: Supplements enhance each other (e.g., Vitamin D + K2)

### Warning Types

#### Basic Interactions
Standard supplement interactions stored in the `interaction` table.

#### Ratio Warnings (ratioRule table)
Stoichiometric imbalance detection based on dosage ratios:
- **Example**: Zn:Cu ratio should be 8-15:1. Taking 50mg Zinc with 2mg Copper = 25:1 ratio triggers warning.
- Displayed on stack detail page when adding supplements to a stack.

#### Timing Warnings (timingRule table)
Time-spacing rules for transporter competition:
- **Example**: L-Tyrosine and 5-HTP compete for LNAAT transporter - need 4h apart.
- Displayed on log page when supplements are logged too close together.

### Severity Levels
- **critical** (red): Potentially dangerous, should avoid
- **medium** (yellow): Worth noting, consider timing
- **low** (muted): Minor effect, informational

### Seeded Rules

#### Ratio Rules
| Source | Target | Min Ratio | Max Ratio | 
|--------|--------|-----------|-----------|
| Zinc Picolinate | Copper Bisglycinate | 8:1 | 15:1 |
| Zinc Gluconate | Copper Bisglycinate | 8:1 | 15:1 |

#### Timing Rules
| Source | Target | Min Hours Apart | Reason |
|--------|--------|-----------------|--------|
| L-Tyrosine | 5-HTP | 4h | LNAAT transporter saturation |
| Iron Bisglycinate | Zinc Picolinate | 2h | DMT1 transporter competition |
| Caffeine | Magnesium Glycinate | 2h | Caffeine increases Mg excretion |
| Vitamin B12 | Magnesium Glycinate | 8h | B12 can suppress melatonin |

## Onboarding System (Multi-Step Flow)

New users with 0 stacks see a full-screen onboarding flow with 5 steps:

### Onboarding Steps

1. **Welcome** - Introduction to Stochi features
2. **Goal Selection** - Pick a health goal (Focus, Sleep, Energy, Stress, Health) or skip
3. **Add Supplements** - Search/add supplements with goal-based suggestions
4. **Interactions Review** - See warnings, synergies, and smart suggestions
5. **Save Stack** - Name and save with explanation of what "Stacks" are

### Components (`components/onboarding/`)

- `welcome-flow.tsx` - Main orchestrator with framer-motion animations
- `step-indicator.tsx` - Dot indicators showing current step
- `steps/welcome-step.tsx` - Step 1: Feature introduction
- `steps/goal-step.tsx` - Step 2: Goal picker (skippable)
- `steps/supplements-step.tsx` - Step 3: Supplement search + goal suggestions
- `steps/interactions-step.tsx` - Step 4: Interaction warnings + suggestions
- `steps/save-stack-step.tsx` - Step 5: Name stack + concept explainer

### Server Actions (`server/actions/onboarding.ts`)

- `createStackFromOnboarding(data)` - Creates stack + items from onboarding flow
- `instantiateTemplate(templateKey)` - Legacy: Creates stack from template
- `createEmptyStack()` - Creates blank "My Stack"
- `forkStack(stackId)` - Renames stack to break template detection
- `clearTemplateData(stackId)` - Deletes stack + today's logs

### Data Files

- `server/data/goal-recommendations.ts` - Goal-based supplement suggestions
- `server/data/stack-templates.ts` - Legacy template definitions
