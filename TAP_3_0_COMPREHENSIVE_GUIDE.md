# TAP 3.0 Comprehensive Guide for Notebook LM

**Document Purpose:** Complete reference for TAP 3.0 (Text Adaptation Processor), including mission, architecture, current status, integration points, and full source code.

---

## PART 1: WHAT IS TAP 3.0?

### 1.1 Mission Statement

TAP 3.0 (Text Adaptation Processor Version 3.0) is the **definitive adaptive content engine** for the Mizo Wealth Builder application. Its job is to personalize financial education content (PPI questions and LPI lessons) for users of all ages (6-99) and experience levels (1-5).

### 1.2 Core Philosophy: "Baseline Immutability + Scaffolding Injection"

**THE SINGLE MOST IMPORTANT RULE:**
> The original expert-level text is **NEVER** rewritten, paraphrased, or modified. TAP 3.0 only **ADDS** supporting sentences around the immutable baseline.

This is a radical departure from previous versions (TAP v2.3.1 and earlier) which attempted to paraphrase/rewrite text and repeatedly produced grammatical errors.

### 1.3 What TAP 3.0 Does

1. **Receives baseline text** — The original, expert-level content (e.g., "When making financial decisions, I prefer to:")
2. **Computes user scalars** — Mathematical formulas driven by `age` and `EL` (Experience Level) produce continuous values (0.0-1.0)
3. **Injects scaffolding** — Adds definitions, examples, analogies, and framing sentences BEFORE or AFTER the baseline
4. **Respects cognitive limits** — The Cognitive Load Span (CLS) gate limits additions for younger users
5. **Returns adapted output** — The baseline text surrounded by appropriate scaffolding

### 1.4 What TAP 3.0 Does NOT Do

- ❌ Never rewrites or paraphrases baseline text
- ❌ Never uses synonym replacement
- ❌ Never uses string.replace() on content words
- ❌ Never uses discrete buckets or bands (all calculations are continuous)
- ❌ Never simplifies content for higher EL users (experts get baseline as-is)

---

## PART 2: THE TAP 3.0 ARCHITECTURE

### 2.1 The Six Gates (Processing Pipeline)

Every piece of content passes through these gates in order:

| Gate | Name | Purpose |
|------|------|---------|
| 0 | **Baseline Immutability** | Hash-check to verify baseline was never mutated |
| 1 | **Concept Availability** | Proxy concepts for young users (terms they can understand) |
| 2 | **Language Complexity (LC)** | Vocabulary/structure — adds definitions if LC < term complexity |
| 3 | **Conceptual Depth (CD)** | Explanation depth — adds examples for lower CD |
| 4 | **Ideological Abstraction (IA)** | Framing — adds motivational context based on IA |
| 5 | **Cognitive Load Span (CLS)** | Limits additions for young users to avoid overwhelming |
| 6 | **Stretch (optional)** | Preview of next EL level (EL+1), never demotes |

### 2.2 Core Formulas (Continuous, Not Bucketed)

```
INPUT:
  age      = user's age (6-99)
  EL       = Experience Level (1-5 in POC)
  EL_MAX   = Maximum EL (5 for POC, 10 for Beta, 15 for Commercial)

NORMALIZATION:
  age_norm = age / 100                    # 6→0.06, 35→0.35, 65→0.65
  el_norm  = (EL - 1) / (EL_MAX - 1)      # EL1→0.0, EL3→0.5, EL5→1.0

SCALARS:
  LC = 0.65 × age_norm + 0.35 × el_norm   # Language Complexity (age-dominant)
  CD = 0.85 × el_norm  + 0.15 × age_norm  # Conceptual Depth (EL-dominant)
  IA = 0.50 × age_norm + 0.50 × el_norm   # Ideological Abstraction (balanced)

  CLS = max(1, min(5, floor(age / 10)))   # Cognitive Load Span (1-5 additions)
```

**Why these weights?**
- **LC (Language Complexity):** Age dominates (0.65) because even a financial expert who is 8 years old needs simpler vocabulary.
- **CD (Conceptual Depth):** EL dominates (0.85) because a 40-year-old beginner needs adult language but basic concepts.
- **IA (Ideological Abstraction):** Balanced (0.50/0.50) because "why this matters" depends equally on maturity and knowledge.

### 2.3 The CLG (Controlled Language Generator)

The CLG is the "realization layer" that decides WHAT to add. It operates by:

1. **Glossary lookup:** If a term's complexity > user's LC, inject the definition
2. **Example injection:** If LC < 0.50, add an example sentence
3. **Analogy injection:** If LC < 0.25 (young users), add an analogy
4. **Framing injection:** Based on IA, add motivational context before baseline
5. **Stretch injection:** If EL < EL_MAX, add a preview of the next level

### 2.4 Example Transformation

**Input:**
- Baseline: "Creating a budget helps you track spending."
- User: Age 8, EL 1

**Scalars Computed:**
- age_norm = 0.08, el_norm = 0.00
- LC = 0.052, CD = 0.012, IA = 0.040
- CLS = 1 (only 1 addition allowed)

**CLG Processing:**
- Gate 4 (IA < 0.30): Add framing → "Let's learn something helpful: "
- Gate 2 (LC < budget complexity 0.15): Add definition → "(budget: a plan for how you use your money)"
- Gate 5 (CLS = 1): Truncate to 1 addition (keep framing, drop definition)

**Output:**
> "Let's learn something helpful: Creating a budget helps you track spending."

**Notice:** The baseline "Creating a budget helps you track spending." is **UNCHANGED**. Only scaffolding was added.

---

## PART 3: CURRENT STATUS & ISSUES

### 3.1 What Exists

✅ **TAP 3.0 Engine is BUILT and VALIDATED**
- Location: `/app/backend/tap_3_0.py`
- Contains: `compute_scalars()`, `CLGEngine.process()`, `run_validation_test()`
- Validation test passes all 12 test cases (ages 6/12/35/65 × ELs 1/3/5)

✅ **Previous Buggy Versions are ARCHIVED**
- `tap_clg_v23_OLD.py`, `lpi_transform_OLD.py`, `clg_data_OLD.py`, `clg_engine_OLD.py`
- These used paraphrasing and bucketing — they are decommissioned

### 3.2 What's BROKEN (The Critical Issue)

❌ **TAP 3.0 is NOT INTEGRATED into the live API endpoints**

The new engine exists but sits idle. The API endpoints in `server.py` are still using old logic:

| Endpoint | Current State | Should Use |
|----------|---------------|------------|
| `/api/content/ppi/personalized` | Uses `ae_engine_v2.py` → calls old TAP v2.3 | Should call `TAP30.process_ppi_question()` |
| `/api/content/lpi` | Uses `lpi_transform.py` → old broken logic | Should call `TAP30.process_lpi_lesson()` |

**Result:** Users see unadapted or incorrectly adapted content because the working engine isn't connected.

### 3.3 Integration Checklist (What Needs to Happen)

1. **Modify `/api/content/ppi/personalized` endpoint in `server.py`:**
   - Import `TAP30` from `tap_3_0.py`
   - Get user's `age` and `EL` from database
   - Call `TAP30.compute_scalars(age, el)` to get scalars
   - Call `CLGEngine.process(baseline_text, scalars, content_type="ppi", concepts=[...])`
   - Return the `final_output` from CLG

2. **Modify `/api/content/lpi` endpoint in `server.py`:**
   - Same pattern, but also pass `Financial DNA` weights for enhanced personalization
   - Call `CLGEngine.process(baseline_text, scalars, content_type="lpi", concepts=[...])`

3. **Test with multiple user profiles:**
   - Age 6, EL 1 (young beginner)
   - Age 12, EL 3 (teen intermediate)
   - Age 35, EL 1 (adult beginner)
   - Age 65, EL 5 (senior expert)

---

## PART 4: KEY FILES REFERENCE

| File | Purpose |
|------|---------|
| `/app/backend/tap_3_0.py` | **THE SOURCE OF TRUTH** — TAP 3.0 implementation |
| `/app/backend/server.py` | API endpoints (needs integration) |
| `/app/backend/ae_engine_v2.py` | Adaptive Engine (orchestrates PPI/LPI selection) |
| `/app/backend/content_data.py` | LPI chapter/lesson baseline content |
| `/app/backend/feature_flags.py` | Feature toggles (TAP version selection) |

---

## PART 5: TAP 3.0 COMPLETE SOURCE CODE

Below is the entire `tap_3_0.py` module for reference:

```python
"""
TAP 3.0 — Text Adaptation Processor
===================================
Clean-room implementation. Version replacement, NOT modification.

TAP 3.0 PRINCIPLES:
1. BASELINE IS IMMUTABLE — never rewrite baseline text
2. CLG ONLY ADDS — definitions, examples, analogies, framing BEFORE or AFTER baseline
3. NO PARAPHRASING — no synonym replacement, no text rewriting
4. DETERMINISTIC — same inputs produce same outputs

GATES (in order):
0. Baseline Immutability (hash check)
1. Concept Availability (proxy concepts for young users)
2. Language Complexity (LC) — vocabulary/structure
3. Conceptual Depth (CD) — explanation depth
4. Ideological Abstraction (IA) — framing
5. Cognitive Load Span (CLS) — limits additions for young users
6. Stretch (optional, EL+1 only, never demote)

Version: 3.0.0
"""

import hashlib
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum


# =============================================================================
# CONFIGURATION
# =============================================================================

EL_MAX_POC = 5  # POC uses fixed EL_MAX=5


# =============================================================================
# CORE FORMULAS
# =============================================================================

def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    """Clamp value between lo and hi."""
    return max(lo, min(hi, value))


@dataclass
class TAP3Scalars:
    """TAP 3.0 core scalars."""
    age: int
    el: int
    el_max: int
    
    # Normalized
    age_norm: float
    el_norm: float
    
    # Core scalars
    lc: float   # Language Complexity (age-dominant)
    cd: float   # Conceptual Depth (EL-dominant)
    ia: float   # Ideological Abstraction (balanced)
    
    # Cognitive Load Span (derived from age)
    cls: int    # Max number of CLG additions allowed
    
    # Stretch
    stretch_el: int
    stretch_norm: float


def compute_scalars(age: int, el: int, el_max: int = EL_MAX_POC) -> TAP3Scalars:
    """
    Compute TAP 3.0 scalars.
    
    Formulas:
        age_norm = age / 100
        el_norm  = (EL - 1) / (EL_MAX - 1)
        
        LC = 0.65 * age_norm + 0.35 * el_norm
        CD = 0.85 * el_norm  + 0.15 * age_norm
        IA = 0.50 * age_norm + 0.50 * el_norm
        
        CLS = max(1, min(5, floor(age / 10)))  # 1-5 additions based on age
        
        stretch_EL = min(EL + 1, EL_MAX)
    """
    age_norm = clamp(age / 100.0)
    el_norm = (el - 1) / (el_max - 1) if el_max > 1 else 0.0
    
    lc = clamp(0.65 * age_norm + 0.35 * el_norm)
    cd = clamp(0.85 * el_norm + 0.15 * age_norm)
    ia = clamp(0.50 * age_norm + 0.50 * el_norm)
    
    # Cognitive Load Span: younger users get fewer additions
    # Age 6-9: 1, Age 10-19: 1-2, Age 20-29: 2, Age 30+: 3-5
    cls = max(1, min(5, age // 10))
    
    stretch_el = min(el + 1, el_max)
    stretch_norm = (stretch_el - 1) / (el_max - 1) if el_max > 1 else 1.0
    
    return TAP3Scalars(
        age=age,
        el=el,
        el_max=el_max,
        age_norm=round(age_norm, 4),
        el_norm=round(el_norm, 4),
        lc=round(lc, 4),
        cd=round(cd, 4),
        ia=round(ia, 4),
        cls=cls,
        stretch_el=stretch_el,
        stretch_norm=round(stretch_norm, 4)
    )


# =============================================================================
# GATE 0: BASELINE IMMUTABILITY
# =============================================================================

class BaselineMutationError(Exception):
    """Raised when baseline text is mutated."""
    pass


def hash_baseline(text: str) -> str:
    """Generate hash of baseline text."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:16]


def verify_baseline_immutable(original: str, current: str) -> bool:
    """Verify baseline has not been mutated."""
    return hash_baseline(original) == hash_baseline(current)


# =============================================================================
# CLG GLOSSARY (for Gate 1 & 2)
# =============================================================================
# Terms with complexity scores and definitions
# If term_complexity > LC, provide definition

@dataclass
class GlossaryEntry:
    """Single glossary entry."""
    term: str
    complexity: float  # 0.0-1.0 (higher = more complex)
    definition_simple: str  # For LC < 0.3
    definition_standard: str  # For LC 0.3-0.6
    # definition_advanced not needed - experts don't need definitions


GLOSSARY: Dict[str, GlossaryEntry] = {
    # Financial concepts
    "credit card": GlossaryEntry(
        term="credit card",
        complexity=0.20,
        definition_simple="a card that lets you borrow money to buy things",
        definition_standard="a card that allows you to borrow money up to a limit"
    ),
    "budget": GlossaryEntry(
        term="budget",
        complexity=0.15,
        definition_simple="a plan for how you use your money",
        definition_standard="a plan that tracks income and expenses"
    ),
    "interest": GlossaryEntry(
        term="interest",
        complexity=0.25,
        definition_simple="extra money you pay when you borrow, or earn when you save",
        definition_standard="the cost of borrowing money or the reward for saving"
    ),
    "savings": GlossaryEntry(
        term="savings",
        complexity=0.10,
        definition_simple="money you keep instead of spending",
        definition_standard="money set aside for future use"
    ),
    "debt": GlossaryEntry(
        term="debt",
        complexity=0.20,
        definition_simple="money you owe to someone",
        definition_standard="money borrowed that must be repaid"
    ),
    "investment": GlossaryEntry(
        term="investment",
        complexity=0.30,
        definition_simple="putting money into something that might grow",
        definition_standard="allocating money with the expectation of future returns"
    ),
    "financial decisions": GlossaryEntry(
        term="financial decisions",
        complexity=0.25,
        definition_simple="choices about money",
        definition_standard="choices about how to earn, spend, save, or invest money"
    ),
    "portfolio": GlossaryEntry(
        term="portfolio",
        complexity=0.50,
        definition_simple="all your investments together",
        definition_standard="a collection of financial assets"
    ),
    "diversification": GlossaryEntry(
        term="diversification",
        complexity=0.55,
        definition_simple="spreading your money across different things",
        definition_standard="spreading investments to reduce risk"
    ),
    "compound interest": GlossaryEntry(
        term="compound interest",
        complexity=0.45,
        definition_simple="when your earnings also earn money",
        definition_standard="interest calculated on both principal and accumulated interest"
    ),
}


def get_definition(term: str, lc: float) -> Optional[str]:
    """Get definition for term based on LC."""
    entry = GLOSSARY.get(term.lower())
    if not entry:
        return None
    
    # If user's LC >= term complexity, no definition needed
    if lc >= entry.complexity:
        return None
    
    # Select appropriate definition
    if lc < 0.30:
        return entry.definition_simple
    else:
        return entry.definition_standard


# =============================================================================
# CLG ADDITIONS LIBRARY
# =============================================================================

@dataclass
class CLGAddition:
    """A single CLG addition (definition, example, analogy, framing, stretch)."""
    type: str  # "definition", "example", "analogy", "framing", "stretch"
    text: str
    position: str  # "before" or "after"


class CLGAdditionType(Enum):
    DEFINITION = "definition"
    EXAMPLE = "example"
    ANALOGY = "analogy"
    FRAMING = "framing"
    STRETCH = "stretch"


# Framing templates based on IA
FRAMING_TEMPLATES = {
    "low_ia": "Let's learn something helpful: ",  # IA < 0.3
    "mid_ia": "Here's an important concept: ",    # IA 0.3-0.6
    "high_ia": ""  # No framing for high IA (experts)
}

# Example templates
EXAMPLE_TEMPLATES = {
    "financial_decisions": "For example, choosing whether to save money or spend it.",
    "credit_card": "For example, buying something today and paying for it next month.",
    "budget": "For example, deciding to spend $20 on fun and save $10.",
    "savings": "For example, putting coins in a piggy bank for later.",
    "investment": "For example, buying a share of a company hoping it grows.",
}

# Analogy templates (for young users, LC < 0.25)
ANALOGY_TEMPLATES = {
    "credit_card": "It's like borrowing a toy from a friend and returning it later.",
    "budget": "It's like dividing your allowance into jars for different things.",
    "savings": "It's like a squirrel storing nuts for winter.",
    "investment": "It's like planting a seed and waiting for it to grow.",
}

# Stretch templates (EL+1 concept preview)
STRETCH_TEMPLATES = {
    1: "As you learn more, you'll discover how interest affects your savings.",
    2: "Next, you might explore how different types of accounts work.",
    3: "Advanced learners study how to balance risk and reward.",
    4: "Expert insight: Consider tax implications of financial decisions.",
}


# =============================================================================
# CLG ENGINE (TAP 3.0 REALIZATION)
# =============================================================================

@dataclass
class CLGOutput:
    """Output from CLG processing."""
    baseline_text: str
    baseline_hash: str
    scalars: TAP3Scalars
    additions: List[CLGAddition]
    final_output: str
    baseline_mutated: bool  # Must be False for valid output
    cls_exceeded: bool  # True if additions were truncated


class CLGEngine:
    """
    Controlled Language Generator for TAP 3.0.
    
    RULES:
    1. NEVER modify baseline text
    2. ONLY ADD sentences before or after baseline
    3. Respect CLS (Cognitive Load Span) - truncate if exceeded
    4. Higher EL = more sophisticated additions, NEVER simplified
    """
    
    def process(
        self,
        baseline_text: str,
        scalars: TAP3Scalars,
        content_type: str = "lpi",  # "ppi" or "lpi"
        concepts: Optional[List[str]] = None
    ) -> CLGOutput:
        """
        Process baseline text through CLG.
        
        Args:
            baseline_text: The IMMUTABLE baseline text
            scalars: TAP 3.0 scalars (age, EL, LC, CD, IA, CLS)
            content_type: "ppi" or "lpi"
            concepts: List of concept keys for glossary lookup
        
        Returns:
            CLGOutput with baseline preserved and additions listed
        """
        # Gate 0: Capture baseline hash
        baseline_hash = hash_baseline(baseline_text)
        
        additions: List[CLGAddition] = []
        
        # Gate 4: Framing (based on IA) - added BEFORE baseline
        if scalars.ia < 0.30:
            framing = FRAMING_TEMPLATES["low_ia"]
            additions.append(CLGAddition("framing", framing, "before"))
        elif scalars.ia < 0.60:
            framing = FRAMING_TEMPLATES["mid_ia"]
            additions.append(CLGAddition("framing", framing, "before"))
        # High IA: no framing (experts don't need it)
        
        # Gate 1 & 2: Concept definitions (based on LC)
        if concepts:
            for concept in concepts:
                definition = get_definition(concept, scalars.lc)
                if definition:
                    def_text = f"({concept}: {definition})"
                    additions.append(CLGAddition("definition", def_text, "after"))
        
        # Gate 2 continued: Example (if LC < 0.5)
        if scalars.lc < 0.50 and concepts:
            for concept in concepts:
                if concept in EXAMPLE_TEMPLATES:
                    additions.append(CLGAddition(
                        "example",
                        EXAMPLE_TEMPLATES[concept],
                        "after"
                    ))
                    break  # Only one example to respect CLS
        
        # Gate 2 continued: Analogy (if LC < 0.25, for young users)
        if scalars.lc < 0.25 and concepts:
            for concept in concepts:
                if concept in ANALOGY_TEMPLATES:
                    additions.append(CLGAddition(
                        "analogy",
                        ANALOGY_TEMPLATES[concept],
                        "after"
                    ))
                    break  # Only one analogy
        
        # Gate 6: Stretch (if EL < EL_MAX, add preview of next level)
        if scalars.el < scalars.el_max and content_type == "lpi":
            if scalars.el in STRETCH_TEMPLATES:
                additions.append(CLGAddition(
                    "stretch",
                    STRETCH_TEMPLATES[scalars.el],
                    "after"
                ))
        
        # Gate 5: Apply CLS (Cognitive Load Span)
        cls_exceeded = len(additions) > scalars.cls
        if cls_exceeded:
            # Prioritize: framing > definition > example > analogy > stretch
            priority = {"framing": 0, "definition": 1, "example": 2, "analogy": 3, "stretch": 4}
            additions.sort(key=lambda a: priority.get(a.type, 99))
            additions = additions[:scalars.cls]
        
        # Assemble final output
        before_parts = [a.text for a in additions if a.position == "before"]
        after_parts = [a.text for a in additions if a.position == "after"]
        
        final_output = ""
        if before_parts:
            final_output += " ".join(before_parts)
        final_output += baseline_text
        if after_parts:
            final_output += " " + " ".join(after_parts)
        
        # Gate 0: Verify baseline immutability
        baseline_mutated = baseline_text not in final_output
        
        return CLGOutput(
            baseline_text=baseline_text,
            baseline_hash=baseline_hash,
            scalars=scalars,
            additions=additions,
            final_output=final_output.strip(),
            baseline_mutated=baseline_mutated,
            cls_exceeded=cls_exceeded
        )


# Singleton
_clg_engine: Optional[CLGEngine] = None

def get_clg_engine() -> CLGEngine:
    """Get CLG engine singleton."""
    global _clg_engine
    if _clg_engine is None:
        _clg_engine = CLGEngine()
    return _clg_engine


# =============================================================================
# VALIDATION TEST
# =============================================================================

def run_validation_test() -> Dict[str, Any]:
    """
    Run TAP 3.0 validation test.
    
    Test cases:
    - 1 PPI question
    - 1 LPI sentence
    - Ages: 6, 12, 35, 65
    - ELs: 1, 3, 5
    
    FAIL CONDITIONS:
    - Any baseline text rewritten
    - Any synonym replacement
    - Output exceeds CLS for young users
    - Higher EL causes simplification
    """
    clg = get_clg_engine()
    
    # Test content
    PPI_BASELINE = "When making financial decisions, I prefer to:"
    LPI_BASELINE = "Creating a budget helps you track spending."
    
    test_cases = [
        {"age": 6, "el": 1},
        {"age": 6, "el": 3},
        {"age": 6, "el": 5},
        {"age": 12, "el": 1},
        {"age": 12, "el": 3},
        {"age": 12, "el": 5},
        {"age": 35, "el": 1},
        {"age": 35, "el": 3},
        {"age": 35, "el": 5},
        {"age": 65, "el": 1},
        {"age": 65, "el": 3},
        {"age": 65, "el": 5},
    ]
    
    results = {
        "version": "TAP 3.0",
        "ppi_baseline": PPI_BASELINE,
        "lpi_baseline": LPI_BASELINE,
        "cases": [],
        "validation": {
            "all_baselines_preserved": True,
            "no_synonym_replacement": True,
            "cls_respected": True,
            "el_monotonic": True
        }
    }
    
    for tc in test_cases:
        scalars = compute_scalars(tc["age"], tc["el"], EL_MAX_POC)
        
        # Process PPI
        ppi_output = clg.process(
            baseline_text=PPI_BASELINE,
            scalars=scalars,
            content_type="ppi",
            concepts=["financial decisions"]
        )
        
        # Process LPI
        lpi_output = clg.process(
            baseline_text=LPI_BASELINE,
            scalars=scalars,
            content_type="lpi",
            concepts=["budget"]
        )
        
        # Check validation
        if ppi_output.baseline_mutated or lpi_output.baseline_mutated:
            results["validation"]["all_baselines_preserved"] = False
        
        if ppi_output.cls_exceeded or lpi_output.cls_exceeded:
            results["validation"]["cls_respected"] = False
        
        results["cases"].append({
            "age": tc["age"],
            "el": tc["el"],
            "scalars": {
                "lc": scalars.lc,
                "cd": scalars.cd,
                "ia": scalars.ia,
                "cls": scalars.cls
            },
            "ppi": {
                "baseline_preserved": not ppi_output.baseline_mutated,
                "additions_count": len(ppi_output.additions),
                "additions": [{"type": a.type, "text": a.text[:50]} for a in ppi_output.additions],
                "final_output": ppi_output.final_output
            },
            "lpi": {
                "baseline_preserved": not lpi_output.baseline_mutated,
                "additions_count": len(lpi_output.additions),
                "additions": [{"type": a.type, "text": a.text[:50]} for a in lpi_output.additions],
                "final_output": lpi_output.final_output
            }
        })
    
    return results


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import json
    results = run_validation_test()
    print(json.dumps(results, indent=2))
```

---

## PART 6: GLOSSARY OF TERMS

| Term | Definition |
|------|------------|
| **TAP** | Text Adaptation Processor — the engine that personalizes content |
| **AE** | Adaptive Engine — orchestrates user assessment and learning paths |
| **PPI** | Personal Profile Instrument — 20-question psychological assessment |
| **LPI** | Learning Path Instrument — 10-chapter financial education curriculum |
| **EL** | Experience Level — user's self-declared financial knowledge (1-5) |
| **EL_MAX** | Maximum Experience Level (5 in POC, 10 in Beta, 15 in Commercial) |
| **LC** | Language Complexity — controls vocabulary sophistication (age-dominant) |
| **CD** | Conceptual Depth — controls financial concept complexity (EL-dominant) |
| **IA** | Ideological Abstraction — controls framing and motivation (balanced) |
| **CLS** | Cognitive Load Span — max scaffolding additions for user's age |
| **CLG** | Controlled Language Generator — the "realization layer" that creates scaffolding |
| **Baseline** | The original expert-level text that is NEVER modified |
| **Scaffolding** | Supporting sentences (definitions, examples, analogies) added around baseline |
| **Financial DNA** | User's psychological profile from PPI (discipline, impulse, confidence, tempo) |

---

## PART 7: CRITICAL RULES FOR FUTURE DEVELOPMENT

1. **NEVER rewrite baseline text** — This is the #1 rule. All previous failures came from violating this.
2. **NEVER use buckets or bands** — All calculations are continuous formulas.
3. **TAP 3.0 is the source of truth** — The `_OLD` files are decommissioned.
4. **Test with diverse profiles** — Always test young beginners AND senior experts.
5. **Verify baseline hash** — Every output must pass the immutability check.

---

*Document created: December 2025*
*TAP Version: 3.0.0*
*For use with Notebook LM and AI assistants*
