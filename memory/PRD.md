# Wealth Builder - Product Requirements Document

## Original Problem Statement
Build a "Wealth Builder" application featuring a sophisticated Adaptive Engine (AE) with a Text Adaptation Processor (TAP). The core requirement is to make financial content accessible to a wide range of users (from age 6 to adult) while adhering to a strict "Baseline Immutability" rule, meaning the original expert text cannot be rewritten.

## User's Preferred Language
English (other languages not supported currently)

## Core Architecture

### TAP (Text Adaptation Processor)
The TAP system adapts financial education content based on:
- **Age**: 6-99 (continuous)
- **EL (Experience Level)**: 1-5 (POC), scalable to 15
- **DNA**: 3-6 personality traits from 24 VIA Character Strengths

**Core Principle**: TAP changes HOW content is delivered, NOT WHAT is taught.

### TAP Version
**TAP 5.0 - ONLY ACTIVE VERSION** (January 2026)
- All old TAP versions (2.3, 3.0, 3.2, 3.2.4) have been REMOVED
- 17 legacy files archived to `_archived/TAP_OLD/`
- Single source of truth: `/app/backend/tap_5_0.py`

---

## What's Been Implemented

### Completed (January 2026)
- [x] **TAP 5.0 Engine** (`/app/backend/tap_5_0.py`)
  - DNA generation from 24 VIA Character Strengths
  - 7-layer PPI support (270 questions)
  - Continuous LC (Learning Complexity) calculation
  - Child/Bridge/Expert text selection
  - Micro-gloss system for inline definitions
  - Quiz camouflage analysis

- [x] **Complete TAP 5.0 Integration** (All old TAP removed)
  - `/api/content/ppi/personalized` - TAP 5.0
  - `/api/content/lpi` - TAP 5.0
  - `/api/content/chapters/{id}/quiz` - TAP 5.0
  - `/api/tap/test` - TAP 5.0 test endpoint
  - `/api/tap50/ppi-test` - TAP 5.0 PPI test endpoint

- [x] **User Registration Flow**
  - Multi-step registration form working
  - Goals selection page working
  - Age-appropriate content delivery

- [x] **Content Adaptation**
  - Child users (7yo EL1): childiness ~99.6%, emoji-enhanced content
  - Adult users (40yo EL5): childiness ~25.4%, expert content

---

## Prioritized Backlog

### P0 - Critical (Pending User Input)
- [ ] **Complete PPI v5.0 Integration**
  - Waiting for 270-question PPI JSON from user
  - Prompt available at `/app/TAP_5_0_PPI_PROMPT_FOR_CLAUDE.md`

### P1 - High Priority
- [ ] **TAP Validators** (Separate module - not part of TAP 5.0)
  - Grammar validator (language-tool-python)
  - Readability validator (textstat)
  - Meaning drift validator (sentence-transformers)
  - To be implemented in `/app/backend/tap_validators.py`

- [ ] **Country/City Selector**
  - UI exists but needs backend integration
  - Google Places API integration pending

### P2 - Medium Priority
- [ ] Performance/Caching optimization
- [ ] Basic CMS for content management
- [ ] DB Query optimization

### P3 - Future
- [ ] React Native mobile app integration
- [ ] User feedback loop persistence
- [ ] Advanced A/B testing framework

---

## Key Files

### Backend
- `/app/backend/tap_5_0.py` - TAP 5.0 Engine (ONLY VERSION)
- `/app/backend/ae_engine_v2.py` - Adaptive Engine v2 (uses TAP 5.0)
- `/app/backend/server.py` - FastAPI server
- `/app/backend/feature_flags.py` - Simplified (TAP 5.0 only)
- `/app/backend/_archived/TAP_OLD/` - Archived old TAP files (17 files)

### Frontend
- `/app/frontend/src/pages/Register.js` - Registration flow
- `/app/frontend/src/pages/GoalSelector.js` - Goal selection

---

## Technical Notes

### TAP 5.0 Key Formulas
```
LC = 0.4 * age_norm + 0.6 * el_norm  (40/60 weighting)
childiness = 1.0 - LC
```

### Blend Weights by Childiness
| Childiness | Child | Bridge | Expert |
|------------|-------|--------|--------|
| >= 0.67    | 80%   | 15%    | 5%     |
| 0.33-0.67  | 30%   | 50%    | 20%    |
| < 0.33     | 5%    | 25%    | 70%    |

---

## Test Results (January 6, 2026)

### All P0 & P1 Features VERIFIED ✅

| Feature | Status | Details |
|---------|--------|---------|
| PPI Q12-20 Adaptation | ✅ FIXED | Added 50+ word simplifications for Q12-20 (investing, risk, budget, etc.) |
| Chapter Locking | ✅ FIXED | Chapters 2-10 locked until previous quiz completed |
| LPI No Starters | ✅ FIXED | Removed "Let's learn something cool!" and all friendly starters |
| No Emojis | ✅ FIXED | Disabled all emoji additions in TAP 5.0 |
| Quiz No 50% Text | ✅ FIXED | Removed "50% required to pass" messaging |
| Quiz Adaptation | ✅ PASS | Quizzes use TAP 5.0 word simplification |

### Test Credentials
- 7yo: `test_7yo_1767657045@test.com / TestPass123!`
- 45yo: `test_45yo_1767657054@test.com / TestPass123!`

### Test Files
- `/app/tests/test_ppi_flow.py` - 11 tests
- `/app/test_reports/iteration_1.json`

---

## Key Changes (January 6, 2026)

### TAP 5.0 Configuration Changes
1. **DISABLED `CHILD_FRIENDLY_STARTERS`** - All set to empty strings
2. **DISABLED `CONCEPT_EMOJIS`** - Empty dictionary
3. **DISABLED `add_emoji` and `add_starter`** in `get_adaptation_params()` - Always False

### Word Simplifications Added (Q12-20)
- Q12: investing → growing money, "strong – I actively invest" → "good - I already save and grow my money"
- Q15: risk → chances, "calculated risks" → "smart chances"
- Q16: talking about money with friends/family
- Q17: financial challenge → money problem
- Q18: budget planning with spreadsheets → lists or phone apps
- Q19: financial personality → money style
- Q20: financial literacy → money knowledge

### Frontend Changes
- **Dashboard.js**: Re-enabled chapter locking (🔒 icon + "Complete previous chapter to unlock")
- **LPIChapter.js**: Changed quiz text from "50% required to pass" to "Test your understanding of this chapter"

---

## Last Updated
January 6, 2026 - Fixed adaptation issues for Q12-20, restored chapter locking, removed starters/emojis
