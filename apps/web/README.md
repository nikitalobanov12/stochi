# Stochi Web App

The main web application for Stochi - a supplement tracking PWA.

## Development

### Prerequisites

- [Bun](https://bun.sh/)
- Docker

### Quick Start

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start dev server (auto-starts database)
bun dev

# Push schema and seed data
bun db:push
bun db:seed
```

### Commands

```bash
bun dev              # Start dev server with database
bun check            # Lint + typecheck
bun run format:write # Format code
bun db:push          # Push schema to database
bun db:seed          # Seed supplements and interactions
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (sign-in, sign-up)
│   ├── api/                # API routes
│   └── dashboard/          # Main app pages
│       ├── log/            # Supplement logging
│       ├── stacks/         # Stack management
│       └── settings/       # User settings
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── onboarding/         # Onboarding flow
│   ├── stacks/             # Stack components
│   └── log/                # Log components
├── server/
│   ├── actions/            # Server actions
│   ├── db/                 # Drizzle schema & queries
│   ├── better-auth/        # Auth configuration
│   └── data/               # Static data (templates)
└── styles/                 # Global CSS
```

## Key Features

### Onboarding Flow
New users see a "Select Config" modal with starter templates:
- Focus Protocol (Caffeine + L-Theanine + L-Tyrosine)
- Mineral Balance (Magnesium + Zinc + Iron)  
- Daily Essentials (Vitamin D3 + K2 + Magnesium)

Templates create a stack with items and logs to demonstrate the interaction engine.

### Interaction Detection
The app detects supplement interactions:
- **Synergies** - beneficial combinations (e.g., Vitamin D3 + K2)
- **Conflicts** - potentially harmful combinations with severity levels

### Stack Templates
Users can create stacks from templates or start empty. Templates pre-populate supplements with recommended dosages.

## Tech Stack

- **Next.js 15** - App Router, Server Actions
- **Bun** - Runtime & package manager
- **PostgreSQL** - Database
- **Drizzle ORM** - Type-safe database queries
- **BetterAuth** - Authentication
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
