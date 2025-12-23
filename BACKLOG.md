# BACKLOG

## In Progress

(empty)

## Up Next

- [ ] Optimistic UI updates
  - when the user logs their stack, it takes upwards of 5 seconds to process in the database, we need to figure out a cleaner solution to this
  - either use redis to store the information first and than have eventual consistency with postgres, or just use optimistic ui updates
  - this applies to deleting logs too, it takes upwards of 3 seconds to delete a supplement from the log and than the ui never updates, it just grays out the supplement

## Planned

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

- [ ] Better indicators
  - currently when you perform a navigation action that uses the router, theres a 500 ms delay that is noticeably slow but also amplified by the fact that theres no visual indicators that the action is going through
  - we need to add a loading indicator rigth where the user clicked that shows that the action is processing, this speeds up the perceived speed of how things happen

- [ ] **Smart notification timing**
  - Push notification when optimal window opens for a supplement
  - "Time to take your evening magnesium" based on supplement's `optimalTimeOfDay`
  - Respect user's typical schedule / timezone
  - Integrate with existing Capacitor push notification setup (`lib/capacitor/push.ts`)
  - Add notification preferences to Settings (enable/disable, quiet hours)

## Completed

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

- [ ] Optimistic UI updates
  - when the user logs their stack, it takes upwards of 5 seconds to process in the database, we need to figure out a cleaner solution to this
  - either use redis to store the information first and than have eventual consistency with postgres, or just use optimistic ui updates
  - this applies to deleting logs too, it takes upwards of 3 seconds to delete a supplement from the log and than the ui never updates, it just grays out the supplement

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
