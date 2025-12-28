# OurCircle - Family Dossier Management App

## Original Problem Statement
Build OurCircle - a family/child dossier management app with structure: Families → Children → Dossiers. Features include comprehensive child profiles with identity, school, favorites, personality sections, relationship timeline, and 10 selectable UI layouts with different visual styles.

## User Personas
- **Primary**: Parents and grandparents who want to document and preserve information about children
- **Secondary**: Caregivers and family members tracking child development and memories

## Core Requirements (Static)
1. PIN-based authentication (4-6 digits)
2. 10 selectable UI layouts (different visual styles/navigation patterns)
3. 6 color themes
4. Family CRUD (create, read, update, delete, archive)
5. Children CRUD within families
6. Child dossier with tabbed sections (Identity, School, Favorites, Personality)
7. Relationship Timeline for tracking milestones and memories
8. Photo storage via Base64 in MongoDB
9. Comprehensive Settings (appearance, notifications, account, data)

## What's Been Implemented

### Phase 1 - December 28, 2025

#### 3 UI Layouts (of 10 planned)
1. **Warm Scrapbook** - Photo-first, cozy, nostalgic with rounded corners and warm cream tones
2. **Clean Clinical** - Ultra organized with left-side navigation and table view
3. **Timeline First** - Story-focused with timeline feed and birthday widgets

#### 6 Color Themes
- Warm Cream, Ocean Calm, Lavender Mist, Forest Earth, Sunset Glow, Midnight Ink

#### Expanded Settings (4 Tabs)
1. **Appearance**: UI Layout selector, Color themes, Reduce motion, Language, Date format
2. **Notifications**: Birthday reminders (1-28 days before), Push/Email notification toggles
3. **Account**: Change PIN, QR Profile sharing (coming soon), Logout, Delete Account
4. **Data**: Export all data (JSON/CSV), Auto-save toggle

#### Backend Additions
- /api/settings/ui - UI layout and color theme preferences
- /api/account (DELETE) - Delete all user data
- /api/export/{format} - Export data as JSON or CSV
- /api/settings/onboarding - Track onboarding completion

#### Welcome Flow
- Two-step onboarding: Step 1 = Layout selection, Step 2 = Color theme
- Only shown for new users after PIN setup

## Prioritized Backlog

### P0 (In Progress)
- [x] 3 UI Layouts built (Warm Scrapbook, Clean Clinical, Timeline First)
- [x] Settings expansion with 4 tabs
- [x] Birthday reminders UI
- [x] Data export functionality

### P1 (Next Phase - 7 More Layouts)
- [ ] Playful Pop - Kid-energy with icon categories
- [ ] Dark Mode Detective - Dossier vibe with dark theme
- [ ] Family Tree Hybrid - Genealogy meets notes
- [ ] Album Grid - Photo-first grid layout
- [ ] Modern Cards - Swipe-friendly card layout
- [ ] Minimal Text - Notion-style text-first
- [ ] Dashboard Pro - Command center for power users

### P2 (Future Features)
- Love Language dropdown with explanations in child dossier
- QR Profile sharing
- Push notification integration
- Photo gallery view for children
- PDF export for dossiers
- Search/filter on dashboard
- Multiple users with separate PINs

## Next Tasks
1. Build remaining 7 UI layouts
2. Add Love Language dropdown with explanations to child personality section
3. Implement QR code profile sharing
4. Add push notification support for birthday reminders
