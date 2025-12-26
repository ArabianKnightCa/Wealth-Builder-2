# TAP 3.1 Analysis Document for ChatGPT
## Complete Codebase Audit & Improvement Recommendations

---

## EXECUTIVE SUMMARY

TAP 3.1 (Text Adaptation Processor) is designed to make financial literacy content accessible across all ages (6-99) and experience levels (1-5) **WITHOUT** rewriting the baseline text. The system adds "scaffolding" (definitions, examples, analogies, framing) around immutable baseline content.

### THE CRITICAL PROBLEM

**The current architecture FAILS for low-comprehension users (e.g., 6-year-old, EL 1).**

The baseline text:
```
Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. Before money, people bartered—two loaves of bread for one bowl of grain. That only worked when both sides needed each other at the same time. Money solved the timing problem. It became a convenient 'middle step' that stores value until you're ready to use it. Modern money can be cash, balances in a bank account, or digital entries in a secure ledger. Because money is an agreement, confidence matters. Stable rules and trusted systems keep people willing to trade.
```

**Current output for 6yo/EL1:**
```
Let's learn something helpful: Money is a shared agreement. We accept it today because we believe others will accept it tomorrow. Before money, people bartered—two loaves of bread for one bowl of grain. That only worked when both sides needed each other at the same time. Money solved the timing problem. It became a convenient 'middle step' that stores value until you're ready to use it. Modern money can be cash, balances in a bank account, or digital entries in a secure ledger. Because money is an agreement, confidence matters. Stable rules and trusted systems keep people willing to trade. (money: coins and bills you use to buy things) (barter: trading one thing for another without using money) (trade: giving something to get something else) (value: how much something is worth)
```

**Problem:** The definitions at the end don't help. The 6-year-old can't parse "convenient 'middle step' that stores value" or "digital entries in a secure ledger" — the grammar and concepts in the baseline itself are too complex.

---

## HARD CONSTRAINTS (NON-NEGOTIABLE)

1. **NO BUCKETS / NO BANDS** — All calculations must use continuous formulas from `age` and `EL`
2. **NO SEPARATE CONTENT PER AGE/EL** — Would create bloat: 99 ages × 15 ELs × content
3. **BASELINE IS IMMUTABLE** — Cannot rewrite/paraphrase the expert-level text
4. **DETERMINISTIC** — Same inputs must produce same outputs
5. **NO PARAPHRASING** — No synonym replacement, no `string.replace()` on content

---

## CURRENT ARCHITECTURE

### 1. Core Formulas

```python
# Normalization
age_norm = age / 100                    # 6→0.06, 35→0.35, 65→0.65
el_norm = (EL - 1) / (EL_MAX - 1)       # EL1→0.0, EL3→0.5, EL5→1.0

# Three core scalars
LC = 0.65 × age_norm + 0.35 × el_norm   # Language Complexity (age-dominant)
CD = 0.85 × el_norm + 0.15 × age_norm   # Conceptual Depth (EL-dominant)
IA = 0.50 × age_norm + 0.50 × el_norm   # Ideological Abstraction (balanced)
```

### 2. Scalar Values by Profile

| Profile | Age | EL | LC | CD | IA |
|---------|-----|----|----|----|----|
| Child Beginner | 6 | 1 | 0.04 | 0.01 | 0.03 |
| Tween Intermediate | 12 | 3 | 0.25 | 0.44 | 0.31 |
| Adult Beginner | 35 | 1 | 0.23 | 0.05 | 0.18 |
| Adult Expert | 35 | 5 | 0.58 | 0.90 | 0.68 |
| Senior Expert | 65 | 5 | 0.77 | 0.92 | 0.83 |

### 3. Current CLG (Controlled Language Generator) Process

```
1. Gate 0: Hash baseline (immutability check)
2. Gate 4: Add FRAMING before baseline if IA < 0.30
3. Gate 2: Add DEFINITIONS after baseline if LC < term_complexity
4. Gate 2: Add EXAMPLES after baseline if LC < 0.50
5. Gate 2: Add ANALOGIES after baseline if LC < 0.25
6. Gate 5: Apply CLS (Cognitive Load Span) to limit additions
7. Gate 6: Add STRETCH content for EL < EL_MAX
8. Gate 0: Verify baseline unchanged
```

### 4. Control Scalars (from PPI 24-Trait Vector)

8 continuous controls influence scaffolding selection:
- `support_need`: drives definitions, examples, analogies
- `guardrail_need`: drives cautionary framing
- `structure_preference`: drives organized content
- `exploration_bias`: drives discovery prompts
- `social_frame_bias`: drives relational framing
- `tone_warmth`: drives encouraging tone
- `pacing_density`: drives content density
- `stretch_appetite`: drives advanced content preview

---

## IDENTIFIED WEAKNESSES

### Weakness 1: APPEND-ONLY MODEL FAILS FOR LOW LC

**Problem:** All scaffolding is appended AFTER the baseline. For a 6yo who can't read the baseline, putting definitions at the end is useless.

**Current Code:**
```python
# Assemble final output
before_parts = [a.text for a in additions if a.position == "before"]
after_parts = [a.text for a in additions if a.position == "after"]

final_output = ""
if before_parts:
    final_output += " ".join(before_parts)
final_output += baseline_text  # <-- COMPLEX BASELINE INTACT
if after_parts:
    final_output += " " + " ".join(after_parts)  # <-- DEFINITIONS TOO LATE
```

**Possible Fix:** INLINE definitions at point of use:
```
Money (coins and bills you use to buy things) is a shared agreement (when people decide to do things the same way)...
```

### Weakness 2: NO SENTENCE-LEVEL PROCESSING

**Problem:** The engine treats baseline as a single block. It can't add scaffolding between sentences.

**Current:** Treats entire paragraph as one unit
**Needed:** Process each sentence individually, interleave scaffolding

### Weakness 3: NO PREAMBLE GENERATION

**Problem:** For very low LC users, there's no simple introduction before the complex baseline.

**Possible Fix:** Generate LC-calibrated preamble:
```
# For LC < 0.15 (age 6-9, EL 1)
"Let's learn about money! Money is what we use to buy things - like coins and dollar bills."

# Then show the baseline:
"Now let's read what the experts say..."
[baseline text]
```

### Weakness 4: GLOSSARY COMPLEXITY THRESHOLDS ARE TOO HIGH

**Current Glossary:**
```python
GLOSSARY = {
    "money": GlossaryEntry(term="money", complexity=0.05, ...),
    "barter": GlossaryEntry(term="barter", complexity=0.15, ...),
    "value": GlossaryEntry(term="value", complexity=0.15, ...),
}
```

**Problem:** For a 6yo (LC = 0.04), even "money" (complexity 0.05) won't get a definition because:
```python
if lc >= entry.complexity:  # 0.04 >= 0.05 is FALSE
    return None  # No definition added
```

This means the 6yo DOES get definitions, but they're appended at the end.

### Weakness 5: CLS (COGNITIVE LOAD SPAN) LOGIC IS BACKWARDS

**Current:**
```python
if age < 10:
    cls = 3  # Young users: framing + definitions
```

**Problem:** Young users need MORE scaffolding, not less. The CLS should be higher to allow more definitions/examples, not to limit them.

**Possible Fix:** Invert CLS logic for young users or increase the limit significantly.

### Weakness 6: NO GRADUATED REVEAL MECHANISM

**Problem:** The entire baseline is shown at once. For complex content, there's no way to:
- Show a simplified version first
- Progressively reveal complexity
- Break content into digestible chunks

### Weakness 7: FRAMING IS TOO WEAK

**Current framing for low IA:**
```python
framing = "Let's learn something helpful: "
```

**Problem:** This doesn't prepare the user for the complexity that follows. A 6yo needs more setup.

### Weakness 8: NO DIFFICULTY ASSESSMENT OF BASELINE

**Problem:** The system doesn't assess HOW complex the baseline is. A baseline about compound interest is more complex than one about saving coins, but TAP treats them identically.

**Possible Fix:** Add baseline complexity scoring:
```python
def assess_baseline_complexity(text: str) -> float:
    # Count complex terms, sentence length, abstract concepts
    # Return 0.0-1.0 complexity score
```

Then adjust scaffolding intensity based on both user LC AND baseline complexity.

### Weakness 9: OPTIONS/ANSWERS NOT ADAPTED IN PPI

**Current:**
```python
# For options, we keep them as-is (don't add scaffolding to options)
output_items.append({
    ...
    "options": item['options'],  # Options remain unchanged
})
```

**Problem:** PPI question options use adult vocabulary too. A 6yo can't understand:
- "Research extensively before deciding"
- "Follow what financial experts recommend"

### Weakness 10: NO CONCEPT DEPENDENCY TRACKING

**Problem:** The system doesn't know that to understand "barter" you need to understand "trade" first. It can't build concepts progressively.

---

## ARCHITECTURAL SUGGESTIONS

### Suggestion 1: INLINE SCAFFOLDING MODE

Add a new processing mode triggered by LC threshold:

```python
def process_inline(baseline_text: str, scalars: TAP3Scalars, concepts: List[str]) -> str:
    """Insert definitions inline at point of use for low LC users"""
    if scalars.lc >= 0.20:  # Only for young/beginner users
        return baseline_text  # Use standard append mode
    
    result = baseline_text
    for concept in concepts:
        definition = get_definition(concept, scalars.lc)
        if definition:
            # Insert definition after first occurrence
            pattern = rf'\b{concept}\b'
            replacement = f'{concept} ({definition})'
            result = re.sub(pattern, replacement, result, count=1, flags=re.IGNORECASE)
    
    return result
```

### Suggestion 2: PREAMBLE GENERATOR

```python
def generate_preamble(topic: str, lc: float, concepts: List[str]) -> str:
    """Generate age-appropriate introduction based on LC"""
    if lc >= 0.25:
        return ""  # No preamble needed
    
    # Select preamble template based on LC band (continuous, but binned for content)
    if lc < 0.10:  # Very young (age 6-9)
        return PREAMBLE_TEMPLATES[topic]["very_simple"]
    elif lc < 0.20:  # Young (age 10-14)
        return PREAMBLE_TEMPLATES[topic]["simple"]
    else:
        return PREAMBLE_TEMPLATES[topic]["standard"]
```

### Suggestion 3: SENTENCE-LEVEL PROCESSING

```python
def process_by_sentence(baseline_text: str, scalars: TAP3Scalars) -> str:
    """Process baseline sentence by sentence, interleaving scaffolding"""
    sentences = split_into_sentences(baseline_text)
    result_parts = []
    
    for i, sentence in enumerate(sentences):
        # Add sentence
        result_parts.append(sentence)
        
        # Extract concepts from this sentence
        concepts = extract_concepts_from_text(sentence)
        
        # Add scaffolding after sentence if needed
        if scalars.lc < 0.30 and concepts:
            scaffolding = generate_sentence_scaffolding(sentence, concepts, scalars)
            if scaffolding:
                result_parts.append(scaffolding)
    
    return " ".join(result_parts)
```

### Suggestion 4: BASELINE COMPLEXITY SCORING

```python
@dataclass
class BaselineAnalysis:
    word_count: int
    avg_word_length: float
    sentence_count: int
    avg_sentence_length: float
    complex_term_count: int
    abstract_concept_count: int
    overall_complexity: float  # 0.0-1.0

def analyze_baseline(text: str) -> BaselineAnalysis:
    """Analyze baseline text complexity"""
    words = text.split()
    sentences = split_into_sentences(text)
    
    # Count complex terms from glossary
    complex_terms = sum(1 for term in GLOSSARY if term in text.lower())
    
    # Estimate abstract concepts (words like "agreement", "confidence", "value")
    abstract_markers = ["agreement", "confidence", "value", "trust", "believe"]
    abstract_count = sum(1 for marker in abstract_markers if marker in text.lower())
    
    # Calculate overall complexity
    complexity = (
        0.3 * (len(words) / 100) +  # Length factor
        0.3 * (sum(len(w) for w in words) / len(words) / 10) +  # Word complexity
        0.2 * (complex_terms / 10) +  # Technical terms
        0.2 * (abstract_count / 5)  # Abstract concepts
    )
    
    return BaselineAnalysis(
        word_count=len(words),
        avg_word_length=sum(len(w) for w in words) / len(words),
        sentence_count=len(sentences),
        avg_sentence_length=len(words) / len(sentences),
        complex_term_count=complex_terms,
        abstract_concept_count=abstract_count,
        overall_complexity=min(1.0, complexity)
    )
```

### Suggestion 5: ADAPTIVE CLS FORMULA

```python
def compute_adaptive_cls(age: int, lc: float, baseline_complexity: float) -> int:
    """
    Compute CLS that INCREASES scaffolding for young users facing complex content.
    
    Formula: CLS = base + (1 - LC) * complexity_bonus
    """
    # Base CLS by age (adults need less scaffolding)
    if age < 10:
        base_cls = 5  # Young: allow more scaffolding
    elif age < 15:
        base_cls = 4
    elif age < 25:
        base_cls = 3
    else:
        base_cls = 2
    
    # Bonus for low LC users facing complex content
    complexity_bonus = int((1 - lc) * baseline_complexity * 3)
    
    return min(8, base_cls + complexity_bonus)  # Cap at 8
```

---

## COMPLETE CURRENT CODE

### File: `/app/backend/tap_3_0.py`

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
        
        CLS = max(1, min(5, floor(age / 10)))  # 1-5 additions based on age
        
        stretch_EL = min(EL + 1, EL_MAX)
    """
    age_norm = clamp(age / 100.0)
    el_norm = (el - 1) / (el_max - 1) if el_max > 1 else 0.0
    
    lc = clamp(0.65 * age_norm + 0.35 * el_norm)
    cd = clamp(0.85 * el_norm + 0.15 * age_norm)
    ia = clamp(0.50 * age_norm + 0.50 * el_norm)
    
    # Cognitive Load Span: controls how many scaffolding additions are allowed
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

@dataclass
class GlossaryEntry:
    """Single glossary entry."""
    term: str
    complexity: float  # 0.0-1.0 (higher = more complex)
    definition_simple: str  # For LC < 0.3
    definition_standard: str  # For LC 0.3-0.6


GLOSSARY: Dict[str, GlossaryEntry] = {
    "money": GlossaryEntry(
        term="money",
        complexity=0.05,
        definition_simple="coins and bills you use to buy things",
        definition_standard="currency used to pay for goods and services"
    ),
    "barter": GlossaryEntry(
        term="barter",
        complexity=0.15,
        definition_simple="trading one thing for another without using money",
        definition_standard="exchanging goods directly without currency"
    ),
    "trade": GlossaryEntry(
        term="trade",
        complexity=0.10,
        definition_simple="giving something to get something else",
        definition_standard="exchanging goods, services, or money"
    ),
    "value": GlossaryEntry(
        term="value",
        complexity=0.15,
        definition_simple="how much something is worth",
        definition_standard="the worth or usefulness of something"
    ),
    "agreement": GlossaryEntry(
        term="agreement",
        complexity=0.15,
        definition_simple="when people decide to do things the same way",
        definition_standard="a mutual understanding between parties"
    ),
    # ... more terms in actual file
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


def extract_concepts_from_text(text: str) -> List[str]:
    """Extract known concepts from text for glossary lookup."""
    text_lower = text.lower()
    found_concepts = []
    for term in GLOSSARY.keys():
        if term in text_lower:
            found_concepts.append(term)
    return found_concepts


# =============================================================================
# CLG ENGINE (TAP 3.0 REALIZATION)
# =============================================================================

@dataclass
class CLGAddition:
    """A single CLG addition."""
    type: str  # "definition", "example", "analogy", "framing", "stretch"
    text: str
    position: str  # "before" or "after"


@dataclass
class CLGOutput:
    """Output from CLG processing."""
    baseline_text: str
    baseline_hash: str
    scalars: TAP3Scalars
    additions: List[CLGAddition]
    final_output: str
    baseline_mutated: bool
    cls_exceeded: bool
    controls_applied: bool = False


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
    ) -> CLGOutput:
        """Process baseline text through CLG."""
        if controls is None:
            controls = TAPControlInputs.neutral()
        
        controls_applied = controls is not None
        baseline_hash = hash_baseline(baseline_text)
        additions: List[CLGAddition] = []
        
        # Compute effective thresholds based on controls
        definition_threshold = 0.5 - (controls.support_need * 0.3)
        example_threshold = 0.5 - (controls.support_need * 0.2)
        analogy_threshold = 0.25 - (controls.support_need * 0.1)
        
        # Gate 4: Framing (before baseline)
        framing_ia_threshold = 0.30 + (controls.tone_warmth * 0.1)
        if scalars.ia < framing_ia_threshold:
            if controls.guardrail_need > 0.6:
                framing = "Before we begin, remember to think carefully: "
            elif controls.tone_warmth > 0.6:
                framing = "Let's explore something helpful together: "
            else:
                framing = "Let's learn something helpful: "
            additions.append(CLGAddition("framing", framing, "before"))
        elif scalars.ia < 0.60:
            framing = "Here's an important concept: "
            additions.append(CLGAddition("framing", framing, "before"))
        
        # Gate 2: Definitions (after baseline)
        if concepts:
            should_add = scalars.lc < 0.3 or controls.support_need > 0.4
            if should_add:
                for concept in concepts:
                    definition = get_definition(concept, scalars.lc)
                    if definition:
                        def_text = f"({concept}: {definition})"
                        additions.append(CLGAddition("definition", def_text, "after"))
        
        # Gate 2: Example (after baseline)
        if scalars.lc < example_threshold and concepts:
            for concept in concepts:
                if concept in EXAMPLE_TEMPLATES:
                    additions.append(CLGAddition("example", EXAMPLE_TEMPLATES[concept], "after"))
                    break
        
        # Gate 2: Analogy (after baseline)
        if scalars.lc < analogy_threshold and concepts:
            for concept in concepts:
                if concept in ANALOGY_TEMPLATES:
                    additions.append(CLGAddition("analogy", ANALOGY_TEMPLATES[concept], "after"))
                    break
        
        # Gate 5: Apply CLS
        effective_cls = scalars.cls
        if controls.pacing_density > 0.6:
            effective_cls = min(5, scalars.cls + 1)
        
        cls_exceeded = len(additions) > effective_cls
        if cls_exceeded:
            if scalars.age < 12:
                priority = {"definition": 0, "framing": 1, "example": 2, "analogy": 3, "stretch": 4}
            else:
                priority = {"framing": 0, "definition": 1, "example": 2, "analogy": 3, "stretch": 4}
            additions.sort(key=lambda a: priority.get(a.type, 99))
            additions = additions[:effective_cls]
        
        # Assemble final output
        before_parts = [a.text for a in additions if a.position == "before"]
        after_parts = [a.text for a in additions if a.position == "after"]
        
        final_output = ""
        if before_parts:
            final_output += " ".join(before_parts)
        final_output += baseline_text
        if after_parts:
            final_output += " " + " ".join(after_parts)
        
        baseline_mutated = baseline_text not in final_output
        
        return CLGOutput(
            baseline_text=baseline_text,
            baseline_hash=baseline_hash,
            scalars=scalars,
            additions=additions,
            final_output=final_output.strip(),
            baseline_mutated=baseline_mutated,
            cls_exceeded=cls_exceeded,
            controls_applied=controls_applied
        )
```

### File: `/app/backend/tap_control_scalars.py`

```python
"""
TAP Control Scalars — Mapping PPI 24-Trait Vector to 8 CLG Controls
====================================================================

This module computes 8 continuous control scalars from the VIA 24-trait vector.
These controls influence CLG module selection and tone framing ONLY.

CRITICAL: Controls do NOT rewrite baseline text. They only select which
CLG modules (definitions, examples, analogies, framing) are applied.
"""

from typing import Dict, List, Any
from dataclasses import dataclass


def clamp(x: float) -> float:
    return min(1.0, max(0.0, x))


def inv(x: float) -> float:
    return 1.0 - x


@dataclass
class TAPControlScalars:
    support_need: float        # Higher = needs more scaffolding/definitions
    guardrail_need: float      # Higher = needs more cautionary framing
    structure_preference: float # Higher = prefers organized, step-by-step content
    exploration_bias: float    # Higher = enjoys discovery and open-ended content
    social_frame_bias: float   # Higher = responds to social/relational framing
    tone_warmth: float         # Higher = prefers warm, encouraging tone
    pacing_density: float      # Higher = can handle denser content
    stretch_appetite: float    # Higher = eager for advanced concepts


def compute_control_scalars(traits: Dict[str, float]) -> TAPControlScalars:
    """
    Compute 8 TAP control scalars from 24-trait vector.
    
    Trait Reference:
        T01=Creativity, T02=Curiosity, T03=Open-mindedness, T04=Love of Learning
        T05=Perspective, T06=Bravery, T07=Persistence, T08=Integrity/Honesty
        T09=Vitality/Zest, T10=Kindness, T11=Love, T12=Social Intelligence
        T13=Fairness, T14=Leadership, T15=Teamwork, T16=Forgiveness
        T17=Humility/Modesty, T18=Prudence, T19=Self-Regulation
        T20=Appreciation of Beauty, T21=Gratitude, T22=Hope/Optimism
        T23=Humor, T24=Spirituality
    """
    def t(trait_id: str) -> float:
        return traits.get(trait_id, 0.5)
    
    # SUPPORT_NEED: Higher when user lacks self-regulation, prudence, persistence
    support_need = clamp(
        0.35 * inv(t("T19")) +  # Low self-regulation → needs support
        0.25 * inv(t("T18")) +  # Low prudence → needs guidance
        0.20 * inv(t("T07")) +  # Low persistence → needs encouragement
        0.20 * inv(t("T05"))    # Low perspective → needs context
    )
    
    # GUARDRAIL_NEED: Higher when user lacks prudence, self-regulation
    guardrail_need = clamp(
        0.45 * inv(t("T18")) +
        0.35 * inv(t("T19")) +
        0.20 * inv(t("T08"))
    )
    
    # STRUCTURE_PREFERENCE: Higher when user has prudence, persistence
    structure_preference = clamp(
        0.40 * t("T18") +
        0.35 * t("T07") +
        0.25 * t("T04")
    )
    
    # EXPLORATION_BIAS: Higher when user has curiosity, creativity
    exploration_bias = clamp(
        0.40 * t("T02") +
        0.35 * t("T01") +
        0.25 * t("T03")
    )
    
    # SOCIAL_FRAME_BIAS: Higher when user values kindness, teamwork
    social_frame_bias = clamp(
        0.25 * t("T10") +
        0.25 * t("T11") +
        0.25 * t("T12") +
        0.25 * t("T15")
    )
    
    # TONE_WARMTH: Higher when user values kindness, gratitude
    tone_warmth = clamp(
        0.25 * t("T10") +
        0.20 * t("T11") +
        0.20 * t("T21") +
        0.20 * t("T22") +
        0.15 * t("T17")
    )
    
    # PACING_DENSITY: Higher when user has vitality, curiosity
    pacing_density = clamp(
        0.35 * t("T09") +
        0.25 * t("T02") +
        0.25 * t("T04") +
        0.15 * inv(t("T18"))
    )
    
    # STRETCH_APPETITE: Higher when user has love of learning, bravery
    stretch_appetite = clamp(
        0.30 * t("T04") +
        0.25 * t("T07") +
        0.25 * t("T06") +
        0.20 * t("T22")
    )
    
    return TAPControlScalars(
        support_need=round(support_need, 4),
        guardrail_need=round(guardrail_need, 4),
        structure_preference=round(structure_preference, 4),
        exploration_bias=round(exploration_bias, 4),
        social_frame_bias=round(social_frame_bias, 4),
        tone_warmth=round(tone_warmth, 4),
        pacing_density=round(pacing_density, 4),
        stretch_appetite=round(stretch_appetite, 4)
    )
```

### File: `/app/backend/ppi_trait_vector.py`

```python
"""
PPI → 24 Trait Vector System (Option A: Trait Tags + Shared Weight Templates)
==============================================================================

Each question has:
- primary_trait: T01..T24 (required)
- secondary_trait: T01..T24 (optional)
- polarity: "normal" or "reverse"
- intensity: "light" | "medium" | "heavy"

Shared templates convert these tags into weights.
Output is a deterministic 24-trait vector (0.0–1.0 each).
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum


# Answer normalization: A/B/C/D → [0.0, 1.0]
ANSWER_VALUES = {"A": 0.00, "B": 0.33, "C": 0.67, "D": 1.00}


# Intensity weight templates
INTENSITY_TEMPLATES = {
    "light": {"w1": 0.70, "w2": 0.30},
    "medium": {"w1": 0.80, "w2": 0.20},
    "heavy": {"w1": 0.90, "w2": 0.10},
}


# PPI Question trait tags (20 questions)
PPI_TRAIT_TAGS = {
    "PPI_Q01": {"primary_trait": "T18", "secondary_trait": "T02", "polarity": "normal", "intensity": "medium"},
    "PPI_Q02": {"primary_trait": "T19", "secondary_trait": "T07", "polarity": "normal", "intensity": "heavy"},
    # ... etc
}


def compute_trait_vector(answers: List[Dict[str, str]], total_questions: int = 20) -> Dict:
    """Compute 24-trait vector from PPI answers."""
    numerator = {f"T{i:02d}": 0.0 for i in range(1, 25)}
    denominator = {f"T{i:02d}": 0.0 for i in range(1, 25)}
    
    for answer in answers:
        q_id = answer.get("question_id", "")
        selected = answer.get("selected_option", "")
        trait_tags = PPI_TRAIT_TAGS.get(q_id)
        if not trait_tags:
            continue
        
        # Normalize answer
        v = ANSWER_VALUES.get(selected.upper()[0], 0.5)
        if trait_tags["polarity"] == "reverse":
            v = 1.0 - v
        
        # Get weights
        template = INTENSITY_TEMPLATES[trait_tags.get("intensity", "medium")]
        w1 = template["w1"]
        w2 = template["w2"] if trait_tags.get("secondary_trait") else 0.0
        
        # Apply to primary trait
        numerator[trait_tags["primary_trait"]] += w1 * v
        denominator[trait_tags["primary_trait"]] += w1
        
        # Apply to secondary trait
        if trait_tags.get("secondary_trait"):
            numerator[trait_tags["secondary_trait"]] += w2 * v
            denominator[trait_tags["secondary_trait"]] += w2
    
    # Compute final scores
    traits = {}
    for t in numerator:
        if denominator[t] > 0:
            traits[t] = round(min(1.0, max(0.0, numerator[t] / denominator[t])), 4)
        else:
            traits[t] = 0.5  # Neutral default
    
    return {"traits": traits, "stability": len(answers) / total_questions}
```

---

## SPECIFIC QUESTIONS FOR CHATGPT

1. **How can we make content comprehensible for a 6yo WITHOUT rewriting the baseline?**
   - Is inline scaffolding the right approach?
   - Should we generate a "bridge" preamble first?

2. **Should we process text sentence-by-sentence?**
   - Would interleaving scaffolding between sentences help?
   - How do we handle sentence dependencies?

3. **Is the CLS (Cognitive Load Span) logic inverted?**
   - Young users need MORE scaffolding, not less
   - Should CLS increase for low-LC users?

4. **Should we assess baseline complexity before processing?**
   - A simple baseline needs less scaffolding
   - A complex baseline needs more scaffolding regardless of user LC

5. **How do we handle PPI question options for young users?**
   - Currently options are not adapted at all
   - Should we provide simpler option text for low-LC users?

6. **What's the best formula structure?**
   - Current: `LC = 0.65 * age_norm + 0.35 * el_norm`
   - Should weights be different?
   - Should there be non-linear terms?

7. **How do control scalars from PPI affect scaffolding?**
   - Current implementation modifies thresholds
   - Is this the right approach?

---

## DESIRED OUTPUT EXAMPLE

**For 6yo/EL1 user:**

```
🎈 Let's learn about money!

Money is what we use to buy things - like the coins and dollar bills in your piggy bank.

---

Money is a shared agreement. We accept it today because we believe others will accept it tomorrow.

💡 "Shared agreement" means everyone agrees money is valuable - like how everyone at school agrees gold stars are special!

Before money, people bartered—two loaves of bread for one bowl of grain.

💡 "Bartered" means trading without money - like swapping your sandwich for your friend's chips at lunch!

That only worked when both sides needed each other at the same time. Money solved the timing problem.

💡 Now you can sell something, keep the money, and buy what you want later - even if it's a different day!

[... continues with scaffolding after each sentence ...]
```

**Note:** This output violates the "no preamble" constraint if we consider "Let's learn about money!" as adding content not in the baseline. We need ChatGPT to help resolve this tension.

---

## FILES FOR REFERENCE

- `/app/backend/tap_3_0.py` - Core TAP engine
- `/app/backend/tap_control_scalars.py` - 8 control scalars from PPI
- `/app/backend/ppi_trait_vector.py` - 24-trait vector computation
- `/app/backend/ae_engine_v2.py` - Adaptive Engine (calls TAP)
- `/app/backend/server.py` - API endpoints
- `/app/TAP_3_1_PROBLEM_STATEMENT.md` - Previous problem statement
- `/app/Legend_2.0.md` - Acronym reference

---

*Document prepared for ChatGPT analysis and improvement recommendations*
*Generated: December 2025*
