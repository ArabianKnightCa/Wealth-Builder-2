# TAP 3.1 Weaknesses & Improvement Checklist
## Quick Reference for ChatGPT

---

## 🔴 CRITICAL WEAKNESSES

### 1. APPEND-ONLY SCAFFOLDING (Severity: CRITICAL)
**Problem:** All definitions/examples are appended AFTER the complex baseline text.
**Impact:** 6yo can't parse "digital entries in a secure ledger" to get to the helpful definition at the end.
**Proposed Fix:** Implement INLINE scaffolding mode where definitions appear at point of use.

### 2. NO SENTENCE-LEVEL PROCESSING (Severity: HIGH)
**Problem:** Entire baseline treated as single block.
**Impact:** Can't add scaffolding BETWEEN sentences.
**Proposed Fix:** Split into sentences, interleave scaffolding.

### 3. NO PREAMBLE/BRIDGE CONTENT (Severity: HIGH)
**Problem:** Complex baseline shown immediately with no simple introduction.
**Impact:** Low-LC users overwhelmed before they even start.
**Proposed Fix:** Generate LC-calibrated preamble before baseline.

### 4. CLS LOGIC IS BACKWARDS (Severity: MEDIUM)
**Problem:** Young users get CLS=3 (limiting scaffolding).
**Impact:** The users who need MOST help get LEAST scaffolding.
**Proposed Fix:** Invert formula: low-LC users should have HIGHER CLS.

### 5. NO BASELINE COMPLEXITY ASSESSMENT (Severity: MEDIUM)
**Problem:** TAP doesn't know HOW complex the baseline is.
**Impact:** Same scaffolding applied whether baseline is simple or complex.
**Proposed Fix:** Score baseline complexity, adjust scaffolding intensity.

---

## 🟡 SECONDARY WEAKNESSES

### 6. PPI OPTIONS NOT ADAPTED
**Problem:** Question options use adult vocabulary.
**Example:** "Research extensively before deciding" vs simpler "Look up lots of information first".

### 7. No Concept Dependency Tracking
**Problem:** System doesn't know "barter" requires understanding "trade" first.

### 8. Weak Framing Templates
**Problem:** "Let's learn something helpful:" doesn't prepare user for complexity.

### 9. Glossary Coverage Gaps
**Problem:** Complex phrases like "digital entries in a secure ledger" not in glossary.

### 10. Control Scalars Underutilized
**Problem:** 8 control values only adjust thresholds, could do more.

---

## 📐 CURRENT FORMULAS

```python
# Normalization
age_norm = age / 100
el_norm = (EL - 1) / (EL_MAX - 1)

# Core scalars (all 0.0-1.0)
LC = 0.65 * age_norm + 0.35 * el_norm  # Language Complexity
CD = 0.85 * el_norm + 0.15 * age_norm  # Conceptual Depth
IA = 0.50 * age_norm + 0.50 * el_norm  # Ideological Abstraction

# CLS (Cognitive Load Span) - integer 1-5
if age < 10: cls = 3
elif age < 15: cls = 3
elif age < 25: cls = 3
else: cls = min(5, age // 10)
```

### Sample Values

| Profile | Age | EL | LC | CD | IA | CLS |
|---------|-----|----|----|----|----|-----|
| 6yo Beginner | 6 | 1 | 0.04 | 0.01 | 0.03 | 3 |
| 12yo Intermediate | 12 | 3 | 0.25 | 0.44 | 0.31 | 3 |
| 35yo Beginner | 35 | 1 | 0.23 | 0.05 | 0.18 | 3 |
| 35yo Expert | 35 | 5 | 0.58 | 0.90 | 0.68 | 3 |

---

## 🎯 PROPOSED NEW FEATURES

### Feature A: Inline Scaffolding Mode
```python
def use_inline_mode(lc: float) -> bool:
    return lc < 0.20  # For ages ~6-14, EL 1-2

# Transform "Money is a shared agreement"
# Into: "Money (coins and bills) is a shared agreement (when everyone decides together)"
```

### Feature B: Preamble Generator
```python
def generate_preamble(topic: str, lc: float) -> str:
    if lc >= 0.25:
        return ""
    if lc < 0.10:  # Very young
        return "🎈 Let's learn about [topic]!\n[simple_explanation]"
    elif lc < 0.20:
        return "📚 Here's something important about [topic]:\n[bridge_text]"
```

### Feature C: Sentence-Level Processing
```python
for sentence in baseline.split('.'):
    output.append(sentence)
    concepts = extract_concepts(sentence)
    if concepts and lc < 0.30:
        output.append(scaffolding_for(concepts))
```

### Feature D: Adaptive CLS
```python
def compute_cls(age: int, lc: float, baseline_complexity: float) -> int:
    # Young + low LC + complex content = MORE scaffolding allowed
    base = 5 if age < 12 else 4 if age < 18 else 3
    bonus = int((1 - lc) * baseline_complexity * 3)
    return min(8, base + bonus)
```

### Feature E: Baseline Complexity Scoring
```python
def score_complexity(text: str) -> float:
    factors = [
        word_count / 100,
        avg_word_length / 10,
        technical_term_count / 10,
        abstract_concept_count / 5
    ]
    return min(1.0, sum(factors) / 4)
```

---

## 🚫 HARD CONSTRAINTS (CANNOT VIOLATE)

1. **NO BUCKETS** - Must use continuous formulas
2. **NO SEPARATE CONTENT** - Can't create age/EL-specific versions
3. **BASELINE IMMUTABLE** - Cannot rewrite/paraphrase
4. **DETERMINISTIC** - Same input = same output
5. **NO PARAPHRASING** - No synonym replacement

---

## ❓ KEY QUESTIONS FOR CHATGPT

1. Can we satisfy the constraints AND make content readable for 6yo?
2. Is inline scaffolding the best approach, or is there something better?
3. Does adding a preamble violate "baseline immutability"?
4. Should CLS be inverted (more scaffolding for younger users)?
5. How do we handle multi-clause complex sentences?
6. Should we process at word, phrase, sentence, or paragraph level?
7. Are the LC/CD/IA formulas weighted correctly?
8. How should control scalars influence scaffolding beyond threshold adjustment?

---

## 📁 FILE REFERENCES

| File | Purpose |
|------|---------|
| `tap_3_0.py` | Core engine - needs redesign |
| `tap_control_scalars.py` | 8 controls from PPI |
| `ppi_trait_vector.py` | 24-trait computation |
| `server.py` | API integration |
| `TAP_ANALYSIS_FOR_CHATGPT.md` | Full analysis doc |

---

*Use this as a checklist when reviewing ChatGPT's suggestions*
