# BACKLOG

## In Progress

(empty)

## Up Next

- [ ] **Goal-based suggestion filtering**
  - Only show "add supplement" suggestions relevant to user's selected goals
  - Filter synergy suggestions by goal relevance (e.g., sleep goal → prioritize sleep supplements)
  - Update `biological-state.ts` to check user goals when generating suggestions
  - Leverage existing `commonGoals` field on supplements and `goal` table

## Planned

- [ ] **Undo dismiss feature**
  - Add "Dismissed Suggestions" section to Settings page
  - List all dismissed suggestions with context (supplement name, reason)
  - "Restore" button to remove from `dismissedSuggestion` table
  - Consider grouping by suggestion type

- [ ] **Suggestion categories/grouping**
  - Group suggestions in OptimizationHUD by type: Safety, Synergy, Timing, Balance
  - Add category badges/headers to visually separate suggestion types
  - Add per-category toggle in Settings (e.g., "Show safety warnings", "Show synergy tips")
  - Store category preferences in `userPreference` table

- [ ] **Smart notification timing**
  - Push notification when optimal window opens for a supplement
  - "Time to take your evening magnesium" based on supplement's `optimalTimeOfDay`
  - Respect user's typical schedule / timezone
  - Integrate with existing Capacitor push notification setup (`lib/capacitor/push.ts`)
  - Add notification preferences to Settings (enable/disable, quiet hours)

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

- [ ] **Stack templates / protocols**
  - Pre-built supplement stacks for common goals (sleep, focus, energy)
  - One-click import from protocol library
  - Community-shared stacks (future)
