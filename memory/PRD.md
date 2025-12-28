# OurCircle - Family Dossier Management App

## Original Problem Statement
Build OurCircle - a family/child dossier management app with structure: Families → Children → Dossiers. Features include comprehensive child profiles with identity, school, favorites, personality sections, relationship timeline, and 10 selectable UI layouts with different visual styles.

## User Personas
- **Primary**: Parents and grandparents who want to document and preserve information about children
- **Secondary**: Caregivers and family members tracking child development and memories

## Core Requirements (Static)
1. PIN-based authentication (4-6 digits) with session persistence
2. 10 selectable UI layouts (different visual styles/navigation patterns)
3. 6 color themes
4. Family CRUD (create, read, update, delete, archive)
5. Children CRUD within families
6. Child dossier with tabbed sections (Identity, School, Favorites, Personality)
7. Relationship Timeline for tracking milestones and memories
8. Photo storage via Base64 in MongoDB
9. Comprehensive Settings (appearance, notifications, account, data)
10. Love Language selector with full explanations

## What's Been Implemented

### Phase 1 - December 28, 2025
- 3 initial UI layouts
- Settings expansion (4 tabs)
- Welcome flow

### Phase 2 - December 28, 2025

#### All 10 UI Layouts Complete
1. **Warm Scrapbook** - Photo-first, cozy, nostalgic with rounded corners
2. **Clean Clinical** - Left-side navigation with table view
3. **Timeline First** - Story-focused with timeline feed and birthday widgets
4. **Playful Pop** - Fun, kid-energy with carousel and bright accents
5. **Dark Detective** - Dark dossier vibe with sidebar activity feed
6. **Family Tree** - Expandable tree view with child branches
7. **Album Grid** - Photo grid layout like a photo album
8. **Modern Cards** - Mobile-first stacked cards with swipe actions
9. **Minimal Text** - Notion-style collapsible text-first design
10. **Dashboard Pro** - Dark command center with widgets and stats

#### Love Language Feature
- Dedicated LoveLanguageSelector component
- Expandable explanations for each love language:
  - Words of Affirmation
  - Quality Time
  - Receiving Gifts
  - Acts of Service
  - Physical Touch
- Primary and Secondary selection
- Helper text showing what each language means

#### Session Persistence
- Authentication state persists in sessionStorage
- No re-login required when navigating between pages

## Prioritized Backlog

### P0 (Complete)
- [x] All 10 UI Layouts built
- [x] Love Language with explanations
- [x] Session persistence

### P1 (Next Phase)
- [ ] QR Profile sharing
- [ ] Push notification support for birthday reminders
- [ ] Photo gallery view for children
- [ ] PDF export for dossiers

### P2 (Future)
- Multiple users with separate PINs
- Voice-to-text for quick notes
- Year-in-review auto-generated summaries
- Search across all families and children

## Next Tasks
1. Implement QR code profile sharing
2. Add push notification support for birthday reminders
3. Create printable/PDF export for child dossiers
