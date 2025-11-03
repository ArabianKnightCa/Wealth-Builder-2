# Wealth Builder - Complete Application Specification
## Financial Education Platform POC v3.3

**Export Date:** January 11, 2025  
**Version:** 3.3  
**Owner:** Aman Bazel  
**Platform:** Emergent.sh AI Builder

---

## Table of Contents
1. [Application Overview](#application-overview)
2. [User Identity System](#user-identity-system)
3. [Database Schema](#database-schema)
4. [User Registration & Onboarding](#user-registration--onboarding)
5. [PPI - Personality Profile Questionnaire](#ppi---personality-profile-questionnaire)
6. [LPI - Learning Progress Index](#lpi---learning-progress-index)
7. [API Endpoints](#api-endpoints)
8. [UI/UX Specifications](#uiux-specifications)
9. [Technical Stack](#technical-stack)
10. [Content Library](#content-library)

---

## Application Overview

**Wealth Builder** is a personalized financial education platform that adapts to each user's learning style, age, and experience level through:
- Personality profiling (PPI) to understand learning preferences
- Adaptive Engine (AE) that customizes content delivery
- 10 progressive learning chapters (LPI) with quizzes
- Sequential chapter unlocking based on mastery (≥50% quiz score)

### Key Features
- ✅ Age-gated registration (minimum 8 years old)
- ✅ Minor consent system (< 18 requires parent email)
- ✅ Role-based cohort assignment (EDU vs GEN)
- ✅ 20-question personality assessment
- ✅ 10 chapters with 4 lessons each
- ✅ Interactive quizzes with immediate feedback
- ✅ Progress tracking and visual indicators
- ✅ Multi-language support (10 locales planned)
- ✅ Emergency exit (?) button on all pages

---

## User Identity System

### UID Format
`UID-PST-[COHORT]-[SEQ]`

**Examples:**
- `UID-PST-GEN-1` (First general user)
- `UID-PST-EDU-1` (First educational user)

### Components
- **PST:** Pacific Standard Time (HQ location)
- **COHORT:** EDU (educational) or GEN (general)
- **SEQ:** Sequential number per cohort

### Person Keys
- **PK-XXXXXXXX:** Permanent user identifier (8 alphanumeric)
- **PPK-XXXXXXXX:** Parent person key (8 alphanumeric)
- **FLK-XXXXXX:** Family link token (6 alphanumeric)

### Cohort Assignment
**EDU Cohort:**
- Middle / High School Student
- College / University Student
- Part-Time Worker / Student
- Educator / Mentor / Advisor

**GEN Cohort:**
- Full-Time Employee
- Self-Employed / Freelancer
- Parent / Guardian
- Unemployed / In Transition

---

## Database Schema

### T_USERS
```json
{
  "id": "uuid",
  "person_key": "PK-XXXXXXXX",
  "user_code": "UID-PST-[COHORT]-[SEQ]",
  "user_type": "POC | B1 | B2 | B3 | COMM",
  "cohort": "EDU | GEN",
  "email": "user@example.com",
  "password": "hashed_password",
  "first_name": "string",
  "dob_month": "integer",
  "dob_year": "integer",
  "language": "en",
  "experience_level": "1-5",
  "occupation": "string",
  "school_name": "string (optional)",
  "school_city": "string (optional)",
  "school_state": "string (optional)",
  "school_verified": "boolean",
  "age_verified": "boolean",
  "account_status": "active | restricted",
  "created_at": "datetime",
  "last_login": "datetime"
}
```

### T_PPI_ANSWERS
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "question_id": "ppi_01-20",
  "selected_option": "A | B | C | D",
  "answered_at": "datetime"
}
```

### T_LPI_PROGRESS
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "chapter_id": "CH01-10",
  "lesson_completed": ["lesson_1", "lesson_2", ...],
  "quiz_score": "float (0-100)",
  "quiz_completed_at": "datetime",
  "unlocked_at": "datetime"
}
```

### T_PROGRESS
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "current_module": "ppi | lpi | completed",
  "current_step": "string",
  "ppi_completed": "boolean",
  "lpi_current_chapter": "integer",
  "autosaved_at": "datetime"
}
```

### T_PARENTS
```json
{
  "parent_key": "PPK-XXXXXXXX",
  "emails": ["email@example.com"],
  "phones": ["phone_number"],
  "created_at": "datetime"
}
```

### T_FAMILY_LINKS
```json
{
  "parent_key": "PPK-XXXXXXXX",
  "child_person_key": "PK-XXXXXXXX",
  "link_token": "FLK-XXXXXX",
  "status": "pending | active | revoked",
  "created_at": "datetime",
  "revoked_at": "datetime"
}
```

### T_SETTINGS
```json
{
  "user_id": "uuid",
  "language": "en",
  "experience_level": "1-5",
  "notifications_enabled": "boolean"
}
```

### T_FEEDBACK
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "context_page": "string",
  "feedback_text": "string",
  "submitted_at": "datetime"
}
```

### T_TELEMETRY
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "event_type": "string",
  "event_data": "object",
  "timestamp": "datetime"
}
```

### T_ERRORS
```json
{
  "id": "uuid",
  "user_id": "uuid (optional)",
  "error_code": "string",
  "error_message": "string",
  "stack_trace": "string",
  "timestamp": "datetime"
}
```

---

## User Registration & Onboarding

### Registration Fields
1. **First Name** (required)
2. **Email** (required, unique)
3. **Password** (required, min 8 chars)
4. **Password Confirmation** (required, must match)
5. **Date of Birth** (required, age ≥ 8)
6. **Occupation/Role** (required, dropdown)
7. **School Information** (conditional - only for students)
   - School Name
   - City (optional)
   - State (optional)
8. **Parent Email** (conditional - required if age < 18)
9. **Financial Experience Level** (required, 1-5)
   - Dropdown with placeholder: "What's your level of financial experience?"

### Validation Rules
- **Email:** Valid format, unique in database
- **Password:** Minimum 8 characters, 1 uppercase, 1 number
- **Age:** Minimum 8 years old
- **Minor Consent:** If age < 18, parent email required
- **School Capture:** Shows only for student roles

### Post-Registration Flow
1. User submits registration
2. System creates user record with UID
3. System creates initial progress record (ppi_completed: false)
4. If minor: Create parent record and family link
5. Navigate to PPI Intro page
6. User completes PPI (20 questions)
7. Navigate to Dashboard (LPI chapters)

---

## PPI - Personality Profile Questionnaire

### Overview
20 questions designed to understand:
- Learning style preferences
- Financial decision-making patterns
- Motivation triggers
- Goal-setting approaches
- Time management preferences

### Structure
- **Total Questions:** 20
- **Format:** Multiple choice (A, B, C, D)
- **Time:** 5-7 minutes
- **Scoring:** No right/wrong answers - personality profiling

### Navigation
- Progress indicator: "X / 20" (left side)
- Help button (?) - emergency exit to dashboard
- Back button (← Back) - disabled on first question
- Next button (Next →) / Submit button on last question
- Auto-save functionality

### UI Features
- One question per page
- Large, clear question text
- Four option buttons with hover effects
- Selected option highlighted in gold
- Smooth transitions between questions

---

## LPI - Learning Progress Index

### Chapter Structure
**10 Chapters Total:**
1. Money Mindset & Value
2. Simple Budgeting
3. Saving That Sticks
4. Banking Basics
5. Credit Basics
6. Debt: Smart vs. Painful
7. Earning More
8. Investing Basics
9. Goals That Stick
10. Safety & Scams

### Chapter Format
Each chapter contains:
- **4 Lessons** (one per page with pagination)
- **Chapter Summary** (consolidated takeaways)
- **3 Quiz Questions** (must score ≥50% to unlock next)

### Lesson Structure
```
Lesson Title
Lesson Content (2-3 paragraphs)
💡 Takeaway: Key insight in one sentence
```

### Navigation
- Chapter title format: "Chapter X: [Title]"
- Progress bar showing lesson X of 4
- Go Back button (← Go Back)
- Next button (Next →) / "Continue to Summary →" on last lesson
- Help button (?) for emergency exit

### Chapter Summary
- Consolidated page showing all 4 lesson takeaways
- Bullet-point format
- 1-3 sentences maximum
- Go Back button and "Start Quiz →" button

### Quiz Structure
- 3 multiple-choice questions per chapter
- Four options (A, B, C, D) per question
- Click to select (option changes color)
- Go Back button (← Go Back) to return to summary
- Submit Quiz button

### Quiz Results Display
**Score Summary:**
- Pass/Fail indicator (≥50% to pass)
- Percentage score
- Correct count / Total questions

**Detailed Review:**
- All questions displayed
- ✓ Green highlight for correct answers
- ✗ Red highlight for incorrect answers
- User's wrong answer shown in red
- Correct answer shown in green
- Explanation shown ONLY for incorrect answers

**Actions After Quiz:**
- If passed: "Continue to Next Chapter →" button
- If failed: "← Review Lessons" and "Retake Quiz" buttons
- "Back to Dashboard" button always available

### Unlocking Rules
- Chapter 1 always unlocked
- Chapters 2-10 unlock after passing previous chapter quiz (≥50%)
- Chapter 10 completion shows fireworks and completion page

### Dashboard Display
- Chapter cards in grid layout (3 columns)
- Unlocked chapters: White card, clickable, no lock icon
- Locked chapters: Grayed out, 🔒 icon, not clickable
- Completed chapters: ✓ checkmark, quiz score displayed
- Progress tracking: Shows completion status

---

## API Endpoints

### Authentication
```
POST /api/auth/register
Body: {email, password, first_name, date_of_birth, occupation, user_type, language, experience_level, school_name?, school_city?, school_state?, parent_email?}
Returns: {user, access_token, token_type}

POST /api/auth/login
Body: {email, password}
Returns: {user, access_token, token_type}

GET /api/auth/me
Headers: {Authorization: Bearer <token>}
Returns: {user object}
```

### Content
```
GET /api/content/ppi
Returns: {questions: [20 PPI questions]}

GET /api/content/lpi
Returns: {chapters: [10 chapters with lessons and quizzes]}
```

### PPI
```
POST /api/ppi/submit
Headers: {Authorization: Bearer <token>}
Body: {answers: [{question_id, selected_option}]}
Returns: {message, next_step}

GET /api/ppi/answers
Headers: {Authorization: Bearer <token>}
Returns: {answers: [user's PPI answers]}
```

### LPI
```
POST /api/lpi/quiz/submit
Headers: {Authorization: Bearer <token>}
Body: {chapter_id, answers: [{question_id, selected_option}]}
Returns: {score, passed, correct_count, total_questions, next_chapter}

GET /api/lpi/progress
Headers: {Authorization: Bearer <token>}
Returns: {progress: [chapter progress array]}

POST /api/lpi/lesson/complete
Headers: {Authorization: Bearer <token>}
Body: {chapter_id, lesson_id}
Returns: {message}
```

### Progress
```
GET /api/progress
Headers: {Authorization: Bearer <token>}
Returns: {progress object}

POST /api/progress/update
Headers: {Authorization: Bearer <token>}
Body: {progress fields to update}
Returns: {message}
```

### Settings
```
GET /api/settings
Headers: {Authorization: Bearer <token>}
Returns: {settings object}

PUT /api/settings
Headers: {Authorization: Bearer <token>}
Body: {language?, experience_level?, notifications_enabled?}
Returns: {message}
```

### Feedback
```
POST /api/feedback
Headers: {Authorization: Bearer <token>}
Body: {context_page, feedback_text}
Returns: {message}
```

### Telemetry
```
POST /api/telemetry
Headers: {Authorization: Bearer <token>}
Body: {event_type, event_data}
Returns: {message}
```

---

## UI/UX Specifications

### Design System

**Color Palette:**
- **Primary Navy:** #1a202c (navy-900)
- **Secondary Navy:** #2d3748 (navy-800)
- **Accent Gold:** #f6ad55
- **Gold Hover:** #ed8936
- **White:** #ffffff
- **Gray Shades:** #e2e8f0, #cbd5e0, #a0aec0

**Typography:**
- **Font Family:** Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
- **Headings:** Bold, Navy-900
- **Body:** Regular, Gray-700
- **Labels:** Semibold, Gray-700

**Button Styles:**
- **Primary Button:** Gold background, navy text, rounded-lg, hover lift effect
- **Secondary Button:** Navy background, white text, rounded-lg, hover effect
- **Disabled Button:** Gray background, gray text, cursor-not-allowed

**Card Styles:**
- White background, rounded-xl, subtle shadow
- Hover: Elevated shadow, slight lift
- Border-left accent for special cards

### Page Layouts

**Welcome Page:**
- Hero section: Navy gradient background with pattern overlay
- Badge: "Your Financial Future Starts Here"
- Large title: "Wealth Builder"
- Subtitle: "Master Your Money, Build Your Wealth"
- Three feature cards with icons
- 10 chapter overview with icons
- "How It Works" - 3 steps with green circular numbers
- Final CTA section
- Footer with testing panel button (center)

**Dashboard:**
- Top navigation bar (navy)
  - Left: "Wealth Builder" title
  - Right: Welcome message, ? button, Settings, Logout
- Grid of chapter cards (3 columns)
- Chapter card states: Unlocked, Locked, Completed

**PPI Pages:**
- Intro page: White background, centered content
- Questions page: Dark navy gradient background
- Progress indicator on left: "X / 20"
- Help button (?) on right
- Large question card (white)
- Four option cards with hover and selected states
- Navigation buttons at bottom

**LPI Chapter Pages:**
- Top navigation: "Chapter X: [Title]"
- Help button (?) in top right
- Lesson view: One lesson per page with progress bar
- Summary view: Bullet list of takeaways
- Quiz view: One question at a time
- Results view: Detailed breakdown with color coding

**Settings Page:**
- Top navigation with help button
- Account info card (dark background)
  - User ID in gold badge
  - Person Key
  - Email
  - Cohort badge
- Preferences card (white background)
  - Language selector
  - Experience level selector
  - Notifications toggle

### Interactive Elements

**Quiz Options:**
- Default: White background, gray border
- Hover: Gold border, light gold background
- Selected: Gold border, light gold background, bold text
- Click: Visual feedback with color change

**Progress Bars:**
- Background: Light gray (#e2e8f0)
- Fill: Gold gradient
- Smooth animated transitions

**Help Button (?):**
- Large circular button
- Gold text on white background
- Visible on all pages
- Tooltip: "Help - Return to Dashboard"

---

## Technical Stack

### Backend
- **Framework:** FastAPI (Python 3.11)
- **Database:** MongoDB (local instance)
- **Authentication:** JWT tokens (7-day expiration)
- **Password Hashing:** bcrypt
- **Validation:** Pydantic models
- **CORS:** Enabled for frontend origin

### Frontend
- **Framework:** React 18
- **Routing:** React Router DOM
- **HTTP Client:** Axios
- **Styling:** Tailwind CSS
- **Build Tool:** Create React App
- **State Management:** React Hooks (useState, useEffect)

### Infrastructure
- **Process Manager:** Supervisor
- **Backend Port:** 8001 (internal)
- **Frontend Port:** 3000 (internal)
- **MongoDB Port:** 27017
- **Database Name:** test_database

### Environment Variables

**Backend (.env):**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
JWT_SECRET_KEY=your-secret-key-change-in-production-12345
```

**Frontend (.env):**
```
REACT_APP_BACKEND_URL=https://[your-deployment-url]
PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

---

## Content Library

### Budget Split Recommendation
**75/15/10 Rule:**
- 75% Essentials (needs)
- 15% Future You (savings/investing)
- 10% Flex (wants)

### Quiz Answer Keys
```javascript
CH01: Q01=B, Q02=B, Q03=C
CH02: Q01=B, Q02=B, Q03=B
CH03: Q01=B, Q02=C, Q03=B
CH04: Q01=B, Q02=B, Q03=C
CH05: Q01=A, Q02=B, Q03=B
CH06: Q01=B, Q02=B, Q03=B
CH07: Q01=B, Q02=B, Q03=B
CH08: Q01=B, Q02=B, Q03=C
CH09: Q01=B, Q02=B, Q03=C
CH10: Q01=B, Q02=C, Q03=C
```

### Chapter 1: Money Mindset & Value (COMPLETE EXAMPLE)

**Lesson 1: What Money Does**
Money is a tool that helps you trade your time and skills for things you need and want. It works best when you tell it where to go instead of wondering where it went. Money serves three jobs: medium of exchange (we trade with it), store of value (we can save it), and unit of account (we measure with it). Knowing these jobs helps you make calm, clear choices.
💡 Takeaway: When you give every dollar a job, money becomes a helper—not a stressor.

**Lesson 2: Choices: Needs vs. Wants**
A need keeps you safe, healthy, or able to earn (food, rent, internet for school/work). A want is extra—nice to have, not required right now. A simple rule: Cover needs first, set aside savings second, enjoy wants last. This order creates freedom instead of short-term pressure.
💡 Takeaway: Needs first, savings second, wants last.

**Lesson 3: The Habit Loop**
Small daily choices become automatic habits. When money habits are healthy, you build wealth without constant willpower. Start tiny: save $1 daily, track one expense, or pause 10 seconds before impulse buys. These micro-habits compound into major results.
💡 Takeaway: Tiny habits create massive momentum over time.

**Lesson 4: Your Money Story**
Everyone has a money story shaped by family, culture, and experience. Understanding your story helps you write a better next chapter. Ask yourself: What did I learn about money growing up? What do I want to change? Awareness is the first step to transformation.
💡 Takeaway: Knowing your money story empowers you to rewrite it.

**Quiz Questions:**

Q1: Money is most helpful when you…
A) Spend it as soon as you get it
B) Give every dollar a job ✓
C) Avoid using it at all
D) Only use cash
Rationale: A plan reduces stress and aligns spending with goals.

Q2: Which is a *need* for most learners?
A) Premium streaming
B) Internet for school/work ✓
C) Gaming add-ons
D) Takeout coffee
Rationale: Connectivity supports learning/earning—typically a need.

Q3: The order that builds freedom is…
A) Wants → Savings → Needs
B) Savings → Needs → Wants
C) Needs → Savings → Wants ✓
D) Needs → Wants → Savings
Rationale: Cover needs, then save, then enjoy wants.

---

## Testing & Quality Assurance

### Testing Panel Access
- URL: `/admin`
- Master Code: `wealthbuilder`
- Provides 5 pre-configured test personas
- Auto-creates and logs in test users
- Options: Fresh start, Skip to dashboard, Complete all chapters

### Test User Personas
1. 9 Year Old Beginner (Curious)
2. 45 Year Old Expert (Organized)
3. 67 Year Old Novice (Collaborative)
4. 30 Year Old Intermediate (Competitive)
5. 55 Year Old Advanced (Balanced)

### Critical User Flows to Test
1. Registration → PPI → Dashboard → Chapter 1 → Quiz → Next Chapter
2. Minor registration with parent consent
3. Student registration with school capture
4. Emergency exit (?) from any page
5. Quiz failure → Review lessons → Retake
6. Complete all 10 chapters → Completion page

### Known Features
- ✅ Emergency exit (?) button on all pages
- ✅ PPI auto-navigation after registration
- ✅ Chapter 1 auto-unlocked
- ✅ Sequential chapter unlocking
- ✅ Quiz results with color-coded feedback
- ✅ Progress tracking and auto-save
- ✅ Responsive design (desktop, tablet, mobile)

---

## Future Enhancements (Not Yet Implemented)

### Adaptive Engine (AE)
- MCC (Model Context Constraint) rules
- MRI (Model Response Instruction) processing
- Personalized lesson content based on PPI results
- Dynamic difficulty adjustment

### Additional Features
- Password reset via email
- Parent email verification
- Multi-language full implementation (10 locales)
- HUD progress bar showing overall completion %
- Average quiz score in HUD
- Social login (Google, Apple)
- Email notifications
- Mobile app (React Native)

### Analytics
- Google Analytics 4 integration
- User behavior tracking
- Completion rate analytics
- Drop-off point identification

---

## Deployment Information

### Local Development
```bash
# Backend
cd /app/backend
source /root/.venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend
cd /app/frontend
yarn start

# MongoDB
mongod --dbpath /data/db
```

### Supervisor Commands
```bash
# Check status
sudo supervisorctl status

# Restart all services
sudo supervisorctl restart all

# Restart individual services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
sudo supervisorctl restart mongodb
```

### Database Management
```bash
# Access MongoDB shell
mongosh mongodb://localhost:27017/test_database

# View users
db.users.find().pretty()

# View progress
db.progress.find().pretty()

# Reset user account
db.users.deleteOne({email: "user@example.com"})
db.ppi_answers.deleteMany({user_id: "user_id_here"})
db.lpi_progress.deleteMany({user_id: "user_id_here"})
db.progress.deleteMany({user_id: "user_id_here"})
```

---

## Credits & Acknowledgments

**Developed by:** Emergent AI (E1 Agent)  
**Project Owner:** Aman Bazel  
**Platform:** Emergent.sh  
**Development Period:** January 2025  
**Version:** POC v3.3

---

## Document Version History

- **v1.0 (Jan 11, 2025):** Initial complete specification export
- Contains all implemented features as of POC v3.3
- Includes user flows, database schema, API contracts
- Ready for handoff to development team or documentation

---

**END OF SPECIFICATION DOCUMENT**
