# WEALTH BUILDER - ADAPTIVE ENGINE (AE) SPECIFICATION

## OVERVIEW

The **Adaptive Engine (AE)** is the core orchestration system that personalizes financial education content for each user. It sits between the user and the content delivery system, making decisions about WHAT content to show and HOW to present it.

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                │
│   Age (6-99) + Experience Level (1-5) + Financial Goals         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ADAPTIVE ENGINE (AE)                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AE_FN_COMPOSE_PPI                                        │  │
│  │  - Selects 20 appropriate PPI questions                   │  │
│  │  - Filters by age constraints                             │  │
│  │  - Filters by experience level                            │  │
│  │  - Applies TAP for text adaptation                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AE_FN_GENERATE_PLAN                                      │  │
│  │  - Calculates Financial DNA from PPI responses            │  │
│  │  - Determines personality archetype                       │  │
│  │  - Orders chapters based on DNA + Goals                   │  │
│  │  - Generates personalized LPI plan                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           TAP v5.0                               │
│  - Adapts text based on LC (Learning Complexity)                │
│  - Child/Bridge/Expert text selection                           │
│  - DNA-based framing and personalization                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PERSONALIZED OUTPUT                         │
│  - PPI questions (adapted for user level)                       │
│  - LPI lessons (right complexity, right order)                  │
│  - Quizzes (age-appropriate language)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## CORE FUNCTIONS

### 1. AE_FN_COMPOSE_PPI

**Purpose:** Dynamically select and adapt 20 PPI (Personal Profile Index) questions for the user.

**Inputs:**
- `user_id`: Unique identifier (used as deterministic seed)
- `age`: User age (6-99)
- `financial_experience`: "beginner" | "intermediate" | "advanced"
- `occupation_bucket`: Optional occupation category
- `locale`: Language/region (default: "en-US")

**Process:**
```
1. Set deterministic seed using user_id (reproducible results)
2. Determine age band:
   - Child: 6-12 (exclude advanced content)
   - Teen: 13-17 (allow most content)
   - Adult: 18-99 (allow all content)
3. Filter PPI bank by:
   - Age range (min/max)
   - Experience level compatibility
   - Tag exclusions (e.g., kids don't get "advanced" tagged questions)
4. Pass questions through TAP for text adaptation
5. Return 20 questions with adapted text
```

**Output:**
```json
{
  "ppi_version": "POC-v1.1.1",
  "items": [
    {
      "question_id": "PPI_Q01",
      "bank_id": "PPI_Q01",
      "type": "preferences",
      "prompt": "When you want to buy something, what do you do?",
      "options": ["A Look up lots of information", "B Pick what feels right", ...],
      "tap_version": "5.0",
      "scalars": {"lc": 0.04, "childiness": 0.96, ...}
    }
  ],
  "composed_at": "2025-01-02T00:00:00Z"
}
```

---

### 2. AE_FN_GENERATE_PLAN

**Purpose:** Generate Financial DNA profile and personalized learning plan from PPI responses.

**Inputs:**
- `user_id`: Unique identifier
- `answers`: List of PPI responses `[{"id": "PPI_Q01", "value": "A"}, ...]`
- `age`: User age (for goal filtering)
- `goals`: List of financial goal IDs

**Process:**
```
1. Convert answers to lookup map
2. Calculate Financial DNA:
   - Discipline score (0.0-1.0): Planning/structure tendency
   - Impulse score (0.0-1.0): Spontaneous spending tendency
   - Confidence score (0.0-1.0): Financial confidence level
   - Tempo ("fast" | "steady" | "slow"): Learning pace
3. Determine archetype profile:
   - "Planner" (high discipline, low impulse)
   - "Spontaneous" (high impulse, low discipline)
   - "Confident Explorer" (high confidence)
   - "Cautious Learner" (low confidence)
   - "Balanced Builder" (default)
4. Generate chapter order based on profile
5. Apply goal-based prioritization
6. Return personalized LPI plan
```

**Output:**
```json
{
  "dna": {
    "profile": "Planner",
    "weights": {
      "discipline": 0.75,
      "impulse": 0.25,
      "confidence": 0.60,
      "tempo": "steady"
    }
  },
  "lpi_plan": {
    "version": "POC-v1.1.1",
    "chapters": [
      {"ch": 1, "lessons": [1,2,3,4], "quiz_mode": "choice_abcd"},
      {"ch": 2, "lessons": [1,2,3,4], "quiz_mode": "choice_abcd"},
      ...
    ],
    "tempo": "steady",
    "profile": "Planner",
    "goals_applied": 3
  }
}
```

---

## FINANCIAL DNA CALCULATION

### DNA Weights

| Weight | Description | Score Range | Calculation |
|--------|-------------|-------------|-------------|
| `discipline` | Planning & structure tendency | 0.0-1.0 | +0.15 for each "A" answer |
| `impulse` | Spontaneous spending tendency | 0.0-1.0 | +0.10 for each "C" or "D" answer |
| `confidence` | Financial confidence level | 0.0-1.0 | +0.10 for each "A" or "C" answer |
| `tempo` | Learning pace preference | fast/steady/slow | Mode of tempo votes |

### Archetype Profiles

```python
def _determine_archetype(discipline, impulse, confidence, tempo):
    if discipline > 0.6 and impulse < 0.4:
        return "Planner"
    elif impulse > 0.6 and discipline < 0.4:
        return "Spontaneous"
    elif confidence > 0.6:
        return "Confident Explorer"
    elif confidence < 0.4:
        return "Cautious Learner"
    else:
        return "Balanced Builder"
```

### Profile → Chapter Order Mapping

| Profile | Chapter Order | Rationale |
|---------|---------------|-----------|
| Planner | 1,2,4,3,8,7,9,6,5,10 | Structure first, then exploration |
| Spontaneous | 1,8,2,3,7,4,6,9,5,10 | Goals early for motivation |
| Confident Explorer | 1,2,3,5,4,6,8,7,9,10 | Investing earlier |
| Cautious Learner | 1,2,8,3,7,9,4,6,5,10 | Safety and protection emphasized |
| Balanced Builder | 1,2,3,4,8,7,9,6,5,10 | Standard progressive order |

---

## GOAL-BASED PRIORITIZATION

The AE adjusts chapter order based on user's financial goals.

### Priority Scoring

```python
def _apply_goal_prioritization(base_order, goals, age):
    chapter_scores = {ch: 0 for ch in base_order}
    
    for goal_id in goals:
        goal_def = get_goal_definition(goal_id)
        
        # Check age appropriateness
        if not (goal_def.age_min <= age <= goal_def.age_max):
            continue
        
        # Score primary chapters (+10 points)
        for ch in goal_def.primary_chapters:
            chapter_scores[ch] += 10 * goal_def.priority_boost
        
        # Score secondary chapters (+5 points)
        for ch in goal_def.secondary_chapters:
            chapter_scores[ch] += 5 * goal_def.priority_boost
    
    # Sort by score (descending), CH01 always first
    return [1] + sorted(other_chapters, key=lambda ch: -chapter_scores[ch])
```

### Example Goal Mapping

```json
{
  "goal_id": "debt_credit_get_out",
  "label": "Get out of debt",
  "primary_chapters": [4],
  "secondary_chapters": [2, 3],
  "age_appropriate": [18, 99],
  "priority_boost": 1.5
}
```

---

## AGE BAND CONSTRAINTS

### Age Bands

| Band | Age Range | Constraints |
|------|-----------|-------------|
| Child | 6-12 | Exclude "advanced" tags, simple reading level |
| Teen | 13-17 | Allow most content, youth reading level |
| Adult | 18-99 | Allow all content, standard reading level |

### Age-Based Filtering

```python
def _get_age_band(age):
    if 6 <= age <= 12:
        return "6-12"       # Child
    elif 13 <= age <= 17:
        return "13-17"      # Teen
    else:
        return "18-99"      # Adult
```

---

## COMBINED SCORE FORMULA

The AE uses a combined score to determine personalization level:

```
combined_score = 0.4 × age_score + 0.6 × exp_score
```

Where:
- `age_score = (age - 6) / 93` (normalized to 0.0-1.0)
- `exp_score = (experience_level - 1) / 4` (normalized to 0.0-1.0)

### Examples

| Age | EL | Age Score | Exp Score | Combined |
|-----|-----|-----------|-----------|----------|
| 6 | 1 | 0.00 | 0.00 | 0.00 |
| 12 | 2 | 0.06 | 0.25 | 0.17 |
| 25 | 3 | 0.20 | 0.50 | 0.38 |
| 35 | 5 | 0.31 | 1.00 | 0.72 |
| 65 | 5 | 0.63 | 1.00 | 0.85 |

---

## DATA FILES

The AE loads these JSON files:

| File | Purpose |
|------|---------|
| `ae_contracts_stable_v1_1.json` | Contract definitions |
| `ae_rules_poc_v1_1.json` | Age/experience constraints |
| `ppi_bank_baseline_v1_1.json` | 20 baseline PPI questions |
| `lpi_lessons_index.json` | LPI chapter/lesson metadata |
| `goal_chapter_mapping.json` | Goal → Chapter prioritization |

---

## TAP INTEGRATION

The AE calls TAP (Text Adaptation Processor) for text adaptation:

### TAP v5.0 Integration

```python
if is_tap_v5_0_enabled():
    tap50_engine = TAP50Engine(el_max_poc=5)
    
    # Process PPI question
    scalars = tap50_engine.compute_scalars(age, exp_level, question_text)
    
    # Get childiness score
    childiness = scalars.childiness
    
    # Adapt question text if needed
    if childiness >= 0.35:
        adapted_text = get_child_friendly_version(question_text)
```

### Child-Friendly Question Mapping

```python
def _get_child_question_text(baseline_prompt):
    mappings = {
        "financial decisions": "When you want to buy something, what do you do?",
        "approach to saving": "How do you save your money?",
        "financial future": "How do you feel about money?",
        "track my spending": "Do you keep track of your money?",
        "financial priority": "What's most important to you about money?",
        "unexpected money": "If you got surprise money, what would you do?",
        ...
    }
    
    for key, child_version in mappings.items():
        if key in baseline_prompt.lower():
            return child_version
    
    return baseline_prompt.replace("financial", "money")
```

---

## API ENDPOINTS

### Compose PPI
```
GET /api/content/ppi/personalized
Authorization: Bearer {token}

Response:
{
  "ppi_version": "POC-v1.1.1",
  "items": [...],
  "tap_version": "5.0"
}
```

### Submit PPI & Generate Plan
```
POST /api/ppi/submit
Authorization: Bearer {token}
Body: {
  "answers": [{"id": "PPI_Q01", "value": "A"}, ...],
  "goals": ["debt_credit_get_out", "saving_planning_home"]
}

Response:
{
  "success": true,
  "dna": {...},
  "lpi_plan": {...}
}
```

---

## FUTURE ENHANCEMENTS (TAP v5.0)

With TAP v5.0 integration, the AE will support:

1. **DNA from VIA Traits**: 24 Character Strengths instead of 4 weights
2. **7-Layer PPI**: 270 questions with depth-based weighting
3. **Confidence Scoring**: Primary (≥0.55) and Secondary (0.40-0.55) traits
4. **Trait Conflict Resolution**: Remove psychologically conflicting pairs
5. **DNA-Based Framing**: Trait-specific prefixes and tone adjustments

---

## SINGLETON PATTERN

```python
_ae_v2_instance = None

def get_adaptive_engine_v2() -> AdaptiveEngineV2:
    """Get or create singleton AE V2 instance"""
    global _ae_v2_instance
    if _ae_v2_instance is None:
        _ae_v2_instance = AdaptiveEngineV2()
    return _ae_v2_instance
```

---

## SUMMARY

The Adaptive Engine (AE) is the **brain** of the Wealth Builder app:

1. **Composes** personalized PPI questionnaires based on age/experience
2. **Calculates** Financial DNA from user responses
3. **Determines** archetype profiles for learning style matching
4. **Prioritizes** chapters based on user goals
5. **Integrates** with TAP for text adaptation
6. **Outputs** fully personalized learning plans

The AE ensures every user gets content that matches their:
- **Age** (developmental appropriateness)
- **Experience** (complexity calibration)
- **Goals** (relevance prioritization)
- **Personality** (learning style matching)
