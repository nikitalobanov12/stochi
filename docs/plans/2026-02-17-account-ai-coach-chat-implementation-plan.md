# Account AI Coach Chat Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Whoop-style in-app AI coach chat that reads the user account's last 7 days of Stochi data and provides clear explanations plus actionable suggestions.

**Architecture:** Build a new dashboard Coach page with a client chat UI and a server action that composes a strict, grounded account context before calling the existing Llama client. Keep v1 stateless (no DB chat history) to ship fast and reduce migration risk. Enforce guardrails in prompt + response validation so output remains non-diagnostic, data-grounded, and scoped to user-visible app actions.

**Tech Stack:** Next.js App Router, React client components, Server Actions, Drizzle ORM, existing analytics + interactions services, HuggingFace Llama integration, Bun test/check.

---

### Task 1: Add coach route to navigation

**Files:**
- Modify: `apps/web/src/components/nav-links.tsx`
- Modify: `apps/web/src/app/dashboard/layout.tsx`

**Step 1: Write the failing test**

Create a tiny route snapshot assertion for nav labels in a new UI smoke test file.

```ts
import { expect, test } from "bun:test";

test("coach route is present in dashboard nav config", () => {
  const navLabels = ["Dashboard", "Protocol", "Stacks", "Log", "Coach"];
  expect(navLabels.includes("Coach")).toBe(true);
});
```

**Step 2: Run test to verify baseline**

Run: `bun test apps/web/src/components/nav-links.test.ts`
Expected: PASS (placeholder sanity test confirms test runner wiring)

**Step 3: Write minimal implementation**

- Add a new `coach` icon key in `iconMap`.
- Add desktop and mobile nav entries pointing to `/dashboard/coach`.

**Step 4: Run check**

Run: `bun run check`
Expected: PASS with 0 errors and 0 warnings.

**Step 5: Commit**

```bash
git add apps/web/src/components/nav-links.tsx apps/web/src/app/dashboard/layout.tsx apps/web/src/components/nav-links.test.ts
git commit -m "feat(coach): add dashboard navigation entry"
```

### Task 2: Build account context service for 7-day coaching

**Files:**
- Create: `apps/web/src/server/services/coach-context.ts`
- Test: `apps/web/src/server/services/coach-context.test.ts`

**Step 1: Write the failing test**

Write tests for pure mappers in `coach-context.ts`:
- aggregates logs per supplement over 7 days
- computes adherence percent from stack completion
- summarizes warning counts by severity

```ts
import { expect, test } from "bun:test";
import { summarizeWarnings } from "./coach-context";

test("summarizeWarnings groups by severity", () => {
  const result = summarizeWarnings([
    { severity: "critical" },
    { severity: "medium" },
    { severity: "medium" },
  ] as Array<{ severity: "low" | "medium" | "critical" }>);

  expect(result).toEqual({ critical: 1, medium: 2, low: 0 });
});
```

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/server/services/coach-context.test.ts`
Expected: FAIL with missing export/function.

**Step 3: Write minimal implementation**

- Add `getCoachContext(userId, timezone)` that returns:
  - last 7 days log totals and top supplements
  - stack adherence signal
  - interaction/ratio/timing warning summary
  - concise bullet facts for prompt grounding
- Export pure helpers for testability (`summarizeWarnings`, `summarizeAdherence`, `buildCoachFacts`).

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/server/services/coach-context.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/server/services/coach-context.ts apps/web/src/server/services/coach-context.test.ts
git commit -m "feat(coach): add 7-day account context builder"
```

### Task 3: Add coach prompt builder with action-oriented guardrails

**Files:**
- Create: `apps/web/src/lib/ai/coach-prompts.ts`
- Test: `apps/web/src/lib/ai/coach-prompts.test.ts`

**Step 1: Write the failing test**

Test prompt generation requirements:
- must include "last 7 days"
- must include "not medical advice"
- must include action format requirement ("What this means" + "What to do next")

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/lib/ai/coach-prompts.test.ts`
Expected: FAIL because file/functions do not exist.

**Step 3: Write minimal implementation**

- Add `buildCoachSystemPrompt()` and `buildCoachUserPrompt(context, question)`.
- Keep strict grounding rules: only use provided context; if missing data, say so explicitly.
- Force concise structure: interpretation + actionable steps + confidence caveat.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/lib/ai/coach-prompts.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/lib/ai/coach-prompts.ts apps/web/src/lib/ai/coach-prompts.test.ts
git commit -m "feat(coach): add grounded prompt templates for account coaching"
```

### Task 4: Implement server action for coach responses

**Files:**
- Create: `apps/web/src/server/actions/coach-chat.ts`
- Modify: `apps/web/src/server/services/llama-client.ts` (only if new helper is truly required)
- Test: `apps/web/src/server/actions/coach-chat.test.ts`

**Step 1: Write the failing test**

Cover:
- unauthenticated user returns error
- empty question validation
- successful path composes context and calls LLM
- fallback path when LLM unavailable returns deterministic explanation shell

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/server/actions/coach-chat.test.ts`
Expected: FAIL with missing module/exports.

**Step 3: Write minimal implementation**

- Add action `askCoachQuestion(question: string)` returning:
  - `answer`
  - `highlights` (array of short actionable bullets)
  - `usedWindowDays: 7`
  - `error?`
- Use existing `getSession`, `getUserPreferences`, `getCoachContext`, and `generateCompletion`.
- Add lightweight in-memory cache keyed by user + normalized question (TTL 30 min).

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/server/actions/coach-chat.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/server/actions/coach-chat.ts apps/web/src/server/actions/coach-chat.test.ts apps/web/src/server/services/llama-client.ts
git commit -m "feat(coach): add server action for personalized 7-day chat guidance"
```

### Task 5: Build coach chat UI component

**Files:**
- Create: `apps/web/src/components/coach/coach-chat.tsx`
- Create: `apps/web/src/components/coach/coach-message.tsx`
- Create: `apps/web/src/components/coach/coach-empty-state.tsx`

**Step 1: Write the failing test**

Add component behavior tests for:
- input submit disabled on empty text
- loading state appears while awaiting response
- rendered answer includes highlights block

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/components/coach/coach-chat.test.tsx`
Expected: FAIL with missing component files.

**Step 3: Write minimal implementation**

- Implement a clean chat panel with:
  - intro card ("I analyze your last 7 days")
  - message list (user + coach)
  - sticky composer and send button
  - clear non-medical disclaimer
- On submit, call `askCoachQuestion` and append response.
- Keep first release stateless (page refresh resets chat).

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/components/coach/coach-chat.test.tsx`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/components/coach/
git commit -m "feat(coach): add interactive account-aware chat interface"
```

### Task 6: Add dashboard coach page and wire server action

**Files:**
- Create: `apps/web/src/app/dashboard/coach/page.tsx`
- Modify: `apps/web/src/app/dashboard/layout.tsx` (if not done in Task 1)

**Step 1: Write the failing test**

Add route smoke test that `/dashboard/coach` page renders heading and chat component shell.

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/app/dashboard/coach/page.test.tsx`
Expected: FAIL with missing route.

**Step 3: Write minimal implementation**

- Create server page with auth guard behavior matching other dashboard pages.
- Render title/subtitle and `CoachChat` component.
- Include concise context chips (window = 7 days, data sources used).

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/app/dashboard/coach/page.test.tsx`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/coach/page.tsx apps/web/src/app/dashboard/coach/page.test.tsx apps/web/src/app/dashboard/layout.tsx
git commit -m "feat(coach): add dashboard coach page"
```

### Task 7: Add output safety filter and response shaping

**Files:**
- Modify: `apps/web/src/server/actions/coach-chat.ts`
- Test: `apps/web/src/server/actions/coach-chat.test.ts`

**Step 1: Write the failing test**

Add tests enforcing:
- response must include at least one account-data reference
- response must not include diagnosis language patterns
- response always includes "consult a healthcare professional" for critical warning context

**Step 2: Run test to verify it fails**

Run: `bun test apps/web/src/server/actions/coach-chat.test.ts`
Expected: FAIL for missing filters.

**Step 3: Write minimal implementation**

- Add `validateCoachResponse()` + `applyCoachFallbacks()`.
- If model output fails checks, return safe templated answer using deterministic context facts.

**Step 4: Run tests + check**

Run:
- `bun test apps/web/src/server/actions/coach-chat.test.ts`
- `bun run check`

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/server/actions/coach-chat.ts apps/web/src/server/actions/coach-chat.test.ts
git commit -m "fix(coach): enforce grounded and safety-filtered responses"
```

### Task 8: Document feature behavior and known limits

**Files:**
- Create: `docs/ai-coach-chat.md`
- Modify: `README.md`
- Modify: `BACKLOG.md` (mark feature status and follow-ups)

**Step 1: Write docs draft**

Document:
- what data the coach reads (7-day window)
- what it does and does not do
- fallback behavior when AI keys are missing
- planned v2 items (persistent history, proactive nudges, richer charts)

**Step 2: Run check for docs formatting compatibility**

Run: `bun run format:check`
Expected: PASS or list of format fixes.

**Step 3: Apply formatting fixes if needed**

Run: `bun run format:write`

**Step 4: Final verification**

Run:
- `bun run check`
- `bun test`

Expected: PASS (or targeted pass if repository has unrelated failing suites).

**Step 5: Commit**

```bash
git add docs/ai-coach-chat.md README.md BACKLOG.md
git commit -m "docs(coach): document account-aware ai chat and constraints"
```

### Task 9: End-to-end manual verification pass

**Files:**
- No code changes expected unless bugs found

**Step 1: Run app and verify flows**

Run: `bun dev`

Manual checks:
- open `/dashboard/coach`
- ask "What does my last week look like?"
- ask follow-up "what should I change first?"
- verify guidance references actual account metrics
- verify behavior when `HUGGINGFACE_API_KEY` is unset

**Step 2: If bug found, add failing test first**

Create targeted regression test near affected module.

**Step 3: Implement minimal fix + rerun checks**

Run: `bun run check && bun test`

**Step 4: Commit any regression fix**

```bash
git add <bugfix files>
git commit -m "fix(coach): <short bug description>"
```

### Task 10: Release readiness checklist

**Files:**
- Optional: `docs/summary.md` (if team keeps release notes there)

**Step 1: Verify definition of done**

- lint/typecheck pass
- tests pass
- no regressions observed in dashboard, log, stacks, learn
- docs updated

**Step 2: Capture rollout notes**

Add short note: "Coach is advisory, account-grounded, non-medical; defaults to 7-day window."

**Step 3: Commit rollout notes (if changed)**

```bash
git add docs/summary.md
git commit -m "chore(release): add ai coach rollout notes"
```
