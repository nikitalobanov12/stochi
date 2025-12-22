# BACKLOG

## In Progress

(empty)

## Up Next

- [ ] **Suggestion categories/grouping**
  - Group suggestions in OptimizationHUD by type: Safety, Synergy, Timing, Balance
  - Add category badges/headers to visually separate suggestion types
  - Add per-category toggle in Settings (e.g., "Show safety warnings", "Show synergy tips")
  - Store category preferences in `userPreference` table

## Planned

- [ ] **Smart notification timing**
  - Push notification when optimal window opens for a supplement
  - "Time to take your evening magnesium" based on supplement's `optimalTimeOfDay`
  - Respect user's typical schedule / timezone
  - Integrate with existing Capacitor push notification setup (`lib/capacitor/push.ts`)
  - Add notification preferences to Settings (enable/disable, quiet hours)

## Completed

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
