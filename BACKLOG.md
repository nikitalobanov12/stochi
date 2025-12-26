# BACKLOG

## In Progress

(empty)

## Up Next

- [ ] fix the ai suggestions
  - right now you can get a suggestion like
    `Add Magnesium Glycinate
    Take together! Magnesium activates vitamin D. Many D3 'non-responders' are actually magnesium deficient
    Less Magnesium Glycinate
    Mechanism
    Glycine chelation enhances absorption; glycine itself acts as inhibitory neurotransmitter

Why Take It
Highly bioavailable magnesium form that promotes relaxation and quality sleep

View Research`

- it's true that megnasium enhances absorbtion of vitamin d3, but the nuance here is that you don't want to take them together since magnesium glycinate is more beneficial for lowering your body temp and lowering cortisol causing you to get better sleep, the nuance is that you should be taking them together but at different times, but the suggestions here say that you should take them together which implies that you should be taking them at the same time

- [ ] **AI-generated research summaries**
  - Summarize Examine.com or PubMed content on-demand using HuggingFace API
  - Cache summaries in database after first generation
  - Fallback for supplements without pre-written summaries
  - Show in supplement sheet / detail view

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

- [ ] fix the ai suggestions

- [ ] **AI-generated research summaries**
  - Summarize Examine.com or PubMed content on-demand using HuggingFace API
  - Cache summaries in database after first generation
  - Fallback for supplements without pre-written summaries
  - Show in supplement sheet / detail view

- [ ] **Interaction severity customization**
  - Let users set personal tolerance levels for interactions
  - E.g., "I know about caffeine + L-theanine, don't warn me"
  - Different from dismissing - this is a permanent "I accept this interaction"

- [ ] **Stack templates / protocols** (MOSTLY DONE)
  - Pre-built supplement stacks for common goals (sleep, focus, energy) ✓
  - One-click import from protocol library ✓
  - Community-shared stacks (future)
