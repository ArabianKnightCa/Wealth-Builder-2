# TAP 3.1 - Current State & Problem Statement
## For ChatGPT Discussion

---

## CURRENT PROBLEM

The TAP 3.1 system adds scaffolding (definitions, examples, analogies, framing) **AROUND** immutable baseline text. But for a 6-year-old EL1 user, this doesn't work because:

1. **The baseline text itself is adult-level:** "Money is a shared agreement... bartered... digital entries in a secure ledger... confidence matters"
2. **Adding definitions at the END doesn't help:** A 6yo can't parse the complex sentence to begin with
3. **PPI questions use adult vocabulary:** "When making financial decisions, I prefer to: Research extensively before deciding"

**Current output for 6yo EL1:**
```
Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. Before money, people bartered—two loaves of bread for one bowl of grain. That only worked when both sides needed each other at the same time. Money solved the timing problem. It became a convenient 'middle step' that stores value until you're ready to use it. Modern money can be cash, balances in a bank account, or digital entries in a secure ledger. Because money is an agreement, confidence matters. Stable rules and trusted systems keep people willing to trade. (money: coins and bills you use to buy things) (barter: trading one thing for another without using money) (trade: giving something to get something else) (value: how much something is worth)
```

**The definitions at the end don't make the paragraph readable for a 6yo.**

---

## HARD CONSTRAINTS (NON-NEGOTIABLE)

1. **NO BUCKETS / NO BANDS** - Age is continuous (6-99), EL is continuous (1-5 in POC, 1-15 in commercial)
2. **NO SEPARATE CONTENT PER AGE/EL** - Would create bloat: 99 ages × 15 ELs × 250 PPI questions × 10 LPI chapters = unmanageable
3. **BASELINE IS IMMUTABLE** - Cannot rewrite/paraphrase the expert-level text
4. **DETERMINISTIC** - Same inputs must produce same outputs
5. **NO PARAPHRASING** - No synonym replacement, no string.replace() on content

---

## WHAT TAP CURRENTLY DOES

### Inputs:
- `age`: int (6-99)
- `EL`: int (Experience Level, 1-5 in POC)
- `controls`: 8 floats from PPI 24-trait vector (support_need, guardrail_need, etc.)

### Core Formulas:
```python
age_norm = age / 100                    # 6→0.06, 35→0.35, 65→0.65
el_norm = (EL - 1) / (EL_MAX - 1)       # EL1→0.0, EL3→0.5, EL5→1.0

LC = 0.65 × age_norm + 0.35 × el_norm   # Language Complexity (age-dominant)
CD = 0.85 × el_norm + 0.15 × age_norm   # Conceptual Depth (EL-dominant)
IA = 0.50 × age_norm + 0.50 × el_norm   # Ideological Abstraction (balanced)
```

### Scalar Values by Profile:
| Profile | Age | EL | LC | CD | IA |
|---------|-----|----|----|----|----|
| Child Beginner | 6 | 1 | 0.04 | 0.01 | 0.03 |
| Tween Intermediate | 12 | 3 | 0.25 | 0.44 | 0.31 |
| Adult Beginner | 35 | 1 | 0.23 | 0.05 | 0.18 |
| Adult Expert | 35 | 5 | 0.58 | 0.90 | 0.68 |
| Senior Expert | 65 | 5 | 0.77 | 0.92 | 0.83 |

### What CLG Does Now:
1. **Gate 4 (Framing):** Adds "Let's learn something helpful: " BEFORE baseline if IA < 0.30
2. **Gate 2 (Definitions):** Adds "(term: definition)" AFTER baseline if LC < term complexity
3. **Gate 2 (Examples):** Adds example sentence AFTER baseline if LC < 0.50
4. **Gate 2 (Analogies):** Adds analogy AFTER baseline if LC < 0.25
5. **Gate 6 (Stretch):** Adds advanced preview AFTER baseline if EL < EL_MAX

**Problem:** All additions are APPENDED to the end. A 6yo can't read the complex baseline to get to the helpful definitions.

---

## THE CHALLENGE

How do we make content appropriate for a 6yo EL1 WITHOUT:
- Creating separate content versions (bloat)
- Using age buckets/bands (must be continuous formula)
- Rewriting/paraphrasing the baseline text
- Creating personality types or discrete categories

### Ideas to Explore:

1. **Inline Scaffolding**: Insert definitions WITHIN the text at point of use, not appended at end
   - "Money (coins and bills) is a shared agreement (when people decide to do things the same way)..."
   - Formula-driven: `inline_mode = LC < 0.20`

2. **Preamble Generation**: Generate a simple introduction BEFORE the baseline based on LC
   - For LC < 0.15: Add "Let's learn what money is! Money is what we use to buy things."
   - The preamble uses simple vocabulary calibrated to LC
   - Baseline still follows, but context is established first

3. **Sentence-Level Processing**: Break baseline into sentences, add scaffolding per sentence
   - Instead of appending all definitions at end, interleave them

4. **Graduated Reveal**: For very low LC, show simplified preamble first, then progressively reveal baseline
   - Not hiding baseline, but establishing foundation first

---

## CURRENT TAP 3.1 CODE

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

CONTROL SCALARS (from PPI 24-trait vector):
- support_need: drives definitions, examples, analogies
- guardrail_need: drives cautionary framing
- structure_preference: drives organized content
- exploration_bias: drives discovery prompts
- social_frame_bias: drives relational framing
- tone_warmth: drives encouraging tone
- pacing_density: drives content density
- stretch_appetite: drives advanced content preview

Version: 3.1.0 (with control scalar integration)
"""

import hashlib
from dataclasses import dataclass, field
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


@dataclass
class TAPControlInputs:
    """
    8 Control Scalars from PPI 24-trait vector.
    These influence CLG module selection WITHOUT rewriting text.
    """
    support_need: float = 0.5        # Higher = needs more scaffolding
    guardrail_need: float = 0.5      # Higher = needs cautionary framing
    structure_preference: float = 0.5 # Higher = prefers organized content
    exploration_bias: float = 0.5    # Higher = enjoys discovery
    social_frame_bias: float = 0.5   # Higher = responds to social framing
    tone_warmth: float = 0.5         # Higher = prefers warm tone
    pacing_density: float = 0.5      # Higher = can handle dense content
    stretch_appetite: float = 0.5    # Higher = eager for advanced concepts
    
    @classmethod
    def from_dict(cls, d: Dict[str, float]) -> 'TAPControlInputs':
        """Create from dictionary (e.g., from tap_control_scalars output)"""
        return cls(
            support_need=d.get('support_need', 0.5),
            guardrail_need=d.get('guardrail_need', 0.5),
            structure_preference=d.get('structure_preference', 0.5),
            exploration_bias=d.get('exploration_bias', 0.5),
            social_frame_bias=d.get('social_frame_bias', 0.5),
            tone_warmth=d.get('tone_warmth', 0.5),
            pacing_density=d.get('pacing_density', 0.5),
            stretch_appetite=d.get('stretch_appetite', 0.5)
        )
    
    @classmethod
    def neutral(cls) -> 'TAPControlInputs':
        """Return neutral controls (all 0.5) for users without PPI"""
        return cls()


def compute_scalars(age: int, el: int, el_max: int = EL_MAX_POC) -> TAP3Scalars:
    """
    Compute TAP 3.0 scalars.
    
    Formulas:
        age_norm = age / 100
        el_norm  = (EL - 1) / (EL_MAX - 1)
        
        LC = 0.65 * age_norm + 0.35 * el_norm
        CD = 0.85 * el_norm  + 0.15 * age_norm
        IA = 0.50 * age_norm + 0.50 * el_norm
    """
    age_norm = clamp(age / 100.0)
    el_norm = (el - 1) / (el_max - 1) if el_max > 1 else 0.0
    
    lc = clamp(0.65 * age_norm + 0.35 * el_norm)
    cd = clamp(0.85 * el_norm + 0.15 * age_norm)
    ia = clamp(0.50 * age_norm + 0.50 * el_norm)
    
    # Cognitive Load Span
    if age < 10:
        cls = 3
    elif age < 15:
        cls = 3
    elif age < 25:
        cls = 3
    else:
        cls = min(5, max(3, age // 10))
    
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
# GLOSSARY
# =============================================================================

GLOSSARY = {
    "money": {"complexity": 0.05, "simple": "coins and bills you use to buy things"},
    "barter": {"complexity": 0.15, "simple": "trading one thing for another without using money"},
    "trade": {"complexity": 0.10, "simple": "giving something to get something else"},
    "value": {"complexity": 0.15, "simple": "how much something is worth"},
    "agreement": {"complexity": 0.15, "simple": "when people decide to do things the same way"},
    "budget": {"complexity": 0.15, "simple": "a plan for how you use your money"},
    "savings": {"complexity": 0.10, "simple": "money you keep instead of spending"},
    "debt": {"complexity": 0.20, "simple": "money you owe to someone"},
    "interest": {"complexity": 0.25, "simple": "extra money you pay when you borrow, or earn when you save"},
    "investment": {"complexity": 0.30, "simple": "putting money into something that might grow"},
    # ... more terms
}


def get_definition(term: str, lc: float) -> Optional[str]:
    """Get definition for term based on LC."""
    entry = GLOSSARY.get(term.lower())
    if not entry:
        return None
    if lc >= entry["complexity"]:
        return None
    return entry["simple"]


def extract_concepts_from_text(text: str) -> List[str]:
    """Extract known concepts from text for glossary lookup."""
    text_lower = text.lower()
    return [term for term in GLOSSARY.keys() if term in text_lower]


# =============================================================================
# CLG ENGINE
# =============================================================================

class CLGEngine:
    """
    Controlled Language Generator for TAP 3.0.
    
    RULES:
    1. NEVER modify baseline text
    2. ONLY ADD sentences before or after baseline
    3. Respect CLS (Cognitive Load Span)
    4. Higher EL = more sophisticated additions, NEVER simplified
    """
    
    def process(
        self,
        baseline_text: str,
        scalars: TAP3Scalars,
        content_type: str = "lpi",
        concepts: Optional[List[str]] = None,
        controls: Optional[TAPControlInputs] = None
    ) -> dict:
        """Process baseline text through CLG."""
        if controls is None:
            controls = TAPControlInputs.neutral()
        
        additions = []
        
        # Gate 4: Framing (before baseline)
        if scalars.ia < 0.30:
            additions.append({"type": "framing", "text": "Let's learn something helpful: ", "position": "before"})
        elif scalars.ia < 0.60:
            additions.append({"type": "framing", "text": "Here's an important concept: ", "position": "before"})
        
        # Gate 2: Definitions (after baseline)
        if concepts:
            should_add = scalars.lc < 0.3 or controls.support_need > 0.4
            if should_add:
                for concept in concepts:
                    definition = get_definition(concept, scalars.lc)
                    if definition:
                        additions.append({"type": "definition", "text": f"({concept}: {definition})", "position": "after"})
        
        # Assemble output (definitions APPENDED at end - THIS IS THE PROBLEM)
        before = " ".join([a["text"] for a in additions if a["position"] == "before"])
        after = " ".join([a["text"] for a in additions if a["position"] == "after"])
        
        final = before + baseline_text + (" " + after if after else "")
        
        return {"final_output": final.strip(), "additions": additions}
```

---

## QUESTIONS FOR DISCUSSION

1. How can we make the output readable for a 6yo WITHOUT creating separate content versions?

2. Should scaffolding be INLINE instead of APPENDED? Formula: `inline_mode = LC < 0.20`

3. Should we add a PREAMBLE (simple introduction) before the baseline for low LC users?

4. Is there a way to "translate" the baseline on-the-fly using continuous formulas rather than discrete versions?

5. How do we handle PPI questions that use adult vocabulary for young users?

---

## SAMPLE LPI BASELINE (CH1_L1)

```
Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. Before money, people bartered—two loaves of bread for one bowl of grain. That only worked when both sides needed each other at the same time. Money solved the timing problem. It became a convenient 'middle step' that stores value until you're ready to use it. Modern money can be cash, balances in a bank account, or digital entries in a secure ledger. Because money is an agreement, confidence matters. Stable rules and trusted systems keep people willing to trade.
```

**Vocabulary issues for 6yo:**
- "shared agreement" - abstract concept
- "bartered" - archaic term
- "convenient 'middle step'" - metaphor
- "stores value" - abstract
- "digital entries in a secure ledger" - way too complex
- "confidence matters" - abstract
- "Stable rules and trusted systems" - abstract

---

## DESIRED OUTPUT FOR 6YO EL1 (EXAMPLE)

Something like:
```
Let's learn about money!

Money is what we use to buy things - like coins and dollar bills.

A long time ago, before money existed, people had to trade things directly. If you wanted bread, you had to find someone who had bread AND wanted something you had. That was really hard!

Money made things easier. Now you can sell something, keep the money, and buy what you want later.

Today, money can be coins in your pocket, or numbers on a computer that show how much you have saved.

Everyone agrees that money is valuable - that's why it works!
```

**But this would require rewriting the baseline, which violates our constraints.**

---

## WHAT SOLUTION FITS THE CONSTRAINTS?

Need a formula-driven approach that:
- Uses continuous age/EL values (no buckets)
- Doesn't require separate content versions
- Doesn't rewrite/paraphrase baseline
- Makes content accessible for low LC users
- Is deterministic
