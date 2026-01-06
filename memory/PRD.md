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

## PPI Layer 1 - VIA Character Strengths (January 6, 2026)

### NEW 30-Question PPI Implemented ✅

**Framework:** VIA 24 Character Strengths
**Questions:** 30 total (Layer 1)
**Format Mix:** 60% Likert Scale (18), 40% Multiple Choice (12)
**Reading Level:** 6th-8th grade baseline

### VIA Traits Covered (24/24)

| Virtue | Traits | Questions |
|--------|--------|-----------|
| **Wisdom** | Creativity, Curiosity, Judgment, Love of Learning, Perspective | Q1, Q2, Q3, Q4, Q5, Q25, Q29 |
| **Courage** | Bravery, Perseverance, Honesty, Zest | Q6, Q7, Q8, Q9, Q26 |
| **Humanity** | Love, Kindness, Social Intelligence | Q10, Q11, Q12 |
| **Justice** | Teamwork, Fairness, Leadership | Q13, Q14, Q15 |
| **Temperance** | Forgiveness, Prudence, Self-Regulation | Q16, Q18, Q19, Q27 |
| **Transcendence** | Gratitude, Hope, Spirituality | Q21, Q22, Q24, Q28, Q30 |

### Questions Swapped from OLD PPI
- **Q17:** Financial Priority (OLD Q5) - "My biggest financial priority right now is:"
- **Q20:** Investing Knowledge (OLD Q12) - "My knowledge of investing is:"
- **Q23:** Biggest Challenge (OLD Q17) - "My biggest financial challenge is:"

### Removed from NEW (Lowest Weights)
- ~~Q17 Humility (5/10)~~
- ~~Q20 Appreciation of Beauty (4/10)~~
- ~~Q23 Humor (5/10)~~

### Frontend Changes
- **PPI.js**: Added `LikertScale` component for 1-5 scale questions
- UI shows "Rate 1-5" badge for Likert, "Choose one" badge for MCQ
- VIA trait displayed in top-right corner of each question
- Progress shows "X / 30" format
- Intro page updated: "Answer 30 quick questions", "Some questions use a 1-5 scale"

### Backend Changes
- **ppi_trait_vector.py**: Updated `PPI_TRAIT_TAGS` for all 30 questions
- Added `LIKERT_ANSWER_VALUES` mapping (1-5 → 0.0-1.0)
- Updated `normalize_answer()` to handle `question_type` parameter
- Server now passes `total_questions=30` for stability calculation

---

## Last Updated
January 6, 2026 - Replaced 20-question PPI with 30-question VIA Character Strengths Layer 1
