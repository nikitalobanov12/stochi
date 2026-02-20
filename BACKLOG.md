# BACKLOG

## In Progress

- [ ] **Refined Clinical Editorial redesign (dark-first)**
  - Semantic token foundation in `globals.css` (surface/text/accent/motion/elevation)
  - Editorial typography system (Manrope + Cormorant Garamond + JetBrains Mono)
  - Token-driven UI primitives (button/card/input/badge/dialog)
  - Dashboard shell/nav active-state polish with `aria-current`
  - Ongoing: dashboard + landing full surface migration and visual QA pass

## Up Next

- [ ] AI tutor feature
  - have an ai chat that is grounded in the search results from the examine.com database
  - it can be a small local chat model like llama 8.1 that runs via huggingface inference and just retreives information from examine.com or other similar websites and shares it with the user
  - this will let users ask questions about their protocol or specific supplements and help get a better understanding about it.

- [ ] **Interaction severity customization**
  - Let users set personal tolerance levels for interactions
  - E.g., "I know about caffeine + L-theanine, don't warn me"
  - Different from dismissing - this is a permanent "I accept this interaction"

- [ ] **Smart notification timing**
  - Push notification when optimal window opens for a supplement
  - "Time to take your evening magnesium" based on supplement's `optimalTimeOfDay`
  - Respect user's typical schedule / timezone
  - Integrate with existing Capacitor push notification setup (`lib/capacitor/push.ts`)
  - Add notification preferences to Settings (enable/disable, quiet hours)

## Completed

- [x] **Smart suggestion quality filtering**
  - Schema: `synergyStrength` on interaction, `suggestionProfile` JSONB on supplement
  - User preferences: `experienceLevel`, `suggestionFilterLevel`, `showConditionalSupplements`
  - Synergy strength levels: critical > strong > moderate > weak
  - Experience levels: beginner < intermediate < advanced
  - Filters peptides/research chemicals for advanced users only
  - Filters deficiency-only supplements (Iron, B12) unless user opts in
  - Onboarding: new ExperienceStep asks user's comfort level
  - Settings: controls for experience level, synergy quality filter, conditional supplements
  - Seed data: strength ratings for all synergy interactions, profiles for 20+ supplements

- [x] **Master Protocol**
  - Schema: `protocol` table (one per user), `protocolItem` table with time slots, frequency, day-of-week
  - Protocol Builder UI at `/dashboard/protocol` with 4 time slot sections (morning, midday, evening, bedtime)
  - User-configurable slot times (stored as HH:MM strings)
  - Protocol Health Score (0-100) analyzing conflicts, timing issues, spacing, ratio imbalances, redundancies
  - Protocol Card on Stacks page for quick access
  - Auto-log cron job (hourly) for users who enable it
  - Onboarding integration: creates protocol items alongside stacks for new users
  - Group management for organizing supplements within protocol

- [x] **AI-generated research summaries**
  - Summarize Examine.com/knowledge chunks on-demand using Llama 3.1 8B via HuggingFace
  - Cache summaries in database (`researchSummary`, `researchSummaryGeneratedAt` columns)
  - Lazy generation on first view with loading indicator
  - Shows "AI" badge when AI-generated
  - Fallback to `description` + `mechanism` if AI unavailable or no knowledge chunks
  - 30-day cache freshness (regenerates after staleness)

- [x] **Simplified "Add to Stack" UX**
  - Replaced batch-add dialog with inline quick-add in search results
  - Each search result now shows: supplement name + dosage input + unit selector + Add button
  - Single click/Enter to add directly to stack (no pending list, no confirm step)
  - Default unit pre-filled from supplement's `defaultUnit`
  - Reduced flow from 6 steps to 2-3 steps

- [x] **Retroactive logging ("I forgot to log")**
  - Added `loggedAt` parameter to `logStack()` and `logStackWithSafetyCheck()` server actions
  - Split button UI: primary "LOG" action + dropdown for time selection
  - Time presets: "Now" + 30-minute intervals up to 4 hours back (today only)
  - Validation: no future dates, max 7 days in past
  - Updated: LogStackButton, SimpleLogStackButton, ProtocolCard
  - Updated LogContext's `logStackOptimistic` to accept `loggedAt` parameter

- [x] **Smart synergy timing suggestions**
  - Synergy suggestions now detect when supplements have different optimal intake times
  - "Take together!" replaced with "These synergize" + timing guidance for conflicting timings
  - Example: D3 (morning) + Magnesium Glycinate (evening) now shows:
    "These synergize – take at different times: Vitamin D3 morning, Magnesium Glycinate evening"
  - Added `timingExplanation` field with detailed rationales for expanded view
  - Active synergies also show timing guidance when applicable

- [x] **Timezone-aware day boundaries**
  - Fixed bug where "today" was calculated in server timezone (UTC) instead of user's timezone
  - Added `getStartOfDayInTimezone()` utility for consistent timezone-aware date calculations
  - Updated: dashboard page, log page, analytics service, interactions, onboarding
  - Ensures stack completion status, daily logs, etc. reset at user's local midnight

- [x] **Universal loading indicators for navigation & actions**
  - Added `loading.tsx` skeleton files for all dashboard routes
  - Navigation links show spinner while navigating (nav-links.tsx)
  - Stack detail page: Back, Log All, Rename, Delete buttons with loading states
  - Protocol card Zone A navigation with status indicator spinner
  - Stack list page rows with chevron → spinner transition
  - Quick Log buttons with per-button loading state
  - VIEW ALL and Create Protocol links with loading spinners
  - Protocol Library back button with loading state
  - Learn page back button with loading state
  - Pattern: `useTransition` + `router.push` with icon swap to `Loader2`

- [x] **Optimistic UI updates**
  - Created `retryWithBackoff` utility for resilient server actions (3 retries, exponential backoff)
  - `LogContext` provider for dashboard/log page with `useOptimistic` hook
  - `StackItemsContext` provider for stack detail page
  - Instant UI updates for: logging supplements, logging stacks, deleting logs, editing stack items, adding supplements to stacks
  - Goals card auto-saves on toggle with optimistic feedback
  - Error handling: toast notification + page refresh on failure to rollback

- [x] **Suggestion categories/grouping**
  - Group suggestions in OptimizationHUD by type: Safety, Synergy, Timing, Balance
  - Add category badges/headers to visually separate suggestion types
  - Add per-category toggle in Settings (e.g., "Show safety warnings", "Show synergy tips")
  - Store category preferences in localStorage (instant, no server roundtrip)
  - Uses `useSyncExternalStore` for proper React 18 hydration
  - Balance detection via hardcoded pairs + "balance" keyword matching

- [x] **Undo dismiss feature**
  - Added "Dismissed Suggestions" section to Settings page
  - Expandable list showing all dismissed suggestions with type badges
  - Individual Restore button for each dismissed suggestion
  - Reset All button for bulk restore
  - Optimistic UI updates

- [x] **Goal-based suggestion filtering**
  - Filter synergy suggestions by user's selected health goals
  - Check supplement.commonGoals against user goals in biological-state.ts
  - Fetch user goals in dashboard and pass to getBiologicalState
  - Show all suggestions if user has no goals or supplement has no commonGoals

- [x] **Protocol Library & Detail View**
  - ProtocolDetailSheet component with full protocol info
  - Protocol Library page at /dashboard/stacks/library with filtering
  - Updated RecommendedProtocols to open detail sheet instead of auto-import

- [x] **Active Protocol Manager (Stacks page enhancement)**
  - Added `lastLoggedAt` column to track when stacks were last used
  - One-tap logging with optimistic UI (LogStackButton component)
  - Timing badges showing consensus timing (morning/bedtime/etc)
  - Goal-based protocol recommendations ("Recommended for Your Goals")
  - Relative time display ("2h ago", "Yesterday")
  - Database transactions for ACID-compliant logging

## Ideas / Future

- [ ] **Interaction severity customization**
  - Let users set personal tolerance levels for interactions
  - E.g., "I know about caffeine + L-theanine, don't warn me"
  - Different from dismissing - this is a permanent "I accept this interaction"

- [ ] **Stack templates / protocols** (MOSTLY DONE)
  - Pre-built supplement stacks for common goals (sleep, focus, energy) ✓
  - One-click import from protocol library ✓
  - Community-shared stacks (future)
