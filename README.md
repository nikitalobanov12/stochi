# stochi_

> Stoichiometric engine for bio-optimization. Track supplements, detect molecular interactions, model pharmacokinetics — all in real time.

**[Live Demo](https://stochi.vercel.app/demo)** (no account required) | **[GitHub](https://github.com/nikitalobanov12/stochi)**

---

## What Makes This Interesting

- **Dual-Engine Architecture**: Go microservice handles graph traversal and PK modeling with an 8-second timeout. If unavailable, the app seamlessly falls back to a TypeScript implementation — zero downtime, same results.

- **Real Pharmacokinetic Modeling**: First-order and Michaelis-Menten kinetics using the Lambert W0 function. Models absorption, peak, and elimination phases per compound to compute real-time biological state.

- **pgvector RAG Pipeline**: Semantic search over a supplement knowledge base using OpenAI embeddings (text-embedding-3-small, 1536 dimensions). Falls back to client-side Transformers.js web worker when no API key is available.

- **Stoichiometric Ratio Engine**: Monitors mineral ratios (e.g., Zn:Cu 8-15:1) with elemental weight adjustments. Warns when ratios deviate from therapeutic ranges based on actual pharmacological data.

## Features

### Core
- Supplement logging with dosage, timing, and form
- Stack management for reusable supplement bundles
- Command bar with natural language parsing
- PWA with offline support and service worker caching

### Analysis
- Bio-Score composite metric (PK state + exclusion zones + optimization opportunities)
- Biological timeline with concentration curves
- Active compounds HUD with real-time decay modeling
- Stoichiometric ratio monitoring

### Intelligence
- Three interaction types: synergy/competition/inhibition, ratio rules, timing rules
- Severity classification: low, medium, critical
- Real pharmacological basis: DMT1 transporter, LNAAT competition, CYP450 pathways
- RAG-powered Q&A in the "Learn" section

## Architecture

```
stochi/
├── apps/
│   ├── web/          # Next.js 15 frontend + API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/     # Protected routes
│   │   │   │   ├── demo/          # Public demo (no auth)
│   │   │   │   └── api/           # API routes + auth
│   │   │   ├── components/
│   │   │   │   ├── dashboard/     # Bio-score, timeline, HUD
│   │   │   │   ├── demo/          # Demo provider + data
│   │   │   │   ├── interactions/  # Warning cards
│   │   │   │   ├── log/           # Command bar, log list
│   │   │   │   ├── onboarding/    # Multi-step flow
│   │   │   │   └── stacks/        # Stack management
│   │   │   ├── lib/
│   │   │   │   └── engine/        # Go engine HTTP client
│   │   │   ├── server/
│   │   │   │   ├── actions/       # Server actions
│   │   │   │   ├── services/      # PK modeling, RAG, analytics
│   │   │   │   └── db/            # Drizzle schema + migrations
│   │   │   └── workers/           # Transformers.js web worker
│   │   └── drizzle/               # Migration files
│   └── engine/       # Go microservice
│       ├── cmd/server/            # Entry point
│       └── internal/
│           ├── handlers/          # HTTP handlers
│           ├── kinetics/          # PK math (Lambert W, MM)
│           └── models/            # Request/response types
└── packages/                      # Shared configs
```

### Go Engine Fallback Pattern

The Go engine (`apps/engine/`) provides high-performance graph traversal and pharmacokinetic calculations. The Next.js app calls it via HTTP with an 8-second timeout. If the engine is unavailable or times out, the app transparently switches to an equivalent TypeScript implementation — ensuring the application remains fully functional regardless of engine availability.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Engine | Go microservice |
| Runtime | Bun |
| Database | PostgreSQL + pgvector (Neon) |
| ORM | Drizzle ORM |
| Auth | BetterAuth (Google, GitHub OAuth) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Monorepo | Turborepo |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- Docker (for local PostgreSQL)

### Setup

```bash
# Clone
git clone https://github.com/nikitalobanov12/stochi.git
cd stochi

# Install dependencies
bun install

# Configure environment
cp apps/web/.env.example apps/web/.env

# Start development server (includes database)
bun dev

# Run migrations and seed data
cd apps/web && bun db:migrate && bun db:seed
```

### Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server (Turbo) |
| `bun check` | Lint + typecheck |
| `bun run format:write` | Format with Prettier |
| `bun db:generate` | Generate migration from schema |
| `bun db:migrate` | Apply pending migrations |
| `bun db:seed` | Seed supplements and interactions |
| `bun db:studio` | Open Drizzle Studio GUI |

## Author

**Nikita Lobanov** — [GitHub](https://github.com/nikitalobanov12)

## License

MIT
