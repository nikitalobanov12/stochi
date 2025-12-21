# BACKLOG

## In Progress

(empty)

## Up Next

(see Ideas / Future)

## Planned

(empty)

## Completed

- [x] **Smart Suggestions Phase 4**: Richer supplement details before adding
  - Extended `OptimizationOpportunity` type with `suggestedSupplement` field
  - Include `mechanism`, `description`, `researchUrl` in synergy suggestions
  - Added collapsible "More about" details section to SynergyCard
  - Show mechanism, description, and research link in expanded view

- [x] **Smart Suggestions Phase 3**: Edit log timestamps
  - Added `updateLogTime(logId, newLoggedAt)` server action
  - Extended `command-parser.ts` with clock time parsing ("8am", "10:30pm")
  - Added relative time parsing ("this morning", "2 hours ago", "yesterday")
  - Pass parsed time to `createLog({ loggedAt })` in command bar
  - Added click-to-edit time UI on log entry rows

- [x] **Smart Suggestions Phase 2**: Timing optimization suggestions
  - Added `optimalTimeOfDay` enum (`morning`, `afternoon`, `evening`, `bedtime`, `with_meals`, `any`)
  - Added `optimalTimeOfDay` column to `supplement` table
  - Updated `biological-state.ts` with timing suggestion logic
  - Added `TimingCard` component for suboptimal timing alerts
  - Seeded timing data for Magnesium variants, Vitamin D, Iron, Caffeine, Ashwagandha, Melatonin, Glycine

- [x] **Smart Suggestions Phase 1**: Persistent dismissals + preferences toggle
  - Added `userPreference` table with `showAddSuggestions` boolean
  - Added `dismissedSuggestion` table for context-aware persistent dismissals
  - Server actions: `preferences.ts` (get/set preferences)
  - Server actions: `dismissed-suggestions.ts` (dismiss/get/reset)
  - Updated `optimization-hud.tsx` with optimistic dismissals + server persistence
  - Added "Suggestions" section to Settings page with toggle + reset
  - Created `Switch` UI component

## Ideas / Future

- [ ] AI-generated research summaries using HuggingFace API
  - Summarize Examine.com or PubMed content on-demand
  - Cache summaries in database after first generation
  - Fallback for supplements without pre-written summaries

- [ ] Goal-based suggestion filtering
  - Only show "add supplement" suggestions relevant to user's selected goals
  - E.g., if user's goal is "sleep", prioritize sleep-related suggestions

- [ ] "Undo dismiss" feature
  - Allow users to view and restore specific dismissed suggestions
  - List dismissed suggestions in Settings with "restore" option

- [ ] Suggestion categories/grouping
  - Group suggestions by type: Safety, Synergy, Timing, Balance
  - Allow users to disable specific categories

- [ ] Smart notification timing
  - Push notification when optimal window opens for a supplement
  - "Time to take your evening magnesium" based on user's typical schedule
