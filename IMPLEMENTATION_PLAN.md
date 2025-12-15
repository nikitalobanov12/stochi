# Stochi MVP Implementation Plan

**Status:** Execution Phase  
**Architecture:** Next.js (PWA/UI/AI) + Go (Computation/Graph Engine)  
**Database:** PostgreSQL (Neon) via Drizzle (Schema) & sqlc (Go Queries)

---

## Architectural Decisions (Finalized)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Go Module Path | `github.com/nikitalobanov12/stochi/apps/engine` | Standard Go practice, prevents import issues, tooling-friendly |
| ENV Variable | `ENGINE_URL` | Matches folder structure, not implementation-specific, future-proof for OCR |
| Auth in Go | Session validation (Zero Trust) | Security-first, data integrity, trivial with sqlc (~5 lines) |

---

## Phase 1: Data Foundation & Schema

- [ ] **1.1 Schema Verification** - Schema already exists, verify completeness
- [ ] **1.2 Seed Data Expansion (24 → 50 supplements)**
  - [ ] B-Vitamins: B1, B2, B3, B6, Folate
  - [ ] Minerals: Calcium, Potassium, Boron, Iodine, Chromium
  - [ ] Antioxidants: CoQ10, Alpha Lipoic Acid, NAC, Quercetin, Glutathione
  - [ ] Nootropics: Lion's Mane, Rhodiola, Bacopa, GABA, Glycine
  - [ ] Other: Taurine, Collagen, Biotin, Berberine, Omega-3 DHA
- [ ] **1.3 Add Missing Interactions**
  - [ ] Caffeine vs Creatine (inhibition, medium)
  - [ ] Calcium vs Iron (competition, medium)
  - [ ] Calcium vs Zinc (competition, medium)
  - [ ] NAC + Vitamin C (synergy, low)
  - [ ] B-vitamin synergies
  - [ ] Berberine vs B6 (inhibition, medium)
  - [ ] Alpha Lipoic Acid + CoQ10 (synergy, low)
- [ ] **1.4 Add Timing Rules**
  - [ ] NAC: 2 hours from meals
  - [ ] Berberine: 30 min before meals

---

## Phase 2: PWA Platform Polish

- [ ] **2.1 Touch Targets** - Update `MobileNavLink` to `min-h-[44px]`
- [ ] **2.2 Generate PNG Icons** - 192x192 and 512x512 from logo.svg
- [ ] **2.3 Update manifest.json** - Add PNG icons
- [ ] **2.4 iOS Splash Screens** - Generate and add `apple-touch-startup-image` links

---

## Phase 3: Command Bar (cmdk Refactor)

- [ ] **3.1 Install cmdk** - `npx shadcn@latest add command`
- [ ] **3.2 Refactor CommandBar** - Use cmdk primitives with `shouldFilter={false}`
- [ ] **3.3 Optimistic UI** - Add `useOptimistic` for instant log feedback

---

## Phase 4: Go Engine

- [ ] **4.1 Project Scaffolding**
  - [ ] `go mod init github.com/nikitalobanov12/stochi/apps/engine`
  - [ ] Create directory structure (cmd/, internal/, sql/)
  - [ ] Create Makefile, Dockerfile, railway.toml
- [ ] **4.2 sqlc Configuration**
  - [ ] Sync schema from Drizzle migrations
  - [ ] Configure sqlc.yaml with pgx/v5
  - [ ] Generate Go code
- [ ] **4.3 Database Connection**
  - [ ] pgxpool setup for Neon (SSL, connection limits)
  - [ ] Config loading from environment
- [ ] **4.4 Auth Middleware (Zero Trust)**
  - [ ] Query `session` table to validate tokens
  - [ ] Reject unauthorized requests
- [ ] **4.5 API Endpoints**
  - [ ] `GET /health`
  - [ ] `POST /api/analyze` - Main interaction check endpoint
- [ ] **4.6 Interaction Logic**
  - [ ] Direct interactions (competition, inhibition, synergy)
  - [ ] Ratio warnings (stoichiometric balance)
  - [ ] Timing warnings (supplement spacing)
  - [ ] Traffic light status (red/yellow/green)
- [ ] **4.7 Railway Deployment**
  - [ ] Dockerfile (multi-stage build)
  - [ ] railway.toml configuration

---

## Phase 5: Integration & Cleanup

- [ ] **5.1 Add `ENGINE_URL` to env.js** - Zod schema for type-safe env
- [ ] **5.2 Create Go client utility** - Fetch wrapper for engine API
- [ ] **5.3 Update dashboard pages** - Replace TS imports with Go API calls
- [ ] **5.4 Delete `interactions.ts`** - Remove TypeScript interaction logic
- [ ] **5.5 CLI-style empty states** - Optional polish

---

## Execution Timeline

| Day | Phase | Tasks |
|-----|-------|-------|
| 1 | Phase 1 | Seed expansion + interactions |
| 1 | Phase 2 | PWA polish (icons, touch targets, splash) |
| 2 | Phase 3 | cmdk refactor + optimistic UI |
| 3-4 | Phase 4.1-4.4 | Go scaffolding, sqlc, auth |
| 4-5 | Phase 4.5-4.7 | API endpoints, logic, deployment |
| 6 | Phase 5 | Integration, cleanup, testing |

---

## Progress Tracking

Use checkboxes above. Mark `[x]` as tasks complete.
