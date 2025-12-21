# BACKLOG

## In Progress

(empty)

## Up Next

- [ ] **Smart Suggestions Phase 2**: Timing optimization suggestions
  - Add `optimalTimeOfDay` enum (`morning`, `evening`, `bedtime`, `with_meals`) to schema
  - Add `optimalTimeOfDay` column to `supplement` table
  - Update `biological-state.ts` with timing suggestion logic
  - Show timing suggestions when user logs supplement at suboptimal time
  - Inline confirmation UI for dismissing timing suggestions ("Don't show again")
  - Seed data with timing values for common supplements:
    - Magnesium Glycinate → `evening`
    - Magnesium L-Threonate → `evening`
    - Magnesium Malate → `morning`
    - Ashwagandha → `evening`
    - Vitamin D3 → `morning`
    - Caffeine → `morning`
    - Melatonin → `bedtime`
    - Glycine → `bedtime`
    - Iron Bisglycinate → `morning`

## Planned

- [ ] **Smart Suggestions Phase 3**: Edit log timestamps
  - Add `updateLogTime(logId, newLoggedAt)` server action to `logs.ts`
  - Add edit time dialog/popover on log entry rows (click timestamp to edit)
  - Extend `command-parser.ts` to parse time from natural language:
    - "vitamin d 5000iu at 8am"
    - "mag glycinate 400mg 10pm"
    - "zinc 30mg this morning"
  - Pass parsed time to `createLog({ loggedAt: parsedTime })`

- [ ] **Smart Suggestions Phase 4**: Richer supplement details before adding
  - Expand suggestion cards to show `mechanism` and `description` fields
  - Add expandable/collapsible detail section on suggestion cards
  - Create in-app research summary sheet/drawer component
  - Link to full research (Examine.com `researchUrl`)
  - Enhance seed data with more detailed `mechanism` descriptions

## Completed

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
