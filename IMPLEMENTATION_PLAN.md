# Stochi MVP Implementation Plan

**Status:** Phase 5 (Integration)  
**Architecture:** Next.js (PWA/UI/AI) + Go (Computation/Graph Engine)  
**Database:** PostgreSQL (Neon) via Drizzle (Schema) & pgx (Go Queries)

---

## Architectural Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Go Module Path | `github.com/nikitalobanov12/stochi/apps/engine` | Standard Go practice, prevents import issues, tooling-friendly |
| ENV Variable | `ENGINE_URL` | Matches folder structure, not implementation-specific, future-proof for OCR |
| Auth in Go | Session validation (Zero Trust) | Security-first, data integrity, trivial (~5 lines) |
| DB Driver | pgx/v5 (no sqlc) | Direct queries simpler for MVP, sqlc adds complexity without significant benefit |

---

## Phase 1: Data Foundation & Schema ✅

- [x] **1.1 Schema Verification** - Schema complete with all required tables
- [x] **1.2 Seed Data Expansion (24 → 50 supplements)**
  - [x] B-Vitamins: B1, B2, B3, B6, Folate
  - [x] Minerals: Calcium, Potassium, Boron, Iodine, Chromium
  - [x] Antioxidants: CoQ10, Alpha Lipoic Acid, NAC, Quercetin, Glutathione
  - [x] Nootropics: Lion's Mane, Rhodiola, Bacopa, GABA, Glycine
  - [x] Other: Taurine, Collagen, Biotin, Berberine
- [x] **1.3 Add Missing Interactions** - 31 interactions seeded
- [x] **1.4 Add Timing Rules** - 10 timing rules seeded

---

## Phase 2: PWA Platform Polish ✅

- [x] **2.1 Touch Targets** - Updated to min 44px for mobile
- [x] **2.2 Generate PNG Icons** - 192x192 and 512x512
- [x] **2.3 Update manifest.json** - Added PNG icons
- [x] **2.4 iOS Splash Screens** - 11 splash screens for all iOS devices

---

## Phase 3: Command Bar (cmdk Refactor) ✅

- [x] **3.1 Install cmdk** - `npx shadcn@latest add command`
- [x] **3.2 Refactor CommandBar** - Use cmdk primitives with `shouldFilter={false}`
- [x] **3.3 Optimistic UI** - Add instant pending feedback for log entries

---

## Phase 4: Go Engine ✅

- [x] **4.1 Project Scaffolding**
  - [x] `go mod init github.com/nikitalobanov12/stochi/apps/engine`
  - [x] Create directory structure (cmd/, internal/)
  - [x] Create Makefile, Dockerfile, railway.toml
- [x] **4.2 Database Connection**
  - [x] pgxpool setup for Neon (SSL, connection limits)
  - [x] Config loading from environment
- [x] **4.3 Auth Middleware (Zero Trust)**
  - [x] Query `session` table to validate tokens
  - [x] Reject unauthorized requests
- [x] **4.4 API Endpoints**
  - [x] `GET /health`
  - [x] `POST /api/analyze` - Main interaction check endpoint
- [x] **4.5 Interaction Logic**
  - [x] Direct interactions (competition, inhibition, synergy)
  - [x] Timing warnings (supplement spacing)
  - [x] Traffic light status (red/yellow/green)
- [x] **4.6 Railway Deployment**
  - [x] Dockerfile (multi-stage build)
  - [x] railway.toml configuration

---

## Phase 5: Integration & Cleanup (In Progress)

- [x] **5.1 Add `ENGINE_URL` to env.js** - Zod schema for type-safe env
- [x] **5.2 Create Go client utility** - Fetch wrapper for engine API
- [ ] **5.3 Update dashboard pages** - Optionally use Go API when available
- [ ] **5.4 Keep `interactions.ts`** - Keep as fallback when engine not configured

---

## Next Steps

1. Deploy Go engine to Railway
2. Set `ENGINE_URL` environment variable in production
3. Test end-to-end interaction analysis via Go engine
4. Monitor performance and error rates

---

## Files Created

### Go Engine (`apps/engine/`)
- `cmd/server/main.go` - Entry point, HTTP server setup
- `internal/auth/auth.go` - Session validation middleware
- `internal/config/config.go` - Environment configuration
- `internal/db/db.go` - pgxpool database connection
- `internal/handlers/handlers.go` - HTTP handlers
- `internal/models/types.go` - Type definitions
- `Dockerfile` - Multi-stage build
- `railway.toml` - Railway deployment config
- `Makefile` - Build commands

### Next.js Integration (`apps/web/`)
- `src/lib/engine/client.ts` - Go engine client utility
- `src/env.js` - Added ENGINE_URL

---

## Progress Tracking

Use checkboxes above. Mark `[x]` as tasks complete.
