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

### Latest Updates (January 9, 2026)

#### Multi-Provider OAuth Integration ✅ (NEW)
- **Providers Supported**: Google, Apple, Microsoft, Facebook
- **Login Page**: 4 OAuth sign-in buttons with branded styling
- **Settings > Security**: Connect/disconnect all 4 OAuth providers
- **AuthCallback component**: Universal handler for all OAuth providers
- **Backend Endpoints**:
  - `POST /api/auth/google/callback`
  - `POST /api/auth/apple/callback`
  - `POST /api/auth/microsoft/callback`
  - `POST /api/auth/facebook/callback`
- **User Model Fields**: `google_connected`, `apple_connected`, `microsoft_connected`, `facebook_connected`
- **Test Coverage**: 14/14 tests passed (100%)
- **Files Modified**: `AuthCallback.js`, `Login.js`, `Settings.js`, `server.py`, `SecuritySection.js`

#### Google OAuth Integration ✅
- **Login Page**: Added "Sign in with Google" button
- **Settings > Security**: Added Google Connect functionality
- **AuthCallback component**: Handles OAuth callback flow
- **Backend**: `/api/auth/google/callback` endpoint for user creation/linking
- Files: `AuthCallback.js`, `GoogleSignInButton.js`, `Login.js`, `Settings.js`, `server.py`

#### Settings Constants Extracted ✅
- Created `/app/frontend/src/components/settings/constants.js`
- Contains: AVATAR_OPTIONS, LIFE_STAGE_OPTIONS, OCCUPATION_OPTIONS, TIMEZONE_OPTIONS, FONT_OPTIONS, EXPERIENCE_LEVELS, LANGUAGE_OPTIONS, SECTIONS
- Helper functions: `getLifeStageLabel()`, `getExperienceLabel()`

#### Previous Session Fixes ✅
- Combined Profile + Personal Info sections (removed duplication)
- Daily learning goal slider: 5-240 min range
- Enter key on confirm password triggers Continue
- City placeholder: "Sacramento" instead of "San Francisco"
- Auto-capitalize first name
- Darker hover states for accessibility
- Email validation on registration Step 1 (real-time check)

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

### Global Auto-Save System (January 6, 2026)

**Unified progress saving across ALL features:**

| Endpoint | Function |
|----------|----------|
| `POST /api/progress/save` | Save progress for any feature |
| `GET /api/progress/{feature}` | Get saved progress for a feature |
| `DELETE /api/progress/{feature}` | Clear progress after completion |
| `GET /api/progress` | Get ALL saved progress (for dashboard) |

**Features Using Global Auto-Save:**
- **PPI:** `feature="ppi"` - saves answers + current_index
- **LPI:** `feature="lpi_{chapterId}"` - saves currentView, lessonIndex, quizAnswers
- **Future:** Onboarding, quizzes, any new feature

**Frontend Hook:** `/app/frontend/src/hooks/useAutoSave.js`
```javascript
const { saveProgress, loadProgress, clearProgress, hasSavedProgress } = useAutoSave('ppi', token);
```

**Storage Collection:** `user_progress` in MongoDB
```json
{
  "user_id": "...",
  "feature": "ppi",
  "data": { "answers": [...], "current_index": 5 },
  "updated_at": "2026-01-06T..."
}
```

### Test Results (Iteration 2)
- **Backend:** 12/12 tests passed (100%)
- **Frontend:** All flows verified
- Test file: `/app/tests/test_ppi_30q_autosave.py`

---

---

## Settings Page (January 9, 2026) ✅

### Comprehensive Settings Implementation
The Settings page has been fully built with 9 sections:

| Section | Features | Status |
|---------|----------|--------|
| **Profile** | Name, Avatar picker, Profile picture upload, User ID display | ✅ |
| **Personal Info** | DOB, Life Stage, Occupation, Location (Google Places), Timezone, Backup Email | ✅ |
| **Learning** | Language, Experience Level, Daily Learning Goal (SLIDER), Enable Hints, Financial Goals | ✅ |
| **Notifications** | Master toggle, Reminder time, Achievement/Milestone/Streak alerts, Email frequency, Quiet hours | ✅ |
| **Display** | Dark Mode, Text Size, Font Style picker (12 fonts), High Contrast, Reduce Animations | ✅ |
| **Security** | Change Password, Active Sessions, Connected Accounts | ✅ |
| **Privacy** | Profile visibility, Share progress, Analytics, Data retention, Export data, Learning history | ✅ |
| **Parental Controls** | Coming Soon placeholder with Phase 1/2/3 roadmap | 🔜 MOCKED |
| **Account Actions** | Reset Progress, Delete Account | ✅ |

### Recent UI Update (January 9, 2026)
- **Daily Learning Goal**: Converted from buttons to slider component
  - Range: 5-60 minutes (step of 5)
  - Contextual messages based on value
  - Visual gradient fill showing progress

### Key Files
- `/app/frontend/src/pages/Settings.js` - Main settings page (1300+ lines)
- `/app/backend/server.py` - Backend API endpoints

### API Endpoints
- `PUT /api/settings` - Save all settings
- `POST /api/auth/change-password` - Change password
- `GET /api/user/export-data` - GDPR data export
- `POST /api/user/reset-progress` - Reset learning progress
- `POST /api/upload/profile-picture` - Upload profile picture
- `POST /api/location/search` - Google Places search
- `POST /api/location/reverse-geocode` - Google Geocoding

### Test Results (Iteration 3)
- **Frontend:** 100% tests passed
- All 9 sections accessible and functional
- Slider interaction verified
- Save functionality works with success message

---

## Phase 1: Foundation Data & Utilities (January 9, 2026) ✅

### Topic Selection & Onboarding System

Complete foundational data and utility modules for the 270-question PPI and Topic Selection features:

#### Frontend Utility Modules (`/app/frontend/src/lib/`)

| Module | Purpose | Key Functions |
|--------|---------|---------------|
| `profileAccuracy.js` | Calculate profile accuracy % based on completed PPI layers | `getProfileAccuracy()`, `getAccuracyLabel()`, `getNextMilestone()` |
| `stageDetector.js` | Detect user's financial stage from topic selections | `detectUserStage()` → 5 stages: crisis, wealth_building, income_maximization, comprehensive, balanced |
| `topicGrouper.js` | Group selected topics by theme for summary display | `groupTopicsByTheme()`, `getThemeByCategory()` |
| `timelineCalculator.js` | Estimate learning completion time | `calculateTimeline()` → accounts for urgency |
| `conflictDetector.js` | Detect contradictory topic selections | `detectConflicts()` → 4 conflict types with recommendations |
| `topicSearch.js` | Fuzzy search for topics | `searchTopics()`, `highlightMatches()`, `getSearchSuggestions()` |
| `summaryGenerator.js` | Orchestrate post-selection summary | `generatePostSelectionSummary()` |
| `index.js` | Central export for all modules | All exports in one place |

#### Data Files

| File | Location | Contents |
|------|----------|----------|
| `topicCatalog.js` | `/app/frontend/src/data/` | 67 financial topics across 10 categories with detailed tooltips |
| `badgeCatalog.js` | `/app/frontend/src/data/` | 14 achievement badges with unlock conditions |
| `ppi_layers_2_7.json` | `/app/backend/data/` | 240 PPI questions (Layers 2-7, 40 questions each) |

#### Topic Categories (10 total, 67 topics)
1. Everyday Money (7 topics)
2. Debt & Credit (6 topics)
3. Saving & Planning (7 topics)
4. Investing & Wealth (8 topics)
5. Income & Career (6 topics)
6. Lifestyle & Wellbeing (6 topics)
7. Family & Relationships (5 topics)
8. Confidence & Mindset (8 topics)
9. Big Picture (7 topics)
10. Honest Reflections (7 topics)

#### Badge Categories (3 categories, 14 badges)
1. PPI Progress (4 badges): Foundation Builder → DNA Master
2. Achievements (6 badges): Quick Thinker, 100% Complete, etc.
3. Topic Completion (4 badges): Topic Starter → Learning Machine

#### PPI Layers Summary
| Layer | Name | Questions | Focus |
|-------|------|-----------|-------|
| 1 | Identity | 30 | Already exists |
| 2 | Context | 40 | Financial resilience, decision-making style |
| 3 | Motivation | 40 | Drivers and blockers |
| 4 | Patterns | 40 | Behavioral patterns |
| 5 | Origins | 40 | Money history and upbringing |
| 6 | Blind Spots | 40 | Self-awareness gaps |
| 7 | Meta-Awareness | 40 | Integration and reflection |

**Total: 270 questions across 7 layers**

---

## Phase 2: Backend Endpoints (January 9, 2026) ✅

### API Endpoints Added

#### PPI Layers API
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/ppi/layers` | GET | Get all 7 layers metadata | No |
| `/api/ppi/layer/{n}` | GET | Get questions for layer 1-7 | No |
| `/api/ppi/layer/{n}/submit` | POST | Submit layer answers, earn badges | Yes |
| `/api/ppi/progress` | GET | Get user's PPI completion status | Yes |

#### Topics API
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/topics/select` | POST | Save selected topics | Yes |
| `/api/topics/user` | GET | Get user's selected topics | Yes |
| `/api/topics/update` | PUT | Update selected topics | Yes |
| `/api/topics/remove/{id}` | DELETE | Remove a single topic | Yes |

#### Badges API
| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/badges` | GET | Get all 14 badges catalog | No |
| `/api/badges/user` | GET | Get user's earned badges | Yes |
| `/api/badges/user/check` | GET | Get earned vs locked badges | Yes |

### Database Collections Added
- `ppi_layer_answers` - Stores layer submissions per user
- `user_topics` - Stores selected topics per user
- `user_badges` - Stores earned badges per user

### Features
- **Auto Badge Awarding:** Badges automatically awarded on PPI completion
  - Layer completion badges (Foundation Builder → DNA Master)
  - Speed badges (Quick Thinker - <5 min)
  - Completion badges (100% Complete - no skips)
- **Accuracy Calculation:** Profile accuracy updates per layer completed
- **Progress Tracking:** Full progress tracking across all 7 layers

### Test Results
- All 11 endpoints tested and working ✅
- Badge awarding verified (Foundation Builder, Quick Thinker earned) ✅
- Topic save/retrieve verified ✅
- PPI progress tracking verified ✅

---

## Phase 3: Frontend Components (January 9, 2026) ✅

### Completed Components

#### 1. Topic Selection Page (`/topics`)
| Feature | Status | Description |
|---------|--------|-------------|
| Route | ✅ | `/app/frontend/src/pages/TopicSelection.js` |
| Search | ✅ | Real-time topic search with fuzzy matching |
| Categories | ✅ | 10 expandable category accordions |
| Select All | ✅ | Per-category select all/deselect all |
| Topic Tooltips | ✅ | Hover tooltips with detailed descriptions |
| Conflict Detection | ✅ | Modal warns of contradictory selections |
| Save & Continue | ✅ | Saves to `/api/topics/select` → redirects to summary |
| Skip Option | ✅ | "Skip for now" link → /ppi-layers |

#### 2. Topic Summary Page (`/topic-summary`)
| Feature | Status | Description |
|---------|--------|-------------|
| Route | ✅ | `/app/frontend/src/pages/TopicSummary.js` |
| Stage Badge | ✅ | Shows detected stage (Crisis, Balanced, etc.) |
| Focus Areas | ✅ | Grouped themes with descriptions |
| Timeline | ✅ | Estimated learning timeline |
| Recommended Path | ✅ | Phased learning approach |
| Next Steps | ✅ | Action items for the user |
| Start Learning | ✅ | "Let's Start Learning!" → /ppi-layers |

#### 3. PPI Layer Selector Page (`/ppi-layers`)
| Feature | Status | Description |
|---------|--------|-------------|
| Route | ✅ | `/app/frontend/src/pages/PPILayerSelector.js` |
| Quick Start | ✅ | 1 layer, 5 min, 60% accuracy |
| Balanced | ✅ | 3 layers, 20 min, 85% accuracy (recommended) |
| Complete Profile | ✅ | 7 layers, 45 min, 99% accuracy |
| Layer Breakdown | ✅ | Shows all 7 layers when "Complete" selected |
| Progress Display | ✅ | Shows completed layers if any |
| Skip Option | ✅ | "Use default" link → /ppi |

#### 4. Badge Display Component
| Feature | Status | Description |
|---------|--------|-------------|
| Component | ✅ | `/app/frontend/src/components/BadgeDisplay.js` |
| Dashboard Integration | ✅ | Compact view on Dashboard showing earned badges |
| Badge Catalog | ✅ | Shows all 14 badges with unlock status |
| Rarity Display | ✅ | Common → Legendary badge classification |

### Connected Onboarding Flow (January 9, 2026) ✅

Full user journey from registration to dashboard is now seamlessly connected:

```
Register → /topics → /topic-summary → /ppi-layers → /ppi → /dashboard
```

#### Routing Logic (App.js)
```javascript
const getOnboardingRedirect = () => {
  if (!user) return '/login';
  if (user.ppi_completed) return '/dashboard';
  if (!user.topics_selected) return '/topics';
  return '/ppi-layers';
};
```

#### User State Tracking
| Field | Set When | Effect |
|-------|----------|--------|
| `topics_selected` | User saves topics | Skip /topics on return |
| `ppi_completed` | User completes PPI | Go to /dashboard |

#### Skip Options
- `/topics`: "Skip for now" → /ppi-layers
- `/ppi-layers`: "Use default" → /ppi (with balanced option)

### Test Results
- **TopicSelection:** Search, categories, selection all working ✅
- **TopicSummary:** Stage detection, themes, timeline working ✅
- **PPILayerSelector:** All 3 options working with selection ✅
- **BadgeDisplay:** Integrated into Dashboard showing 0/14 badges ✅
- **Backend APIs:** All endpoints verified working ✅
- **Onboarding Flow:** Complete e2e flow tested ✅

---

## Upcoming Tasks

### P0 - High Priority
- [ ] Refactor Settings.js (1300+ lines → smaller components)
- [ ] Implement Phase 1 Parental Controls

### P1 - Medium Priority
- [ ] TAP 5.0 validators (Grammar, Readability, Meaning Drift)
- [ ] VIA Trait Report on Dashboard
- [ ] Connect React Native mobile app to backend APIs

### Backlog
- [ ] Parental Controls Phases 2 & 3
- [ ] Clarify PostgreSQL migration intent (user provided schema but app uses MongoDB)
- [ ] Server.py refactoring (split into router modules)

---

## Last Updated
January 9, 2026 - Phase 3 Frontend Components complete (4 new pages/components)
