# 📋 Stochi Product Backlog

**Current Status:** Execution Phase
**Goal:** Ship MVP (PWA with Command Bar & Interaction Engine)

---

## 🔴 Phase 1: The Data Foundation ✅ COMPLETE

_The app currently lacks domain logic. We need to define the "Bio-Hacker" entities before building UI._

- [x] **Database Schema (`apps/web/src/server/db/schema.ts`)**
  - [x] Create `supplements` table (UUID, name, form, search_vector).
  - [x] Create `stacks` table (User defined routines).
  - [x] Create `stack_items` join table (Many-to-Many between Stack and Supplement).
  - [x] Create `logs` table (Timestamped intake records).
  - [x] Create `interactions` table (supplement-to-supplement relationships).
  - [x] Create `ratio_rule` table (stoichiometric balance rules).
  - [x] Create `timing_rule` table (supplement spacing rules).
  - [x] Run `npm run db:generate` & `npm run db:migrate` to sync with Neon.
- [x] **Seed Data**
  - [x] Create a seed script (`src/server/db/seed.ts`) with top 50 common supplements.
  - [x] Seed 31 interaction rules (competition, inhibition, synergy).
  - [x] Seed 2 ratio rules (Zn:Cu balance).
  - [x] Seed 10 timing rules (NAC, Berberine, Caffeine spacing, etc.).
  - [x] Client-side AI embeddings via `@huggingface/transformers` (replaces server-side search_vector).

---

## 🟠 Phase 2: The PWA Platform (In Progress)

_Make it installable on mobile immediately so we can test the "gym basement" use case._

- [x] **PWA Configuration**
  - [x] Install `next-pwa` package (`@ducanh2912/next-pwa`).
  - [x] Update `next.config.js` to wrap the config with `withPWA`.
  - [x] Add `manifest.json` to `public/` (Name: Stochi, Theme Color: #0D1117).
  - [ ] Add iOS splash screen meta tags to `layout.tsx`.
  - [ ] Generate PNG icons (192x192, 512x512) from logo.svg.
- [x] **Mobile Layout**
  - [x] Create `BottomNav` component (Dashboard, Stacks, Log, Settings).
  - [ ] Ensure all touch targets are min 44px height.

---

## 🟡 Phase 3: The Command Bar (Core UI)

_The primary input method. Needs to be fast, offline-capable, and "smart."_

- [x] **AI / Parsing Engine**
  - [x] Install `@huggingface/transformers` for client-side inference.
  - [x] Create `workers/semantic-search.worker.ts` (Web Worker) to load the ONNX model without freezing UI.
  - [x] Implement Regex Parser for dosage (e.g., extracts `200mg` instantly).
- [ ] **Command Component**
  - [ ] Install `cmdk` (Shadcn command menu).
  - [ ] Refactor `<CommandBar />` to use cmdk primitives.
  - [ ] Implement "Optimistic UI" - show result instantly, update database in background.

---

## 🟢 Phase 4: The Go Engine (Backend Logic)

_The "Brain" that calculates interactions. Decoupled from the Next.js frontend._

- [ ] **Service Setup**
  - [ ] Initialize Go module: `go mod init github.com/nikitalobanov12/stochi/apps/engine`
  - [ ] Install `sqlc` and `pgx` driver.
  - [ ] Configure `sqlc.yaml` to read migrations from `apps/web/drizzle`.
  - [ ] Setup pgxpool with SSL for Neon connection.
- [ ] **Auth Middleware (Zero Trust)**
  - [ ] Validate session token by querying `session` table directly.
  - [ ] Reject unauthorized requests.
- [ ] **Interaction Logic**
  - [ ] Create `GET /health` endpoint (Railway check).
  - [ ] Create `POST /api/analyze` endpoint.
  - [ ] Implement graph traversal for:
    - [ ] Competitive Inhibition (e.g., Zinc vs Copper).
    - [ ] Absorption Block (e.g., Caffeine vs Creatine).
    - [ ] Ratio warnings (stoichiometric balance).
    - [ ] Timing warnings (supplement spacing).
  - [ ] Return "Traffic Light" status (Red/Yellow/Green) JSON to frontend.
- [ ] **Deployment**
  - [ ] Create Dockerfile (multi-stage build).
  - [ ] Configure railway.toml.

---

## 🔵 Phase 5: Integration & Cleanup

_Connect the two halves and remove duplication._

- [ ] **Frontend Integration**
  - [ ] Add `ENGINE_URL` to env.js.
  - [ ] Create Go client utility for API calls.
  - [ ] Update dashboard pages to fetch from Go engine.
  - [ ] Delete `src/server/actions/interactions.ts` (TS logic replaced by Go).
- [x] **Onboarding**
  - [x] Create `focus-protocol` and `mineral-balance` seed templates.
  - [x] Build 4-step onboarding wizard for new users.
  - [ ] CLI-style empty states (`> init stack configuration...`) - optional polish.

---

## 🧊 Icebox (Future / Post-MVP)

- [ ] **OCR Label Scanning:** Upload photo of bottle -> Textract -> Match Supplement.
- [ ] **RAG Medical Search:** "Chat with your stack" using vector search on PubMed abstracts.
- [ ] **Wearable Integration:** Sync sleep data from Apple Health (requires native wrapper later).
- [ ] **Scan Tab:** Barcode/QR scanning for supplement bottles.
