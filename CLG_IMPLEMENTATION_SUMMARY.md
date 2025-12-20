# CLG (Controlled Language Generator) — Implementation Summary

## Overview
CLG is the grammar-safe realization layer inside TAP v2.3.1. It replaces the broken paraphrasing/synonym approach with deterministic, template-based text generation.

**Version:** 1.0.0  
**Status:** ✅ Implemented and Tested

## How CLG Works

### Core Components

1. **Phrase Bank Matrix (PBM)**
   - Pre-approved phrases organized by concept ID and band score
   - Band scores range 0.0-1.0 (low = simple, high = expert)
   - Each entry: term, definition, example, analogy

2. **Sentence Template Library (STL)**
   - Grammar-safe sentence frames with slots
   - Templates: T_DEF, T_SIMPLE, T_EXAMPLE, T_ANALOGY, T_STRETCH

3. **Slot Fill + Assembly**
   - Deterministic: NO paraphrasing, NO synonyms
   - Fills slots with exact PBM phrases

### Band Selection Algorithm
```
phrase_entry = argmin(|entry.band_score - CD|)
```
Selects the phrase with band_score nearest to user's Conceptual Depth (CD).

### Include Rules
- **Include Example**: LC ≤ 0.70 OR AE_exposure == 1 OR AE_friction > 0.6
- **Include Analogy**: age < 16 OR LC < 0.45

## API Endpoints

### GET /api/clg/test
Runs 9-case step test with 3 profiles × 3 concepts.

### POST /api/clg/render
```json
{
  "concept_ids": ["CREDIT_CARD"],
  "age": 8,
  "el_declared": 1,
  "el_max": 15,
  "tone": "direct",
  "template_type": "lpi"
}
```

## Test Results

| Profile | LC | CD | Term | Analogy | Example |
|---------|----|----|------|---------|---------|
| Child (8, EL=1) | 0.05 | 0.01 | "credit card" | ✅ | ✅ |
| Adult (45, EL=8) | 0.47 | 0.49 | "credit card" (w/interest) | ❌ | ✅ |
| Expert (60, EL=14) | 0.71 | 0.88 | "revolving facility" | ❌ | ❌ |

### Sample Outputs

**Child (age=8, EL=1):**
> credit card is a card that lets you borrow money to buy something now and pay it back later. Example: You buy something today, then you pay the card back. Think of it like borrowing a toy and returning it.

**Adult (age=45, EL=8):**
> credit card means a borrowing tool with a limit; if you don't pay the full balance, interest can be charged. Example: Paying the full balance avoids extra cost.

**Expert (age=60, EL=14):**
> revolving facility means issuer-provided revolving line; cost depends on APR, accrual method, statement timing, and payment behavior.

## Files

| File | Purpose |
|------|---------|
| `/app/backend/clg_engine.py` | CLG Engine class and 9-case test |
| `/app/backend/clg_data.py` | PBM data and STL templates |
| `/app/backend/feature_flags.py` | USE_CLG_ENGINE flag |
| `/app/backend/tap_v2_3_engine.py` | TAP integration via render_concepts() |

## Feature Flags

```python
USE_CLG_ENGINE = os.environ.get('USE_CLG_ENGINE', 'true').lower() == 'true'
```

## Current Concepts in PBM

1. CREDIT_CARD (4 bands: 0.10, 0.35, 0.70, 0.90)
2. PAYING_BILLS (4 bands)
3. INVESTING (4 bands)
4. BUDGETING (4 bands)
5. SAVING (4 bands)
6. DEBT (4 bands)
7. FINANCIAL_LITERACY (4 bands)
8. MONEY_DECISION (4 bands)

## Next Steps

1. **Expand PBM**: Add more concepts for LPI chapters
2. **PPI Integration**: Map PPI questions to concept_ids
3. **LPI Integration**: Tag LPI content with concept_ids for CLG rendering

---
*Last updated: December 2025*
