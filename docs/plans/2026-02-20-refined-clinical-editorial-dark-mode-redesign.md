# Refined Clinical Editorial Dark Mode Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the app from mixed "terminal-ish" styling to a polished, cohesive dark-first Refined Clinical Editorial design language without changing core product flows.

**Architecture:** Ship the redesign in layers: first establish global design tokens and typography contracts, then migrate UI primitives, then migrate shell/navigation, then refactor high-impact dashboard and landing surfaces. Keep behavior and data flow intact; this is a visual-system migration with strict tokenization and consistency checks.

**Tech Stack:** Next.js App Router, React, Tailwind v4 token pipeline in `globals.css`, shadcn/ui primitives, framer-motion, Bun check/format workflow.

---

### Task 1: Establish design token foundation (dark-first editorial)

**Files:**
- Modify: `apps/web/src/styles/globals.css`

**Step 1: Write the failing test**

Create a token presence check to ensure required semantic variables are defined.

```ts
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("editorial semantic tokens exist", () => {
  const css = readFileSync("apps/web/src/styles/globals.css", "utf8");
  expect(css.includes("--surface-0")).toBe(true);
  expect(css.includes("--text-primary")).toBe(true);
  expect(css.includes("--accent-data")).toBe(true);
});
```

**Step 2: Run test to verify baseline**

Run: `bun test apps/web/src/styles/globals.tokens.test.ts`
Expected: FAIL (tokens not yet present).

**Step 3: Write minimal implementation**

- Add semantic tokens in `:root` and `.dark` for:
  - surfaces (`--surface-0` ... `--surface-3`)
  - text hierarchy (`--text-primary`, `--text-secondary`, `--text-tertiary`)
  - data accents (`--accent-data`, `--accent-warning`, `--accent-danger`, `--accent-info`)
  - borders/focus/elevation/motion durations.
- Map existing shadcn variables (`--background`, `--card`, `--muted-foreground`, etc.) to semantic tokens.
- Preserve existing status utility class API for compatibility.

**Step 4: Run check**

Run: `bun run check`
Expected: PASS with 0 errors and 0 warnings.

**Step 5: Commit**

```bash
git add apps/web/src/styles/globals.css apps/web/src/styles/globals.tokens.test.ts
git commit -m "refactor(ui): add dark editorial semantic token foundation"
```

### Task 2: Replace generic typography with editorial pair

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/styles/globals.css`

**Step 1: Write the failing test**

Add a font contract test asserting Inter is removed from active sans stack and editorial fonts are wired.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/app/layout.typography.test.ts`
Expected: FAIL because current layout imports Inter.

**Step 3: Write minimal implementation**

- Replace Inter with an editorial body font + distinctive display font.
- Keep JetBrains Mono for dense numeric/system data only.
- Expose variables (`--font-sans`, `--font-display`, `--font-mono`) and add utility classes:

```css
.font-display { font-family: var(--font-display); }
.text-editorial-kicker { letter-spacing: 0.14em; text-transform: uppercase; }
```

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/app/layout.typography.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/styles/globals.css apps/web/src/app/layout.typography.test.ts
git commit -m "feat(ui): introduce editorial typography system"
```

### Task 3: Migrate primitive UI components to token-driven polish

**Files:**
- Modify: `apps/web/src/components/ui/button.tsx`
- Modify: `apps/web/src/components/ui/card.tsx`
- Modify: `apps/web/src/components/ui/input.tsx`
- Modify: `apps/web/src/components/ui/badge.tsx`
- Modify: `apps/web/src/components/ui/dialog.tsx`

**Step 1: Write the failing test**

Add simple style-contract tests for variant classnames (button/card states include semantic classes).

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/components/ui/primitives.contract.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Remove hardcoded hex-heavy styling from primitives.
- Encode editorial behavior in primitives:
  - clear hover/active/disabled states
  - crisp borders and depth
  - stronger focus rings
  - consistent radius and spacing.
- Keep existing prop/variant APIs stable.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/components/ui/primitives.contract.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/ui/button.tsx apps/web/src/components/ui/card.tsx apps/web/src/components/ui/input.tsx apps/web/src/components/ui/badge.tsx apps/web/src/components/ui/dialog.tsx apps/web/src/components/ui/primitives.contract.test.ts
git commit -m "refactor(ui): migrate core primitives to editorial token system"
```

### Task 4: Redesign dashboard shell and navigation hierarchy

**Files:**
- Modify: `apps/web/src/app/dashboard/layout.tsx`
- Modify: `apps/web/src/components/nav-links.tsx`

**Step 1: Write the failing test**

Add nav behavior/style test for active/inactive classes and mobile accessibility labels.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/components/nav-links.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Introduce editorial shell treatment:
  - cleaner header rhythm
  - softer but clearer active nav indicators
  - stronger visual grouping of account controls.
- Keep route structure and interactions unchanged.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/components/nav-links.test.tsx`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/layout.tsx apps/web/src/components/nav-links.tsx apps/web/src/components/nav-links.test.tsx
git commit -m "feat(ui): apply editorial shell and nav hierarchy"
```

### Task 5: Migrate high-traffic dashboard cards to editorial language

**Files:**
- Modify: `apps/web/src/components/dashboard/bio-score-card.tsx`
- Modify: `apps/web/src/components/dashboard/optimization-hud.tsx`

**Step 1: Write the failing test**

Add UI smoke tests ensuring critical card labels/actions still render after style migration.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/components/dashboard/editorial-cards.test.tsx`
Expected: FAIL before test fixtures and adjustments.

**Step 3: Write minimal implementation**

- Replace legacy "glass/terminal" visual remnants with editorial card composition:
  - restrained color blocks
  - cleaner typography hierarchy
  - reduced visual clutter in badges/timers/chips.
- Keep all logic, interactions, and warning semantics intact.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/components/dashboard/editorial-cards.test.tsx`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/dashboard/bio-score-card.tsx apps/web/src/components/dashboard/optimization-hud.tsx apps/web/src/components/dashboard/editorial-cards.test.tsx
git commit -m "refactor(dashboard): migrate core cards to refined editorial styling"
```

### Task 6: Align landing page with product UI language

**Files:**
- Modify: `apps/web/src/app/landing-page.tsx`
- Modify: `apps/web/src/styles/globals.css` (landing-specific utilities only)

**Step 1: Write the failing test**

Add a landing smoke test for key copy/CTA blocks so redesign does not break structure.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/app/landing-page.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Keep content architecture, but re-style to editorial dark system:
  - typography hierarchy and rhythm
  - cohesive button/card language matching app shell
  - reduced "busy" decoration and tighter motion choreography.
- Ensure desktop + mobile visual parity.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/app/landing-page.test.tsx`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/landing-page.tsx apps/web/src/styles/globals.css apps/web/src/app/landing-page.test.tsx
git commit -m "feat(landing): align marketing surfaces to editorial dark system"
```

### Task 7: Normalize motion and accessibility quality gates

**Files:**
- Modify: `apps/web/src/styles/globals.css`
- Modify: affected components using ad-hoc animations

**Step 1: Write the failing test**

Add a reduced-motion and focus-visible style presence check in CSS tests.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/styles/globals.a11y.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

- Standardize motion durations/easing tokens.
- Keep one meaningful load choreography and remove low-value micro-motion.
- Ensure `prefers-reduced-motion` coverage and strong keyboard focus visibility.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/styles/globals.a11y.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/styles/globals.css apps/web/src/styles/globals.a11y.test.ts
git commit -m "fix(ui): standardize motion and accessibility states"
```

### Task 8: Documentation + visual QA signoff

**Files:**
- Create: `docs/design-language/refined-clinical-editorial.md`
- Modify: `BACKLOG.md`

**Step 1: Write docs draft**

Document:
- token glossary and usage rules
- typography system and when to use display/sans/mono
- do/don't examples for cards, nav, callouts, status chips.

**Step 2: Run formatting and checks**

Run:
- `bun run format:write`
- `bun run check`

Expected: PASS.

**Step 3: Manual visual QA pass**

Run: `bun dev`

Manual checks:
- `/` on mobile + desktop
- `/dashboard`, `/dashboard/log`, `/dashboard/stacks`, `/dashboard/settings`
- focus states (keyboard), reduced-motion preference, color contrast.

**Step 4: Track completion in backlog**

- Mark redesign epic completed and add follow-up ideas to `Ideas/Future`.

**Step 5: Commit**

```bash
git add docs/design-language/refined-clinical-editorial.md BACKLOG.md
git commit -m "docs(ui): add refined clinical editorial design language guide"
```
