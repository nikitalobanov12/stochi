# AI-Powered Dosage Suggestions

## Problem Statement

Current ratio warnings show vague advice like "D3:K2 ratio outside optimal range (50-200:1)". Users want:

1. **Specific dosage recommendations**: "Increase D3 to 3,000-12,000 IU"
2. **Research grounding**: Link to studies that support the recommendation
3. **Personalized context**: Suggestions that consider their specific situation

---

## Current State

### What We Have
- Static ratio rules in database (Zn:Cu, Ca:Mg, D3:K2, Fe:Zn)
- Fixed min/max/optimal ratios from research
- Basic calculation: `targetDosage * optimalRatio = suggestedSourceDosage`
- `researchUrl` field on `interaction` table (not yet on `ratioRule`)

### What's Limiting
- Doesn't account for individual factors (age, weight, deficiency status)
- Fixed ranges don't adapt to context
- No explanation of *why* a specific dosage for this user
- `ratioRule` table missing `researchUrl` field

---

## Proposed Solution

### Phase 1: Deterministic Range Calculator (Ship Fast)

**Goal**: Show accurate dosage ranges based on math, with research links.

#### Schema Changes
```sql
ALTER TABLE ratio_rule ADD COLUMN research_url text;
```

#### Improved `getAdjustmentSuggestion()` Logic
```typescript
const getAdjustmentSuggestion = () => {
  const { currentRatio, minRatio, maxRatio, source, target } = warning;
  
  if (currentRatio < minRatio) {
    // Ratio too low - need more source
    const minSourceNeeded = Math.round(target.dosage * minRatio);
    const maxSourceNeeded = Math.round(target.dosage * maxRatio);
    return {
      action: "increase",
      supplement: source.name,
      range: `${formatDosage(minSourceNeeded, source.unit)}-${formatDosage(maxSourceNeeded, source.unit)}`,
      explanation: `With your ${target.dosage}${target.unit} of ${target.name}, you need ${minRatio}-${maxRatio}:1 ratio`
    };
  } else if (currentRatio > maxRatio) {
    // Ratio too high - need more target or less source
    const targetNeeded = Math.round(source.dosage / minRatio);
    return {
      action: "increase", 
      supplement: target.name,
      range: `${formatDosage(targetNeeded, target.unit)}+`,
      explanation: `To balance your ${source.dosage}${source.unit} of ${source.name}`
    };
  }
  return null;
};
```

#### Example Output
```
┌─────────────────────────────────────────────────────────┐
│ How to fix                                              │
│                                                         │
│ Increase Vitamin D3 to 3,000-12,000 IU                 │
│ With your 60mcg of K2, you need 50-200:1 ratio         │
│                                                         │
│ [📚 Research on Examine.com]                            │
└─────────────────────────────────────────────────────────┘
```

#### Tasks
- [ ] Add `researchUrl` column to `ratioRule` schema
- [ ] Update seed data with Examine.com links for all 9 ratio rules
- [ ] Update `RatioWarning` type to include `researchUrl`
- [ ] Rewrite `getAdjustmentSuggestion()` to return dosage ranges
- [ ] Add research link to `RatioCard` component
- [ ] Push schema changes to production
- [ ] Re-seed production database

---

### Phase 2: AI-Enhanced Suggestions (Future)

Three possible approaches, in order of complexity:

#### Option A: Embedding-based Retrieval (RAG-lite)

Use a sentence transformer to find relevant research snippets from a curated corpus.

```
User's context: "D3 2500 IU, K2 60mcg, ratio 41.7:1"
     ↓
Embed → Search curated research corpus → Return relevant passage
     ↓
"Studies show 1000 IU D3 per 100mcg K2 is optimal for calcium metabolism..."
```

**Pros:** 
- Grounded in real research
- Explainable and trustworthy
- No hallucination risk

**Cons:**
- Need to curate and maintain a research corpus
- Still doesn't personalize dosages beyond what's in corpus

**Recommended Model:** `sentence-transformers/all-MiniLM-L6-v2`
- 22M parameters
- Fast inference (~50ms)
- Can run client-side via Transformers.js

**Implementation:**
1. Curate corpus of research snippets from Examine.com, PubMed abstracts
2. Pre-compute embeddings and store in vector DB (or JSON file for MVP)
3. On ratio warning, embed the context and find top-k relevant snippets
4. Display snippet with source citation

---

#### Option B: Fine-tuned Text Generation

Use a small LLM to generate personalized suggestions.

```
Input: {d3: 2500, k2: 60, ratio: 41.7, target_range: "50-200:1"}
     ↓
Model generates natural language suggestion
     ↓
"Increase D3 to 3000-5000 IU. At 60mcg K2, this gives you a 50-83:1 ratio. 
Higher D3 (5000 IU) is common for those with limited sun exposure."
```

**Pros:**
- Natural, conversational output
- Can incorporate nuanced context

**Cons:**
- Hallucination risk (could suggest unsafe dosages)
- Harder to verify correctness
- Requires guardrails/validation layer

**Recommended Models:**
- `google/flan-t5-base` - 250M params, CPU-friendly, good for structured tasks
- `mistralai/Mistral-7B-Instruct-v0.2` - Higher quality, needs GPU
- `HuggingFaceH4/zephyr-7b-beta` - Good instruction following

**Implementation:**
1. Create prompt template with dosage context + safety constraints
2. Call HuggingFace Inference API (or self-host)
3. Validate output against safe dosage ranges before displaying
4. Cache responses for common scenarios

---

#### Option C: Hybrid Approach (Recommended for Phase 2)

Combine deterministic calculation with AI explanation.

```
┌─────────────────────────────────────────────────────────┐
│ How to fix                                              │
│                                                         │
│ Increase Vitamin D3 to 3,000-12,000 IU      [MATH]     │
│                                                         │
│ 💡 Most people do well at 5,000 IU D3 when taking      │
│    100mcg K2. Your 60mcg K2 pairs well with 3,000-     │
│    6,000 IU D3 for bone health.              [AI]      │
│                                                         │
│ [📚 Research: Vitamin K and Vitamin D synergy]          │
└─────────────────────────────────────────────────────────┘
```

**Architecture:**
1. **Math layer**: Calculate safe dosage range (deterministic, fast)
2. **RAG layer**: Fetch relevant research snippet (grounding)
3. **LLM layer** (optional): Generate natural explanation constrained by math layer

**Benefits:**
- Dosage range is always mathematically correct
- AI can't suggest unsafe values (bounded by math layer)
- Research grounding adds credibility
- Natural language makes it more accessible

---

## Architecture Decisions

### Where to Run the Model?

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Client-side (Web Worker)** | No API costs, works offline, low latency | Limited model size (~100MB), battery drain | Embeddings, small models |
| **Server-side (Next.js API)** | More powerful models, easy to iterate | Adds latency, potential costs | LLM generation |
| **Go Engine** | Centralized, can share with other clients | More complex deployment | Production scale |
| **HuggingFace Inference API** | Zero infra, free tier available | Rate limits, external dependency | MVP/prototyping |

**Recommendation:** 
- Phase 1: No AI needed (deterministic math)
- Phase 2 MVP: HuggingFace Inference API for quick iteration
- Phase 2 Production: Client-side embeddings + server-side LLM

### Latency Considerations

- Ratio cards are expandable - can lazy-load AI suggestion on expand
- Show deterministic range immediately, enhance with AI async
- Cache AI responses for common supplement combinations

---

## Research Sources for Corpus

If we go with RAG approach, curate from:

1. **Examine.com** - High-quality supplement research summaries
   - Already have URLs for most interactions
   - Well-structured, easy to parse

2. **PubMed Abstracts** - Primary research
   - Search: "vitamin D vitamin K ratio supplementation"
   - Filter for meta-analyses and RCTs

3. **Huberman Lab / Rhonda Patrick** - Accessible explanations
   - Good for "why it matters" context
   - Already trusted by target audience

4. **Linus Pauling Institute** - Micronutrient information
   - Comprehensive, evidence-based
   - Good for safe upper limits

---

## Safety Considerations

### Hard Limits
Always validate AI suggestions against known safe upper limits:

| Supplement | Upper Limit | Source |
|------------|-------------|--------|
| Vitamin D3 | 10,000 IU/day | Endocrine Society |
| Vitamin K2 | No established UL | - |
| Zinc | 40mg/day | NIH |
| Copper | 10mg/day | NIH |
| Iron | 45mg/day | NIH |
| Calcium | 2,500mg/day | NIH |
| Magnesium | 350mg/day (supplemental) | NIH |

### Guardrails
1. Never suggest dosages above established upper limits
2. Always show "consult healthcare provider" for critical severity
3. Log AI suggestions for review and improvement
4. A/B test AI suggestions vs deterministic to measure trust/engagement

---

## Implementation Roadmap

### Phase 1: Deterministic (This Sprint)
- [x] Schema: Add `researchUrl` to `ratioRule`
- [ ] Seed: Add Examine.com links to all ratio rules  
- [ ] Component: Improve `RatioCard` with dosage range + research link
- [ ] Deploy: Push to production

### Phase 2: AI Enhancement (Future Sprint)
- [ ] Curate research corpus (50-100 snippets)
- [ ] Set up HuggingFace Inference API
- [ ] Implement RAG retrieval for research snippets
- [ ] Add AI explanation as async enhancement
- [ ] A/B test engagement

### Phase 3: Production AI (Future)
- [ ] Evaluate client-side vs server-side tradeoffs
- [ ] Implement caching layer
- [ ] Add feedback mechanism for AI suggestions
- [ ] Fine-tune model on supplement domain (if needed)

---

## Open Questions

1. **Scope**: AI suggestions for just ratio warnings, or all interaction types?
2. **Personalization**: Should we factor in user goals (from onboarding) into suggestions?
3. **Feedback loop**: How do users tell us if a suggestion was helpful?
4. **Liability**: Do we need medical disclaimer for AI-generated dosage advice?
