# 🏗️ WEALTH BUILDER POC - COMPLETE ARCHITECTURE EXPORT

**Export Date:** December 3, 2025  
**Version:** POC v1.0  
**Purpose:** External review by ChatGPT for architecture validation

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Four-Layer Personalization System](#four-layer-personalization)
3. [Onboarding Flow](#onboarding-flow)
4. [PPI System](#ppi-system)
5. [Adaptive Engine V2](#adaptive-engine)
6. [LPI Generation](#lpi-generation)
7. [Goal-Based Personalization](#goal-personalization)
8. [Data Models](#data-models)
9. [API Endpoints](#api-endpoints)
10. [Code Samples](#code-samples)
11. [Current Issues & Questions](#issues)

---

<a name="system-overview"></a>
## 1. SYSTEM OVERVIEW

### Tech Stack
- **Backend:** FastAPI (Python 3.11)
- **Frontend:** React 18
- **Database:** MongoDB
- **Deployment:** Kubernetes container

### File Structure
```
/app/
├── backend/
│   ├── server.py                     # Main API
│   ├── config.py                     # Configuration constants
│   ├── ae_engine_v2.py               # Adaptive Engine (ACTIVE)
│   ├── ae_engine.py                  # Old engine (UNUSED - dead code)
│   ├── content_data.py               # LPI chapters & quiz content
│   ├── ppi_bank_baseline_v1_1.json   # PPI questions
│   ├── ae_rules_poc_v1_1.json        # AE rules
│   ├── goal_chapter_mapping.json     # Goal-to-chapter mapping
│   └── quiz_validator.py             # Quiz validation
└── frontend/
    └── src/
        ├── pages/
        │   ├── PPI.js                # PPI questionnaire
        │   ├── LPIChapter.js         # Chapter lessons & quizzes
        │   └── Onboarding.js         # Onboarding (placeholder)
        └── utils/
            └── telemetry.js          # Telemetry tracking
```

---

<a name="four-layer-personalization"></a>
## 2. FOUR-LAYER PERSONALIZATION SYSTEM

### Architecture Overview
```
USER REGISTRATION
    ↓
[Layer 1] AGE (6-99)
    ↓ Purpose: Language complexity & age-appropriateness
    ↓
[Layer 2] EXPERIENCE LEVEL (1-5 in POC, 1-15 in commercial)
    ↓ Purpose: Knowledge starting point
    ↓
[Layer 3] PPI RESULTS (Psychological Profile)
    ↓ Purpose: Learning style & personality-based ordering
    ↓ Question selection filtered by AGE + EXPERIENCE
    ↓ User answers → Profile generated (Planner, Spontaneous, etc.)
    ↓
[Layer 4] FINANCIAL GOALS (18 goals defined)
    ↓ Purpose: Content relevance & chapter prioritization
    ↓
ADAPTIVE ENGINE GENERATES PERSONALIZED LPI
    ↓
CUSTOMIZED LEARNING PATH
```

### Layer Details

**Layer 1: AGE**
- Captured: Date of birth (month + year)
- Age bands: 6-12, 13-17, 18-99
- Current minimum age: 6
- Impact: Filters PPI questions, determines language complexity

**Layer 2: EXPERIENCE LEVEL**
- Scale: 1-5 (POC), will be 1-15 (commercial)
- 1 = Complete beginner
- 2 = Some knowledge
- 3 = Intermediate
- 4 = Advanced
- 5 = Expert/Guru
- Impact: Filters PPI questions (beginner vs advanced)
- **POC:** All users see all 10 chapters (no skipping)
- **Beta+:** Higher levels skip basic chapters

**Layer 3: PPI (Personality Profile Index)**
- Purpose: Psychological profiling without user awareness
- Generates: Financial DNA profile
- Profiles: Planner, Spontaneous, Confident Explorer, Cautious Learner, Balanced Builder
- Impact: Determines chapter ORDER

**Layer 4: FINANCIAL GOALS**
- 10 categories with subcategories
- Users select multiple goals
- Impact: Prioritizes relevant chapters higher in learning path

---

<a name="onboarding-flow"></a>
## 3. ONBOARDING FLOW

### Registration Endpoint
**POST /api/auth/register**

```python
# From server.py lines 60-100
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    date_of_birth: str              # Format: "YYYY-MM-DD"
    language: str = "en"             # Default: English
    experience_level: int            # 1-5 (POC), will be 1-15
    occupation: str                  # elementary_student, high_school, etc.
    state: Optional[str]             # California, Texas, etc.
    school_name: Optional[str]       # For students
    school_city: Optional[str]
    school_state: Optional[str]
    parent_email: Optional[EmailStr] # Required for minors
    financial_goals: Optional[List[str]] = []  # Array of goal IDs
    custom_goals: Optional[List[str]] = []     # User-defined goals
    user_type: str = "POC"
```

### Registration Logic
```python
# From server.py lines 365-450
async def register(user_data: UserCreate):
    # 1. Validate age (minimum 6 years old)
    age = calculate_age(user_data.date_of_birth)
    if age < MINIMUM_USER_AGE:
        raise HTTPException(400, f"User must be at least {MINIMUM_USER_AGE} years old")
    
    # 2. Parse DOB
    dob_parts = user_data.date_of_birth.split('-')
    dob_year = int(dob_parts[0])
    dob_month = int(dob_parts[1])
    
    # 3. Check if minor (< 18)
    is_minor = age < 18
    
    # 4. Account status (currently all active for testing)
    account_status = "active"  # TODO: Re-enable parent approval for production
    
    # 5. Create user record
    user = {
        "id": str(uuid.uuid4()),
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "dob_year": dob_year,
        "dob_month": dob_month,
        "language": user_data.language,
        "experience_level": user_data.experience_level,
        "occupation": user_data.occupation,
        "state": user_data.state,
        "school_name": user_data.school_name,
        "school_city": user_data.school_city,
        "school_state": user_data.school_state,
        "parent_email": user_data.parent_email,
        "financial_goals": user_data.financial_goals or [],
        "custom_goals": user_data.custom_goals or [],
        "user_type": user_data.user_type,
        "account_status": account_status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # 6. Insert into database
    await db.users.insert_one(user)
    
    # 7. Create JWT token
    token = create_access_token({"sub": user["id"]})
    
    return {
        "user": {key: val for key, val in user.items() if key != "password_hash"},
        "access_token": token,
        "token_type": "bearer"
    }
```

### Data Captured
✅ Age (from DOB)
✅ Experience level (1-5)
✅ Location (state)
✅ Occupation/role
✅ School info (if student)
✅ Parent email (if minor)
✅ Financial goals (array)
✅ Custom goals (array)
✅ Language preference

---

<a name="ppi-system"></a>
## 4. PPI SYSTEM (Personality Profile Index)

### Purpose
Psychological questionnaire that profiles users WITHOUT them realizing it.

### PPI Question Bank Structure

**File:** `/app/backend/ppi_bank_baseline_v1_1.json`

```json
{
  "schema_version": "1.1.1",
  "ppi_bank_version": "POC-v1.1.1-baseline",
  "description": "Baseline PPI question bank with age & experience filtering",
  "items": [
    {
      "id": "PPI_Q01",
      "prompt": "When making financial decisions, I prefer to:",
      "options": [
        "A Research extensively before deciding",
        "B Go with my gut feeling",
        "C Ask others for advice first",
        "D Make quick decisions and adjust later"
      ],
      "tags": ["decision_style", "beginner_safe", "intermediate_safe", "advanced"],
      "age_min": 6,
      "age_max": 99,
      "experience_levels": ["beginner", "intermediate", "advanced"]
    },
    {
      "id": "PPI_Q02",
      "prompt": "My approach to saving money is:",
      "options": [
        "A Save a fixed amount each month",
        "B Save whatever is left over",
        "C I struggle to save consistently",
        "D I have an automatic savings plan"
      ],
      "tags": ["saving_habits", "discipline", "beginner_safe", "intermediate_safe"],
      "age_min": 6,
      "age_max": 99,
      "experience_levels": ["beginner", "intermediate", "advanced"]
    }
    // ... 18 more questions
  ]
}
```

### PPI Composition Endpoint

**GET /api/content/ppi/personalized**

```python
# From server.py lines 323-358
@api_router.get("/content/ppi/personalized")
async def get_personalized_ppi(user_id: str = Depends(get_current_user)):
    """Returns personalized 20 PPI questions based on user profile"""
    
    # 1. Get user from database
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    
    # 2. Calculate age
    today = datetime.today()
    age = today.year - user['dob_year']
    
    # 3. Map experience level to string
    exp_map = {
        1: 'beginner', 
        2: 'beginner', 
        3: 'intermediate', 
        4: 'advanced', 
        5: 'advanced'
    }
    financial_experience = exp_map.get(user['experience_level'], 'beginner')
    
    # 4. Call Adaptive Engine V2 to compose PPI
    ae_v2 = get_adaptive_engine_v2()
    ppi_result = ae_v2.compose_ppi(
        user_id=user_id,
        age=age,
        financial_experience=financial_experience,
        occupation_bucket=user.get('occupation', None),
        locale=user.get('language', 'en-US')
    )
    
    return ppi_result
```

### PPI Filtering Logic (in AE)

```python
# From ae_engine_v2.py lines 65-125
def compose_ppi(self, user_id: str, age: int, financial_experience: str, 
               occupation_bucket: str = None, locale: str = "en-US"):
    """
    Dynamically select 20 PPI questions based on user profile
    
    Filtering:
    1. Age band (6-12, 13-17, 18-99)
    2. Experience level (beginner, intermediate, advanced)
    3. Exclude inappropriate tags (e.g., 'advanced' for young kids)
    """
    
    # Get age band
    age_band = self._get_age_band(age)  # e.g., "6-12"
    
    # Get constraints for this age band
    age_constraints = self.rules['constraints']['age_bands'].get(age_band, {})
    exclude_tags = age_constraints.get('exclude_tags', [])
    
    # Filter questions
    candidate_questions = []
    for item in self.ppi_bank['items']:
        # Check age range
        if not (item['age_min'] <= age <= item['age_max']):
            continue
        
        # Check experience level
        if financial_experience not in item['experience_levels']:
            continue
        
        # Check excluded tags
        if any(tag in item['tags'] for tag in exclude_tags):
            continue
        
        candidate_questions.append(item)
    
    # Deterministic selection (same user always gets same questions)
    random.seed(user_id)
    selected = random.sample(candidate_questions, min(20, len(candidate_questions)))
    
    return {
        "user_id": user_id,
        "age": age,
        "financial_experience": financial_experience,
        "ppi_version": "POC-v1.1.1",
        "items": selected
    }
```

### Age Band Calculation

```python
# From ae_engine_v2.py
MINIMUM_AGE = 6  # From config.py
CHILD_AGE_MAX = 12
TEEN_AGE_MAX = 17

def _get_age_band(self, age: int) -> str:
    """Dynamically calculate age band"""
    if self.MINIMUM_AGE <= age <= self.CHILD_AGE_MAX:
        return f"{self.MINIMUM_AGE}-{self.CHILD_AGE_MAX}"  # "6-12"
    elif self.CHILD_AGE_MAX < age <= self.TEEN_AGE_MAX:
        return f"{self.CHILD_AGE_MAX + 1}-{self.TEEN_AGE_MAX}"  # "13-17"
    else:
        return f"{self.TEEN_AGE_MAX + 1}-99"  # "18-99"
```

---

<a name="adaptive-engine"></a>
## 5. ADAPTIVE ENGINE V2

### File: `/app/backend/ae_engine_v2.py`

### Core Functions

**1. compose_ppi()** - Already shown above

**2. generate_plan()** - Main entry point

```python
# From ae_engine_v2.py lines 365-410
def generate_plan(self, user_id: str, answers: List[Dict[str, str]], 
                  age: int = None, goals: List[str] = None) -> Dict[str, Any]:
    """
    Generate Financial DNA + personalized LPI plan
    
    Inputs:
    - PPI answers (psychological profile)
    - Age (developmental appropriateness)
    - Financial goals (content prioritization)
    
    Returns:
    {
        "dna": {
            "profile": "Planner",
            "weights": {
                "discipline": 0.8,
                "impulse": 0.2,
                "confidence": 0.7,
                "tempo": "steady"
            }
        },
        "lpi_plan": {
            "version": "POC-v1.1.1",
            "chapters": [...],
            "goals_applied": 2
        }
    }
    """
    
    # 1. Convert answers to dict
    answer_map = {ans['id']: ans['value'] for ans in answers}
    
    # 2. Calculate Financial DNA from PPI answers
    dna = self._calculate_financial_dna(answer_map)
    
    # 3. Generate LPI plan based on DNA + Age + Goals
    lpi_plan = self._generate_lpi_plan(dna, age=age, goals=goals)
    
    return {
        "dna": dna,
        "lpi_plan": lpi_plan,
        "user_id": user_id,
        "age": age,
        "goals": goals or [],
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }
```

**3. _calculate_financial_dna()** - Profile users psychologically

```python
# From ae_engine_v2.py lines 175-265
def _calculate_financial_dna(self, answer_map: Dict[str, str]) -> Dict[str, Any]:
    """
    Map PPI answers to Financial DNA profile
    
    Analyzes 4 dimensions:
    - Discipline (0-1): Planning vs spontaneity
    - Impulse (0-1): Quick decisions vs deliberation
    - Confidence (0-1): Risk tolerance
    - Tempo: fast, steady, slow (learning pace)
    
    Returns one of 5 profiles:
    - Planner
    - Spontaneous
    - Confident Explorer
    - Cautious Learner
    - Balanced Builder
    """
    
    # Initialize scores
    discipline_score = 0
    impulse_score = 0
    confidence_score = 0
    
    # Scoring logic based on answer patterns
    # Q01: Decision style
    if answer_map.get('PPI_Q01') == 'A':  # Research extensively
        discipline_score += 2
    elif answer_map.get('PPI_Q01') == 'D':  # Quick decisions
        impulse_score += 2
    
    # Q02: Saving habits
    if answer_map.get('PPI_Q02') == 'A':  # Fixed amount
        discipline_score += 2
    elif answer_map.get('PPI_Q02') == 'C':  # Struggle to save
        impulse_score += 2
    
    # ... scoring for all 20 questions
    
    # Normalize scores
    discipline = discipline_score / 10  # 0-1 scale
    impulse = impulse_score / 10
    confidence = confidence_score / 10
    
    # Determine profile
    if discipline > 0.7:
        profile = "Planner"
        tempo = "steady"
    elif impulse > 0.7:
        profile = "Spontaneous"
        tempo = "fast"
    elif confidence > 0.7:
        profile = "Confident Explorer"
        tempo = "fast"
    elif confidence < 0.3:
        profile = "Cautious Learner"
        tempo = "slow"
    else:
        profile = "Balanced Builder"
        tempo = "steady"
    
    return {
        "profile": profile,
        "weights": {
            "discipline": round(discipline, 2),
            "impulse": round(impulse, 2),
            "confidence": round(confidence, 2),
            "tempo": tempo
        }
    }
```

**4. _generate_lpi_plan()** - Create personalized chapter order

```python
# From ae_engine_v2.py lines 280-360
def _generate_lpi_plan(self, dna: Dict[str, Any], age: int = None, 
                       goals: List[str] = None) -> Dict[str, Any]:
    """
    Generate LPI plan based on:
    - PPI profile (chapter ordering)
    - Age (content appropriateness - future)
    - Goals (chapter prioritization)
    """
    
    profile = dna['profile']
    tempo = dna['weights']['tempo']
    
    # Base chapter orders by profile
    chapter_orders = {
        "Planner": [1, 2, 4, 3, 8, 7, 9, 6, 5, 10],
        "Spontaneous": [1, 8, 2, 3, 7, 4, 6, 9, 5, 10],
        "Confident Explorer": [1, 2, 3, 5, 4, 6, 8, 7, 9, 10],
        "Cautious Learner": [1, 2, 8, 3, 7, 9, 4, 6, 5, 10],
        "Balanced Builder": [1, 2, 3, 4, 8, 7, 9, 6, 5, 10]
    }
    
    # Get base order
    base_order = chapter_orders.get(profile, chapter_orders["Balanced Builder"])
    
    # Apply goal prioritization if provided
    if goals and age:
        chapter_order = self._apply_goal_prioritization(base_order, goals, age)
    else:
        chapter_order = base_order
    
    # Build chapter plan
    chapters = []
    for ch_num in chapter_order:
        chapters.append({
            "ch": ch_num,
            "lessons": [1, 2, 3, 4],
            "quiz_mode": "choice_abcd"
        })
    
    return {
        "version": "POC-v1.1.1",
        "chapters": chapters,
        "tempo": tempo,
        "profile": profile,
        "goals_applied": len(goals) if goals else 0
    }
```

---

<a name="lpi-generation"></a>
## 6. LPI (Learning Path Index) GENERATION

### Current LPI Content

**File:** `/app/backend/content_data.py`

```python
# 10 Chapters in LPI
LPI_CHAPTERS = {
    "CH01": {
        "title": "Money Basics",
        "lessons": [
            {
                "id": "L01",
                "title": "What Is Money, Really?",
                "content": "Money is a shared agreement. We accept it today because we believe others will accept it tomorrow..."
            },
            # 3 more lessons
        ],
        "quiz": [
            {
                "id": "CH01_Q01",
                "question": "Why does money work better than bartering?",
                "options": {
                    "A": "Money is more durable",
                    "B": "Money solves the timing problem",
                    "C": "Money is universally accepted",
                    "D": "Money is government-backed"
                },
                "correct": "B"
            },
            # 9 more questions
        ]
    },
    "CH02": {"title": "Budgeting", ...},
    "CH03": {"title": "Saving & Spending", ...},
    "CH04": {"title": "Credit", ...},
    "CH05": {"title": "Investing", ...},
    "CH06": {"title": "Income", ...},
    "CH07": {"title": "Mindset", ...},
    "CH08": {"title": "Goals", ...},
    "CH09": {"title": "Risk & Protection", ...},
    "CH10": {"title": "Safety & Scams", ...}
}
```

### ⚠️ CRITICAL ISSUE IDENTIFIED

**Current State:**
- ❌ Content is STATIC (same text for all users)
- ❌ 8-year-old sees same lesson as 25-year-old
- ❌ No age-based language adjustment
- ❌ No personality-based examples (sci-fi vs nature)

**What's Needed for POC:**
- ✅ Multiple content variants per chapter
- ✅ Age-appropriate language (6-12, 13-17, 18+)
- ✅ Experience-level depth (beginner vs advanced)
- ✅ Personality-adapted examples (based on PPI profile)

**Example Structure Needed:**
```python
LPI_CHAPTERS = {
    "CH01": {
        "title": "Money Basics",
        "variants": {
            "age_6_12_beginner": {
                "lessons": [...],  # Simple concepts
                "examples": ["toys", "allowance", "piggy bank"]
            },
            "age_13_17_beginner": {
                "lessons": [...],  # Teen-relevant
                "examples": ["first job", "saving for car"]
            },
            "age_18_plus_beginner": {
                "lessons": [...],  # Adult concepts
                "examples": ["bills", "rent", "income"]
            },
            "age_18_plus_advanced": {
                "lessons": [...],  # Advanced depth
                "examples": ["portfolio", "tax strategies"]
            }
        }
    }
}
```

---

<a name="goal-personalization"></a>
## 7. GOAL-BASED PERSONALIZATION

### Goal-to-Chapter Mapping

**File:** `/app/backend/goal_chapter_mapping.json`

```json
{
  "schema_version": "1.0.0",
  "goal_definitions": [
    {
      "id": "save_for_purchase",
      "label": "Save for a specific purchase",
      "age_appropriate": [6, 99],
      "primary_chapters": [3, 8],
      "secondary_chapters": [2, 1],
      "priority_boost": 2
    },
    {
      "id": "learn_money_basics",
      "label": "Learn what money is and how it works",
      "age_appropriate": [6, 99],
      "primary_chapters": [1, 2],
      "secondary_chapters": [3, 7],
      "priority_boost": 3
    },
    {
      "id": "pay_off_debt",
      "label": "Pay off debt (credit cards, loans)",
      "age_appropriate": [18, 99],
      "primary_chapters": [4, 2],
      "secondary_chapters": [3, 6],
      "priority_boost": 3
    }
    // ... 15 more goals
  ],
  
  "chapter_info": {
    "1": {"title": "Money Basics"},
    "2": {"title": "Budgeting"},
    "3": {"title": "Saving & Spending"},
    "4": {"title": "Credit"},
    "5": {"title": "Investing"},
    "6": {"title": "Income"},
    "7": {"title": "Mindset"},
    "8": {"title": "Goals"},
    "9": {"title": "Risk & Protection"},
    "10": {"title": "Safety & Scams"}
  }
}
```

### Goal Prioritization Logic

```python
# From ae_engine_v2.py lines 285-320
def _apply_goal_prioritization(self, base_order: List[int], 
                               goals: List[str], age: int) -> List[int]:
    """
    Adjust chapter order based on user's financial goals
    
    Rules:
    1. Filter goals by age (age_appropriate range)
    2. Primary chapters get 10x priority
    3. Secondary chapters get 5x priority
    4. CH01 always stays first
    5. Rest sorted by priority score
    """
    
    if not goals:
        return base_order
    
    # Build priority scores
    chapter_scores = {ch: 0 for ch in base_order}
    
    for goal_id in goals:
        goal_def = next((g for g in self.goal_mapping['goal_definitions'] 
                        if g['id'] == goal_id), None)
        if not goal_def:
            continue
        
        # Check age-appropriate
        age_min, age_max = goal_def['age_appropriate']
        if not (age_min <= age <= age_max):
            continue
        
        # Add priority
        boost = goal_def.get('priority_boost', 1)
        for ch in goal_def.get('primary_chapters', []):
            chapter_scores[ch] += 10 * boost
        for ch in goal_def.get('secondary_chapters', []):
            chapter_scores[ch] += 5 * boost
    
    # Sort: CH01 first, then by score
    ch01 = [1]
    others = [ch for ch in base_order if ch != 1]
    sorted_others = sorted(others, key=lambda ch: (-chapter_scores[ch], others.index(ch)))
    
    return ch01 + sorted_others
```

### 10 Goal Categories (User Requirement)

**Categories to Implement:**
1. Core Money Goals
2. Debt & Credit
3. Saving/Life Plans
4. Investing Goals
5. Income/Career
6. Lifestyle/Quality of Life Goals
7. Family/Relationship Goals
8. Confidence/Mindset Goals
9. Big Dreams & Future Vision Goals
10. Real Talk/Personal Goals

**Current Status:** Only 18 individual goals defined, not organized into 10 categories yet.

---

<a name="data-models"></a>
## 8. DATA MODELS

### User Model
```python
{
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "dob_year": 2010,
    "dob_month": 6,
    "language": "en",
    "experience_level": 1,  # 1-5
    "occupation": "elementary_student",
    "state": "California",
    "school_name": "Lincoln Elementary",
    "financial_goals": ["save_for_purchase", "learn_money_basics"],
    "custom_goals": [],
    "account_status": "active",
    "created_at": "2025-12-03T00:00:00Z"
}
```

### PPI Answers Model
```python
{
    "id": "uuid",
    "user_id": "user-uuid",
    "question_id": "PPI_Q01",
    "selected_option": "A",
    "answered_at": "2025-12-03T00:00:00Z"
}
```

### Learning Map Model
```python
{
    "user_id": "user-uuid",
    "user_profile": "Planner",
    "learning_style": "Planner",
    "lesson_order": ["CH01", "CH02", "CH04", ...],
    "difficulty_weights": {},
    "pacing": "steady",
    "reinforcement_rate": 0.6,
    "financial_dna": {
        "profile": "Planner",
        "weights": {
            "discipline": 0.8,
            "impulse": 0.2,
            "confidence": 0.7,
            "tempo": "steady"
        }
    },
    "lpi_plan": {
        "version": "POC-v1.1.1",
        "chapters": [...],
        "goals_applied": 2
    },
    "generated_at": "2025-12-03T00:00:00Z",
    "ae_version": "v2.0"
}
```

---

<a name="api-endpoints"></a>
## 9. API ENDPOINTS

### Authentication
```
POST /api/auth/register        # Register new user
POST /api/auth/login           # Login
```

### PPI Flow
```
GET  /api/content/ppi/personalized  # Get age/experience-filtered questions
POST /api/ppi/submit                # Submit answers, generate plan
```

### LPI Flow
```
GET  /api/content/lpi              # Get all chapters (static)
GET  /api/lpi/chapter/:chapterId   # Get specific chapter content
POST /api/lpi/quiz/submit          # Submit quiz answers
```

### Telemetry
```
POST /api/telemetry/session        # Log session
POST /api/telemetry/quiz-attempt   # Log quiz attempt
POST /api/telemetry/ppi-completed  # Log PPI completion
POST /api/telemetry/topic-completed # Log topic completion
```

### Analytics
```
POST /api/analytics/generate/all   # Generate analytics
GET  /api/analytics/user-progress  # Get user progress
GET  /api/analytics/topic-performance
GET  /api/analytics/chapter-heatmap
```

---

<a name="code-samples"></a>
## 10. KEY CODE SAMPLES

### PPI Submission Flow (Full Integration)

```python
# From server.py lines 499-570
@api_router.post("/ppi/submit")
async def submit_ppi(ppi_data: PPISubmit, user_id: str = Depends(get_current_user)):
    """Process PPI and generate personalized learning plan"""
    
    # 1. Save PPI answers
    await db.ppi_answers.delete_many({"user_id": user_id})
    for answer in ppi_data.answers:
        ppi_answer = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "question_id": answer['question_id'],
            "selected_option": answer['selected_option'],
            "answered_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ppi_answers.insert_one(ppi_answer)
    
    # 2. Get user info for age and goals
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(404, "User not found")
    
    # 3. Calculate age
    age = calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01")
    goals = user.get('financial_goals', [])
    
    # 4. Call Adaptive Engine
    ae_v2 = get_adaptive_engine_v2()
    
    # 5. Format answers
    answers_formatted = []
    for answer in ppi_data.answers:
        answers_formatted.append({
            "id": answer['question_id'],
            "value": answer['selected_option']
        })
    
    # 6. Generate plan (ALL 4 LAYERS)
    plan = ae_v2.generate_plan(
        user_id=user_id,
        answers=answers_formatted,
        age=age,
        goals=goals
    )
    
    # 7. Extract chapter order
    chapter_order = [f"CH{ch['ch']:02d}" for ch in plan['lpi_plan']['chapters']]
    
    # 8. Create learning map
    learning_map = {
        "user_profile": plan['dna']['profile'],
        "learning_style": plan['dna']['profile'],
        "lesson_order": chapter_order,
        "difficulty_weights": {},
        "pacing": plan['dna']['weights']['tempo'],
        "reinforcement_rate": 0.6,
        "financial_dna": plan['dna'],
        "lpi_plan": plan['lpi_plan'],
        "generated_at": plan['generated_at'],
        "ae_version": "v2.0"
    }
    
    # 9. Save to database
    await db.progress.update_one(
        {"user_id": user_id},
        {"$set": {"learning_map": learning_map}},
        upsert=True
    )
    
    return {
        "message": "PPI processed successfully",
        "learning_map": learning_map
    }
```

---

<a name="issues"></a>
## 11. CURRENT ISSUES & QUESTIONS FOR CHATGPT

### ⚠️ CRITICAL ISSUE: Content Personalization

**Problem:**
The LPI content in `content_data.py` is STATIC. All users (regardless of age, experience, or personality) see the same lesson text and examples.

**What User Expects:**
- 8-year-old: Simple language, toy/allowance examples
- 16-year-old: Teen-relevant, first job/car examples
- 25-year-old beginner: Adult concepts, bills/rent examples
- 25-year-old advanced: Technical depth, portfolio/tax strategies

**Plus personality adaptation:**
- Sci-fi fan: Use space/tech examples
- Nature lover: Use garden/outdoor examples
- Practical person: Use real-world scenarios
- Creative person: Use artistic/design examples

**Current Implementation:**
```python
# STATIC - everyone sees this
"Money is a shared agreement. We accept it today because..."
```

**What's Needed:**
```python
# DYNAMIC - varies by user
if age < 13:
    content = "Money is like a special game token everyone agrees to use..."
elif age < 18:
    content = "Money represents value that society has agreed upon..."
else:
    content = "Money is a medium of exchange backed by collective trust..."

if profile == "Confident Explorer":
    example = "Think of money like a superpower you can use..."
elif profile == "Cautious Learner":
    example = "Money is a tool that helps you feel secure..."
```

### Questions for ChatGPT:

1. **Architecture Validation:**
   - Is the 4-layer personalization flow correctly implemented?
   - Are AGE, EXPERIENCE, PPI, and GOALS properly feeding into LPI generation?

2. **Content Variants:**
   - What's the best way to structure content variants?
   - Should we create separate files per age/experience combo?
   - How to dynamically select the right content at runtime?

3. **PPI Psychological Profiling:**
   - Are the 5 profiles accurate? (Planner, Spontaneous, etc.)
   - Is the DNA calculation logic psychologically sound?
   - Should there be more/fewer profiles?

4. **Goal System:**
   - Are 18 goals sufficient for POC?
   - How to organize into 10 categories as user requested?
   - Should custom goals influence chapter ordering?

5. **Missing Features:**
   - What else is critical for POC to demonstrate value?
   - Are we missing any key personalization dimensions?

6. **Dead Code:**
   - Confirm `ae_engine.py` should be deleted (unused)
   - Any other files we should remove?

---

## 📊 SUMMARY

### What's Working ✅
- Registration captures all 4 layers
- PPI filtered by age + experience
- Adaptive engine generates profile
- Goals prioritize chapters
- Chapter order personalized

### What's Broken ❌
- Content is STATIC (not personalized)
- No age-based language adjustment
- No personality-based examples
- Missing 10 goal categories structure

### What's Needed for POC 🎯
- Dynamic content selection system
- Content variants for age/experience
- Personality-adapted examples
- Goal category organization

---

**End of Architecture Export**

Please review and provide:
1. Validation of current architecture
2. Recommendations for content personalization
3. Any missing psychological/educational elements
4. Implementation guidance for dynamic content
