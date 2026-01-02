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

### TAP Version History
| Version | Status | Description |
|---------|--------|-------------|
| TAP 5.0 | **PRIMARY** | DNA-based personalization with 24 VIA traits, 7-layer PPI |
| TAP 3.2.4 | Fallback | Child-friendly with continuous blending |
| TAP 3.2 | Fallback | Sentence-level scaffolding |
| TAP 3.0 | Fallback | Immutable baseline + scaffolding injection |
| TAP 2.3 | Legacy | Formula-driven transformation |

---

## What's Been Implemented

### Completed (December 2025)
- [x] **TAP 5.0 Engine** (`/app/backend/tap_5_0.py`)
  - DNA generation from 24 VIA Character Strengths
  - 7-layer PPI support (270 questions)
  - Continuous LC (Learning Complexity) calculation
  - Child/Bridge/Expert text selection
  - Micro-gloss system for inline definitions
  - Quiz camouflage analysis

- [x] **TAP 5.0 Integration**
  - `/api/content/ppi/personalized` - PPI questions
  - `/api/content/lpi` - LPI lessons
  - `/api/content/chapters/{id}/quiz` - Quiz questions
  - Feature flag controlled via `USE_TAP_V5_0`

- [x] **User Registration Flow**
  - Multi-step registration form fixed
  - Goals selection page working
  - Age-appropriate content delivery

- [x] **Content Adaptation**
  - Child users (6yo): childiness ~99%, emoji-enhanced content
  - Adult users (40yo EL5): childiness ~25%, expert content

---

## Prioritized Backlog

### P0 - Critical (In Progress)
- [ ] **Complete PPI v5.0 Integration**
  - Waiting for user to provide 270-question PPI JSON
  - Will enable full DNA generation from PPI responses
  - Prompt available at `/app/TAP_5_0_PPI_PROMPT_FOR_CLAUDE.md`

### P1 - High Priority
- [ ] **TAP 4.0 Validators**
  - Grammar validator (language-tool-python)
  - Readability validator (textstat)
  - Meaning drift validator (sentence-transformers)
  - Dependencies not yet installed

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
- `/app/backend/tap_5_0.py` - TAP 5.0 Engine (PRIMARY)
- `/app/backend/ae_engine_v2.py` - Adaptive Engine v2 (uses TAP 5.0)
- `/app/backend/server.py` - FastAPI server
- `/app/backend/feature_flags.py` - Feature flag configuration

### Frontend
- `/app/frontend/src/pages/Register.js` - Registration flow
- `/app/frontend/src/pages/GoalSelector.js` - Goal selection

### Prompts for Content Generation
- `/app/TAP_5_0_PPI_PROMPT_FOR_CLAUDE.md` - New 270 PPI questions
- `/app/GOALS_67_PROMPT_FOR_AI.md` - Financial goals

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

## Last Updated
December 2025 - TAP 5.0 full integration across all content endpoints
