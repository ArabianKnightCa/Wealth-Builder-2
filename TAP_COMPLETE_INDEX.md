# TAP (Text Adaptation Processor) - Complete Package Index

## What is TAP?
TAP v2.3.1 is a formula-driven text adaptation system that transforms financial education content based on user age and financial experience level, WITHOUT using age buckets or synonym replacement.

---

## Quick Access Files

### 1. Main Summary Document
**File:** `/app/TAP_COMPLETE_COPY_PASTE.md`
**Contains:**
- Configuration (.env settings)
- feature_flags.py (complete)
- tap_v2_3_formulas.py (complete)
- tap_v2_3_engine.py (complete)
- Summary of other files
- Usage examples
- Key formulas

### 2. Complete Pipeline Code
**File:** `/app/TAP_V2_3_1_LANGUAGE_PIPELINE.py`
**Contains:**
- Full tap_v2_3_1_language.py (590+ lines)
- SafeRewritePipeline class
- 8-step grammar-safe rewrite process
- All transformation logic

### 3. Individual Source Files (Backend)
All files located in `/app/backend/`:
- `feature_flags.py` - Configuration flags
- `tap_v2_3_formulas.py` - Core formulas (LC, CD, IA, stretch)
- `tap_v2_3_engine.py` - Main TAP engine
- `tap_v2_3_templates.py` - Block-based templates
- `tap_v2_3_1_language.py` - Grammar-safe pipeline (NEW)
- `tap_v2_3_language.py` - Legacy language shaper
- `tap_v2_3_ae_integration.py` - Adaptive Engine integration

### 4. Documentation
- `/app/TAP_V2.3_CLEAN_ROOM_RULESET.md` - Original specification
- `/app/TAP_V2_3_IMPLEMENTATION_SUMMARY.md` - Implementation notes
- `/app/TAP_V2_3_FOR_CHATGPT_EVALUATION.md` - Evaluation document

---

## File Breakdown

### Core Formula System (191 lines)
**tap_v2_3_formulas.py**
```python
# Main functions:
compute_tap_scalars(age, el, el_max) → TAPScalars
normalize_age(age) → float
normalize_experience(el, el_max) → float
compute_language_complexity(age_norm, el_norm) → float
compute_conceptual_depth(el_norm, age_norm) → float
compute_ideological_abstraction(age_norm, el_norm) → float
compute_stretch(el, el_max) → tuple[int, float]
```

### Main Engine (151 lines)
**tap_v2_3_engine.py**
```python
# Main class:
class TAPv23Engine:
    transform_content(baseline, age, el, el_max, ae_state)
    transform_with_template(template, age, el, el_max)
    get_user_scalars(age, el, el_max)
```

### Grammar-Safe Pipeline (590+ lines)
**tap_v2_3_1_language.py**
```python
# 8-Step Pipeline:
class SafeRewritePipeline:
    1. _protect_invariants()      # Numbers, entities, critical phrases
    2. _normalize_sentences()     # Structure-first simplification
    3. _add_clarifications()      # CD-based definitions
    4. _add_framing()            # IA-based "why it matters"
    5. _reflow_grammar()         # Punctuation, capitalization
    6. _restore_tokens()         # Put back protected content
    7. _validate()               # Check quality
    8. _minimal_rewrite_fallback() # Safe fallback if validation fails
```

### Templates (176 lines)
**tap_v2_3_templates.py**
```python
# Progressive reveal system:
class ContentBlock:
    type: "concept" | "ideology" | "stretch"
    threshold: float (0.0 to 1.0)
    text: str

class ContentTemplate:
    get_included_blocks(scalars)
    render(scalars)
```

### AE Integration (166 lines)
**tap_v2_3_ae_integration.py**
```python
# Adaptive Engine state:
@dataclass
class AEStatePacket:
    friction: float
    momentum: float
    exposure: int
    confidence_band: float

class AEModifier:
    should_add_extra_examples()
    should_add_clarifiers()
    apply_modifications()
```

### Feature Flags (65 lines)
**feature_flags.py**
```python
# Configuration:
USE_TAP_V2_3 = true
EL_MAX = 5 (POC), 10 (Beta), 15 (Commercial)
USE_SAFE_REWRITE_PIPELINE = true
USE_LLM_REWRITE_LAYER = false
```

---

## Key Concepts

### Core Scalars
```
LC (Language Complexity)    = (0.65 × age_norm) + (0.35 × el_norm)
CD (Conceptual Depth)       = (0.85 × el_norm) + (0.15 × age_norm)
IA (Ideological Abstraction) = (0.50 × age_norm) + (0.50 × el_norm)
```

### Normalization
```
age_norm = age / 100.0
el_norm = (EL - 1) / (EL_MAX - 1)
```

### Stretch (Growth)
```
stretch_EL = min(EL + 1, EL_MAX)
stretch_norm = (stretch_EL - 1) / (EL_MAX - 1)
```

---

## Test Results (EL_MAX=5, POC)

| Age | EL | LC    | CD    | IA    | Use Case |
|-----|----| ------|-------|-------|----------|
| 6   | 1  | 0.039 | 0.009 | 0.030 | Child beginner |
| 18  | 2  | 0.204 | 0.239 | 0.215 | Teen beginner-intermediate |
| 35  | 3  | 0.402 | 0.477 | 0.425 | Adult intermediate |
| 55  | 4  | 0.620 | 0.720 | 0.650 | Mature advanced |
| 75  | 5  | 0.838 | 0.962 | 0.875 | Senior guru/expert |

---

## Current Status

### ✅ Working:
- Core formula system (LC, CD, IA, stretch)
- Feature flag system
- TAP v2.3 engine integration
- Adult/senior transformations (age 35+)
- PPI questions (NO transformation - kept as baseline)

### ⚠️ Known Issues:
- Child transformations (age 6, EL 1) can produce grammar errors
- Teen level (age 18, EL 2, LC=0.20) not always transforming
- Complex LPI content needs more work

### 🔄 In Development:
- LLM repair layer (USE_LLM_REWRITE_LAYER=false currently)
- Enhanced child/teen vocabulary mappings
- More sophisticated sentence restructuring

---

## Integration Points

### Where TAP is Used:
1. **LPI Chapters** - `/api/content/lpi/chapters`
2. **LPI Content** - `/api/content/chapters/{id}`
3. **Quiz Questions** - `/api/content/chapters/{id}/quiz`
4. **PPI Questions** - NOT USED (baseline preserved)

### How to Use:
```python
from tap_v2_3_engine import get_tap_v23_engine

engine = get_tap_v23_engine()

result = engine.transform_content(
    baseline_text="Your content here",
    user_age=35,
    user_experience_level=3,
    el_max=5
)
```

---

## For External Review/Enhancement

### Recommended Review Order:
1. Read `/app/TAP_COMPLETE_COPY_PASTE.md` first (overview + core files)
2. Review formulas in detail (understand LC, CD, IA)
3. Study pipeline in `/app/TAP_V2_3_1_LANGUAGE_PIPELINE.py`
4. Check test results and known issues
5. Review `/app/TAP_V2_3_FOR_CHATGPT_EVALUATION.md` for specific questions

### Key Questions for Enhancement:
1. Are the formula weightings optimal? (LC: 65/35, CD: 85/15, IA: 50/50)
2. How to improve child/teen transformations?
3. Better sentence restructuring approaches?
4. Enhanced financial vocabulary scaling?
5. More sophisticated grammar validation?

---

## Total Lines of Code
- Core formulas: ~191 lines
- Engine: ~151 lines
- Pipeline: ~590 lines
- Templates: ~176 lines
- AE Integration: ~166 lines
- Feature flags: ~65 lines
- **Total: ~1,339 lines**

---

END OF INDEX
