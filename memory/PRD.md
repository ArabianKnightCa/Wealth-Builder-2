# Wealth Builder - Product Requirements Document

## Original Problem Statement
Build a "Wealth Builder" application with an Adaptive Engine (AE) for personalized financial content. The core innovation is a 270-question Personality Profile Instrument (PPI) that measures 24 VIA Character Strengths through stealth financial scenarios, creating a user's "Financial DNA" for tailored learning experiences.

## Tech Stack
- **Frontend:** React
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (PostgreSQL migration planned)
- **External APIs:** Google Places API, Resend (email)

## Core Features

### ✅ Implemented

#### Authentication & User Management
- User registration with email/password
- JWT-based authentication
- Password reset via email (Resend integration)

#### Google Places Integration (Dec 2025)
- Location search via Places Autocomplete API
- Reverse geocoding for "Use Current Location"
- Secure API key storage in backend `.env`

#### Comprehensive Settings Page (Dec 2025)
- Profile picture upload
- Personal info (name, DOB, location, life stage, occupation)
- Learning preferences (daily goal slider)
- Display settings (font picker with live previews, dark mode)
- Notification controls
- Security (change password)
- Privacy (export data, reset progress, delete account)
- Financial goals selector with per-category "Select All"

#### Parental Controls Roadmap
- Detailed "Coming Soon" UI showing 3-phase implementation plan
- Phase 1: Parent linking, progress emails, weak topics dashboard
- Phase 2: Virtual piggybank, custom limits, messaging
- Phase 3: Advanced scheduling, community controls

### 🔄 In Progress

#### PPI Content Generation (Dec 2025)
- Created comprehensive Claude prompt for 270-question PPI generation
- Prompt file: `/app/CLAUDE_PPI_GENERATION_PROMPT_v2.md`
- Existing reference prompts: `/app/TAP_5_0_PPI_PROMPT_FOR_CLAUDE.md`

#### PPI Preview Tool (Dec 2025)
- Visual mock preview tool at `/ppi-preview`
- Features: Upload JSON, Validate structure, Filter by layer, Preview questions
- Shows delta_weights on MCQ options
- Validates: question counts, VIA trait coverage, layer distribution
- File: `/app/frontend/src/pages/PPIPreview.js`

### 📋 Backlog

#### P0 - Critical
- [ ] Integrate Claude-generated PPI content
- [ ] Layer selection UI in onboarding
- [ ] Sequential layer completion logic

#### P1 - High Priority
- [ ] Parental Controls MVP (Phase 1 features)
- [ ] TAP 5.0 Validators (grammar, readability, meaning drift)

#### P2 - Medium Priority
- [ ] Learning History page UI
- [ ] VIA Trait Report visualization
- [ ] Settings page refactoring (split into components)

#### P3 - Future
- [ ] MongoDB → PostgreSQL migration
- [ ] Plaid integration for bank syncing
- [ ] Mobile app backend connection
- [ ] Community features
- [ ] Virtual Piggybank implementation

## Key Files Reference

### Backend
- `/app/backend/server.py` - Main API server
- `/app/backend/.env` - Environment variables (GOOGLE_PLACES_API_KEY, MONGO_URL)
- `/app/backend/ppi_270_full.json` - Current PPI question bank
- `/app/backend/ppi_bank_trait_tags_v1_2.json` - Trait tagging system

### Frontend
- `/app/frontend/src/pages/Settings.js` - Settings hub (1300+ lines, needs refactoring)
- `/app/frontend/src/pages/PPI.js` - PPI questionnaire UI
- `/app/frontend/src/data/financialGoals.js` - Goal categories

### Documentation
- `/app/CLAUDE_PPI_GENERATION_PROMPT_v2.md` - Prompt for Claude PPI generation
- `/app/TAP_5_0_PPI_PROMPT_FOR_CLAUDE.md` - Original TAP 5.0 architecture

## Known Issues
1. **"Use Current Location" in preview** - Blocked by HTTP environment (requires HTTPS)
2. **Learning History page** - UI not implemented yet

## Database Schema
- User-provided PostgreSQL schema exists in chat history
- Defines tables for PPI, goals, badges, analytics
- Migration not yet initiated

## Last Updated
December 2025
