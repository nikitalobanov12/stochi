# AI Features for Stochi

## Current Implementation: Client-Side Hybrid Parsing

**Status:** Implemented

The command bar now uses a hybrid approach combining regex-based extraction with AI-powered semantic search, running entirely client-side for speed and privacy.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Command Bar                               │
│  Input: "200mg mag glycinate morning"                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hybrid Parser                                 │
│  ┌──────────────────┐    ┌────────────────────────────────────┐│
│  │  Regex (Instant) │    │  Semantic Search (Web Worker)      ││
│  │  - Dosage: 200mg │    │  - Model: all-MiniLM-L6-v2 (~23MB) ││
│  │  - Unit: mg      │    │  - Query: "mag glycinate"          ││
│  │  - Time: morning │    │  - Match: Magnesium Glycinate (92%)││
│  └──────────────────┘    └────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/workers/semantic-search.worker.ts` | Web Worker running Transformers.js |
| `src/lib/ai/command-parser.ts` | Regex-based extraction for dosage, unit, time |
| `src/lib/ai/use-semantic-search.ts` | React hook for worker communication |
| `src/components/log/command-bar.tsx` | UI component with hybrid search |

### Features

1. **Natural Language Input**
   - `"200mg mag"` → Logs 200mg of Magnesium Glycinate
   - `"vitamin d 5000iu"` → Logs 5000 IU of Vitamin D3
   - `"took fish oil morning"` → Extracts time context

2. **Fuzzy Matching with AI**
   - Handles typos: "magniseum" → Magnesium
   - Handles aliases: "d3", "sunshine vitamin" → Vitamin D3
   - Semantic understanding: "brain magnesium" → Magnesium L-Threonate

3. **Instant Feedback**
   - Regex extraction is instant (0ms)
   - Fuzzy search runs immediately as fallback
   - AI semantic search runs with 150ms debounce
   - Results merge with AI suggestions prioritized

4. **One-Shot Logging**
   - Type `"200mg mag"` and press Enter to log directly
   - No need to select supplement first if dosage is included

### Technical Details

**Model:** `Xenova/all-MiniLM-L6-v2` (Quantized)
- Size: ~23MB
- Loaded once, cached in browser
- Runs in Web Worker (non-blocking UI)

**Parsing Pipeline:**
```typescript
// 1. Regex extracts structured data
{ dosage: 200, unit: "mg", timeContext: "morning" }

// 2. Remaining text becomes search query
"mag glycinate"

// 3. Fuzzy search (instant) + AI search (debounced)
// Results merged, AI-ranked suggestions shown first
```

---

## Future AI Features

### High Priority

| Feature | HF Task | Status |
|---------|---------|--------|
| Command bar NLP | Sentence Similarity | ✅ Implemented |
| Supplement alias matching | Feature Extraction | ✅ Implemented |
| Natural language time parsing | Token Classification | ✅ Basic (regex) |

### Medium Priority

| Feature | HF Task | Notes |
|---------|---------|-------|
| Goal classification (onboarding) | Zero-Shot Classification | Could enhance goal-step.tsx |
| Interaction queries | Question Answering | "Can I take zinc with copper?" |
| Stack summaries | Summarization | Weekly reports |

### Lower Priority

| Feature | HF Task | Notes |
|---------|---------|-------|
| Label scanning (OCR) | Image-to-Text | Parse supplement bottles |
| Multi-language | Translation | Not in current scope |

---

## Design Decisions

### Why Client-Side?

1. **Latency:** Command bar must feel instant (<100ms)
2. **Offline:** PWA requirement - works in gym basement
3. **Privacy:** "Data Sovereignty" - no keystroke logging

### Why Hybrid (Regex + AI)?

1. **Regex never hallucinates** - dosages are always correct
2. **AI handles the fuzzy stuff** - typos, aliases, abbreviations
3. **Graceful degradation** - works without AI, better with it

### Why Web Worker?

1. **Non-blocking UI** - model loading doesn't freeze the app
2. **Parallel processing** - searches run in background
3. **Memory isolation** - model lives in worker memory
