# Stochi

A PWA for biohackers to track supplements and detect molecular interactions.

## Features

- **Supplement Logging** - Track your daily supplement intake with dosage and timing
- **Stack Management** - Create reusable supplement bundles for quick logging
- **Interaction Detection** - Automatic detection of synergies and conflicts between supplements
- **Quick Entry** - Command-bar style input for fast logging

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: BetterAuth
- **Styling**: Tailwind CSS + shadcn/ui

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- Docker (for local PostgreSQL)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/stochi.git
   cd stochi
   ```

2. Install dependencies:
   ```bash
   cd apps/web
   bun install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Start the development server (starts database automatically):
   ```bash
   bun dev
   ```

5. Push the database schema and seed data:
   ```bash
   bun db:push
   bun db:seed
   ```

## Commands

```bash
bun dev              # Start dev server with database
bun check            # Lint + typecheck
bun run format:write # Format code with prettier
bun db:push          # Push schema to database
bun db:seed          # Seed supplements and interactions
```

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── dashboard/    # Main app pages (log, stacks, settings)
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── onboarding/   # Onboarding flow components
│   │   └── stacks/       # Stack-related components
│   ├── server/
│   │   ├── actions/      # Server actions
│   │   ├── db/           # Database schema and queries
│   │   └── better-auth/  # Auth configuration
│   └── styles/           # Global CSS
└── scripts/              # Development scripts
```

## License

MIT
