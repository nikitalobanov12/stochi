# AGENTS.md - Stochi Project

This file provides guidance for AI agents working on the Stochi codebase.

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
│   │   ├── onboarding/                # Onboarding components
│   │   │   ├── select-config-modal.tsx # CLI-styled template picker
│   │   │   └── template-banner.tsx    # Fork/Clear banner for templates
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
│       │   └── stack-templates.ts     # Template stack definitions
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
bun db:push              # Push schema to database
bun db:studio            # Open Drizzle Studio
bun db:seed              # Seed supplements and interactions
```

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
- [x] **Stack Detail**: Show interaction warnings/synergies per stack
- [x] **Log Page**: Today's interactions sidebar
- [x] **Onboarding Flow**: Template stack selection for new users ("git clone strategy")

### In Progress
1. **Enhanced Logging**: Time-of-day awareness, notes field
2. **Analytics Dashboard**: Visualize intake patterns over time

### Future
1. **PWA Testing**: Verify installability and offline support
2. **Supplement Database Expansion**: Add more supplements and interactions
3. **Go Engine Integration**: High-performance graph traversal for complex stacks

## Interaction Engine

The interaction checking system (`server/actions/interactions.ts`) provides:

- `checkInteractions(supplementIds)`: Find interactions between a set of supplements
- `getTodayInteractionSummary(userId)`: Dashboard stats (warnings/synergies count)
- `getUserInteractions(userId)`: Detailed interactions for user's stacks

### Interaction Types
- **competition**: Supplements compete for absorption (e.g., Zinc vs Copper)
- **inhibition**: One supplement reduces effect of another (e.g., Caffeine depletes Magnesium)
- **synergy**: Supplements enhance each other (e.g., Vitamin D + K2)

### Severity Levels
- **critical** (red): Potentially dangerous, should avoid
- **medium** (yellow): Worth noting, consider timing
- **low** (muted): Minor effect, informational

## Onboarding System ("Git Clone Strategy")

New users with 0 stacks see a CLI-styled modal to select a template stack. This demonstrates the interaction engine immediately.

### Templates Available

| Template | Supplements | Interactions |
|----------|-------------|--------------|
| **Focus Protocol** | Caffeine 100mg, L-Theanine 200mg, L-Tyrosine 500mg | 1 synergy |
| **Mineral Balance** | Magnesium Glycinate 400mg, Zinc Picolinate 30mg, Iron Bisglycinate 18mg | 2 conflicts |
| **Daily Essentials** | Vitamin D3 5000 IU, Vitamin K2 MK-7 100mcg, Magnesium Glycinate 400mg | 1 synergy |

### Server Actions (`server/actions/onboarding.ts`)

- `instantiateTemplate(templateKey)`: Creates stack + items + logs for today @ 8am
- `createEmptyStack()`: Creates blank "My Stack" for power users
- `forkStack(stackId)`: Renames stack to "(Custom)" to remove template detection
- `clearTemplateData(stackId)`: Deletes stack + today's logs (nuclear reset)

### Template Detection

Templates are detected by exact name match. If user renames the stack, the template banner disappears (they've "forked" it).

### Files

- `server/data/stack-templates.ts`: Template definitions
- `components/onboarding/select-config-modal.tsx`: CLI-styled picker modal
- `components/onboarding/template-banner.tsx`: Fork/Clear banner
