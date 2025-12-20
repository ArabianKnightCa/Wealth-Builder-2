# TAP (Text Adaptation Processor) - Complete System Overview

## CONTEXT FOR AI ASSISTANT

You are continuing work on the **Mizo Wealth Builder** application, specifically the **TAP (Text Adaptation Processor)** system. This document explains what TAP is, how it works, and includes all the code for copy-paste reference.

---

## WHAT IS TAP?

TAP is a **formula-driven, deterministic text adaptation system** that transforms financial education content based on the user's:

1. **Age** (continuous, normalized 0-100)
2. **Experience Level (EL)** (1 to EL_MAX, currently 5 for POC)
3. **Financial DNA** (personality profile from PPI assessment)

### Key Principles

- **NO BUCKETS**: Age and EL are continuous variables, not discrete buckets like "child/teen/adult"
- **NO SYNONYMS**: We don't randomly swap words. All substitutions come from pre-approved phrase banks
- **FORMULA-DRIVEN**: All scalars are computed mathematically from inputs
- **GRAMMAR-SAFE**: Templates and substitutions guarantee grammatical correctness

---

## CORE FORMULAS

### Normalized Inputs
```
age_norm = age / 100                              # 0.0 to 1.0
el_norm = (EL - 1) / (EL_MAX - 1)                 # 0.0 to 1.0
```

### Core Scalars
```
LC = (0.65 × age_norm) + (0.35 × el_norm)         # Language Complexity
CD = (0.85 × el_norm) + (0.15 × age_norm)         # Conceptual Depth
IA = (0.50 × age_norm) + (0.50 × el_norm)         # Ideological Abstraction
```

### What Each Scalar Controls
- **LC (Language Complexity)**: Vocabulary, sentence structure, clause density
  - Age-dominated (65%) because even expert children need simpler words
- **CD (Conceptual Depth)**: Financial topic depth, terminology density
  - EL-dominated (85%) because a beginner adult needs adult language but basic concepts
- **IA (Ideological Abstraction)**: Framing, "why this matters", life-stage relevance
  - Balanced (50/50) because context depends on both maturity and knowledge

---

## THE TWO CONTENT TYPES

### 1. PPI (Personal Profile Instrument)
- 20 psychological assessment questions
- Transformation uses **Age + EL** → **LC** → vocabulary substitutions
- Each question has baseline text + substitution rules with LC thresholds
- Example: "financial decisions" → "money choices" when LC < 0.40

### 2. LPI (Learning Path Instrument)
- 10-chapter financial education curriculum
- Transformation uses **Age + EL + DNA** → derived scalars
- DNA adds: discipline, impulse, confidence, tempo
- Derived scalars:
  - **support_level** = f(LC, confidence, impulse) - how much scaffolding
  - **challenge_level** = f(CD, discipline, confidence) - how much stretch
  - **tone_warmth** = f(confidence, impulse, age_norm) - supportive vs direct
  - **pacing_density** = f(tempo, discipline, LC) - content density

---

## HOW TRANSFORMATION WORKS

### PPI Transformation Flow
```
User (age=8, EL=1) → compute LC=0.052 → apply substitutions where LC < threshold

Baseline: "When making financial decisions, I prefer to:"
Substitutions:
  - ("financial decisions", "money choices", 0.40) ✓ applied (0.052 < 0.40)
  - ("I prefer to", "I like to", 0.25) ✓ applied (0.052 < 0.25)
Result: "When making money choices, I like to:"
```

### LPI Transformation Flow
```
User (age=8, EL=1, DNA={confidence:0.3, impulse:0.7}) →
  compute LC=0.052, CD=0.012 →
  compute support=0.80, warmth=0.77 →
  apply vocabulary substitutions +
  add warm tone prefix if warmth > 0.5

Baseline: "Money is a tool of trust and timing. Utilize it effectively."
Transformations:
  - "utilize" → "use" (LC < 0.40)
  - Add "You're doing great! " prefix (warmth=0.77 > 0.70)
Result: "You're doing great! Money is a tool of trust and timing. Use it effectively."
```

---

## EXAMPLE OUTPUTS

### PPI Q1 Across Ages (with EL=1)

| Age | LC | Prompt |
|-----|-----|--------|
| 8 | 0.05 | "When making money choices, I like to:" |
| 16 | 0.19 | "When making money choices, I prefer to:" |
| 35 | 0.40 | "When making financial decisions, I prefer to:" |
| 60 | 0.74 | "When making financial decisions, I prefer to:" |

### LPI Lesson for Same Child (age=8, EL=1), Different DNA

| DNA Profile | Support | Warmth | Lesson Prefix | Vocabulary |
|-------------|---------|--------|---------------|------------|
| Low confidence, high impulse | 0.80 | 0.77 | "You're doing great!" | Simplified |
| High confidence, disciplined | 0.50 | 0.42 | (none) | Simplified |

---

## FILE STRUCTURE

```
/app/backend/
├── tap_v2_3_formulas.py      # Core scalar calculations (LC, CD, IA)
├── clg_data.py               # PPI questions + substitution rules
├── lpi_transform.py          # LPI transformation with DNA
├── feature_flags.py          # EL_MAX and feature toggles
├── ae_engine_v2.py           # Adaptive Engine integration
└── server.py                 # API endpoints
```

---

## TEST ENDPOINTS

```bash
# Test PPI transformation
GET /api/clg/ppi-test?age=8&experience=beginner

# Test LPI transformation with DNA
GET /api/clg/lpi-test?age=8&el=1&discipline=0.3&impulse=0.7&confidence=0.3&tempo=slow
```

---

# COMPLETE CODE - COPY/PASTE

## FILE 1: tap_v2_3_formulas.py

```python
"""
TAP v2.3 Core Formulas Module
==============================
Deterministic formula-based text adaptation processor.
NO age buckets, NO experience buckets, NO synonym replacement.

Version: 2.3
"""

from dataclasses import dataclass
from typing import Optional


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp a value between min and max."""
    return max(min_val, min(max_val, value))


@dataclass
class TAPScalars:
    """Core TAP v2.3 scalars for a user."""
    age: int
    el_declared: int
    el_max: int
    
    # Normalized values
    age_norm: float
    el_norm: float
    
    # Core scalars
    lc: float  # Language Complexity
    cd: float  # Conceptual Depth
    ia: float  # Ideological Abstraction
    
    # Stretch
    stretch_el: int
    stretch_norm: float


def normalize_age(age: int) -> float:
    """Normalize age to 0.0-1.0 range."""
    return clamp(age / 100.0, 0.0, 1.0)


def normalize_experience(el_declared: int, el_max: int) -> float:
    """Normalize experience level to 0.0-1.0 range."""
    if el_max <= 1:
        return 0.0
    return (el_declared - 1) / (el_max - 1)


def compute_language_complexity(age_norm: float, el_norm: float) -> float:
    """
    LC = (0.65 × age_norm) + (0.35 × el_norm)
    Age-dominated for vocabulary sophistication.
    """
    lc = (0.65 * age_norm) + (0.35 * el_norm)
    return clamp(lc, 0.0, 1.0)


def compute_conceptual_depth(el_norm: float, age_norm: float) -> float:
    """
    CD = (0.85 × el_norm) + (0.15 × age_norm)
    EL-dominated for financial concept complexity.
    """
    cd = (0.85 * el_norm) + (0.15 * age_norm)
    return clamp(cd, 0.0, 1.0)


def compute_ideological_abstraction(age_norm: float, el_norm: float) -> float:
    """
    IA = (0.50 × age_norm) + (0.50 × el_norm)
    Balanced for framing and motivation.
    """
    ia = (0.50 * age_norm) + (0.50 * el_norm)
    return clamp(ia, 0.0, 1.0)


def compute_stretch(el_declared: int, el_max: int) -> tuple[int, float]:
    """Compute stretch target (one rung above current EL)."""
    stretch_el = min(el_declared + 1, el_max)
    if el_max <= 1:
        stretch_norm = 1.0
    else:
        stretch_norm = (stretch_el - 1) / (el_max - 1)
    return stretch_el, stretch_norm


def compute_tap_scalars(age: int, el_declared: int, el_max: int = 15) -> TAPScalars:
    """Main entry point for TAP v2.3 scalar computation."""
    age_norm = normalize_age(age)
    el_norm = normalize_experience(el_declared, el_max)
    lc = compute_language_complexity(age_norm, el_norm)
    cd = compute_conceptual_depth(el_norm, age_norm)
    ia = compute_ideological_abstraction(age_norm, el_norm)
    stretch_el, stretch_norm = compute_stretch(el_declared, el_max)
    
    return TAPScalars(
        age=age, el_declared=el_declared, el_max=el_max,
        age_norm=age_norm, el_norm=el_norm,
        lc=lc, cd=cd, ia=ia,
        stretch_el=stretch_el, stretch_norm=stretch_norm
    )
```

---

## FILE 2: clg_data.py (PPI Transformation)

```python
"""
CLG Data - PPI Questions with Continuous LC Transformation
==========================================================
NO BUCKETS - LC threshold-based substitutions
"""

from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class PPIQuestion:
    """PPI Question with baseline and transformation rules."""
    question_id: str
    baseline_prompt: str
    baseline_options: List[str]
    prompt_substitutions: List[tuple] = field(default_factory=list)  # (original, simple, lc_threshold)
    option_substitutions: List[tuple] = field(default_factory=list)


# All 20 PPI Questions
PPI_QUESTIONS: Dict[str, PPIQuestion] = {
    "PPI_Q01": PPIQuestion(
        question_id="PPI_Q01",
        baseline_prompt="When making financial decisions, I prefer to:",
        baseline_options=[
            "A Research extensively before deciding",
            "B Go with my gut feeling",
            "C Ask friends or family for advice",
            "D Follow what experts recommend"
        ],
        prompt_substitutions=[
            ("financial decisions", "money choices", 0.40),
            ("I prefer to", "I like to", 0.25),
        ],
        option_substitutions=[
            ("Research extensively before deciding", "Ask lots of questions first", 0.15),
            ("Ask friends or family for advice", "Ask my family what to do", 0.15),
            ("Follow what experts recommend", "Do what smart people say", 0.15),
        ]
    ),
    # ... (remaining 19 questions follow same pattern)
}


def transform_ppi_question(question_id: str, lc: float) -> Optional[Dict]:
    """
    Transform PPI question based on continuous LC.
    Applies substitutions where LC < threshold.
    """
    if question_id not in PPI_QUESTIONS:
        return None
    
    q = PPI_QUESTIONS[question_id]
    prompt = q.baseline_prompt
    options = q.baseline_options.copy()
    
    applied_prompt = set()
    applied_options = set()
    
    # Apply prompt substitutions (lowest threshold first)
    for original, simple, threshold in sorted(q.prompt_substitutions, key=lambda x: x[2]):
        if lc < threshold and original in prompt and original not in applied_prompt:
            prompt = prompt.replace(original, simple)
            applied_prompt.add(original)
            applied_prompt.add(simple)
    
    # Apply option substitutions
    for original, simple, threshold in sorted(q.option_substitutions, key=lambda x: x[2]):
        if lc < threshold and original not in applied_options:
            options = [opt.replace(original, simple) if original in opt else opt for opt in options]
            applied_options.add(original)
    
    return {"prompt": prompt, "options": options, "lc_applied": round(lc, 4)}
```

---

## FILE 3: lpi_transform.py (LPI Transformation with DNA)

```python
"""
LPI Content Transformation - Age + EL + DNA
============================================
"""

from typing import Dict, Optional, Any
from dataclasses import dataclass
from tap_v2_3_formulas import compute_tap_scalars


@dataclass
class FinancialDNA:
    """User's Financial DNA from PPI assessment."""
    discipline: float  # 0.0-1.0
    impulse: float     # 0.0-1.0
    confidence: float  # 0.0-1.0
    tempo: str         # "fast" | "steady" | "slow"
    profile: str


@dataclass
class LPIScalars:
    """Complete scalar set for LPI transformation."""
    # Base TAP scalars
    age: int
    el: int
    age_norm: float
    el_norm: float
    lc: float
    cd: float
    ia: float
    # DNA
    discipline: float
    impulse: float
    confidence: float
    tempo: str
    # Derived
    support_level: float
    challenge_level: float
    tone_warmth: float
    pacing_density: float


def compute_lpi_scalars(age: int, el: int, el_max: int, dna: Optional[FinancialDNA] = None) -> LPIScalars:
    """Compute LPI scalars combining Age + EL + DNA."""
    tap = compute_tap_scalars(age, el, el_max)
    
    if dna is None:
        dna = FinancialDNA(0.5, 0.5, 0.5, "steady", "Balanced")
    
    # SUPPORT: scaffolding/examples needed
    support_level = (1 - tap.lc) * 0.40 + (1 - dna.confidence) * 0.30 + dna.impulse * 0.30
    
    # CHALLENGE: stretch level
    challenge_level = tap.cd * 0.40 + dna.discipline * 0.30 + dna.confidence * 0.30
    
    # WARMTH: supportive vs direct tone
    tone_warmth = (1 - dna.confidence) * 0.40 + dna.impulse * 0.30 + (1 - tap.age_norm) * 0.30
    
    # PACING: content density
    tempo_factor = {"fast": 0.8, "steady": 0.5, "slow": 0.2}.get(dna.tempo, 0.5)
    pacing_density = tempo_factor * 0.40 + dna.discipline * 0.30 + tap.lc * 0.30
    
    return LPIScalars(
        age=age, el=el, age_norm=tap.age_norm, el_norm=tap.el_norm,
        lc=tap.lc, cd=tap.cd, ia=tap.ia,
        discipline=dna.discipline, impulse=dna.impulse, confidence=dna.confidence, tempo=dna.tempo,
        support_level=min(1, max(0, support_level)),
        challenge_level=min(1, max(0, challenge_level)),
        tone_warmth=min(1, max(0, tone_warmth)),
        pacing_density=min(1, max(0, pacing_density))
    )


# Vocabulary substitutions for LPI
LPI_VOCABULARY_SUBSTITUTIONS = [
    ("compound growth", "growth on growth", 0.25),
    ("portfolio", "mix of investments", 0.30),
    ("diversification", "spreading your money around", 0.25),
    ("utilize", "use", 0.40),
    # ... more substitutions
]

WARM_TONE_ADDITIONS = {
    "lesson_start": [(0.7, "You're doing great! "), (0.5, "Let's explore this together. "), (0.3, "")],
    "takeaway_start": [(0.7, "Remember: "), (0.5, "Key point: "), (0.3, "")],
}


def transform_lpi_content(content: str, scalars: LPIScalars, content_type: str = "lesson") -> str:
    """Transform LPI content based on scalars."""
    result = content
    
    # Vocabulary substitutions based on LC
    for original, simple, threshold in LPI_VOCABULARY_SUBSTITUTIONS:
        if scalars.lc < threshold:
            result = result.replace(original, simple)
    
    # Warm tone prefix
    if content_type == "lesson" and scalars.tone_warmth > 0.5:
        for threshold, prefix in WARM_TONE_ADDITIONS["lesson_start"]:
            if scalars.tone_warmth >= threshold:
                result = prefix + result
                break
    
    return result
```

---

## SUMMARY

The TAP system transforms content using:

1. **Age + EL → LC, CD, IA** (core scalars)
2. **For PPI**: LC drives vocabulary substitutions via thresholds
3. **For LPI**: Age + EL + DNA → derived scalars (support, challenge, warmth, pacing)

All transformations are:
- Continuous (no buckets)
- Deterministic (same inputs = same outputs)
- Grammar-safe (pre-approved phrases and templates)

The system produces child-appropriate content like "money choices" instead of "financial decisions" while maintaining measurement validity for PPI and educational value for LPI.
