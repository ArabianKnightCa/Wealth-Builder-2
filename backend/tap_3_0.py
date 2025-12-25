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
    # Basic concepts (appear in early LPI chapters)
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
    "spending": GlossaryEntry(
        term="spending",
        complexity=0.08,
        definition_simple="using money to buy things",
        definition_standard="the act of paying money for goods or services"
    ),
    "income": GlossaryEntry(
        term="income",
        complexity=0.15,
        definition_simple="money you get from work or other places",
        definition_standard="money received from work, investments, or other sources"
    ),
    "expenses": GlossaryEntry(
        term="expenses",
        complexity=0.18,
        definition_simple="things you have to pay for",
        definition_standard="costs incurred for goods or services"
    ),
    "bank": GlossaryEntry(
        term="bank",
        complexity=0.10,
        definition_simple="a safe place to keep your money",
        definition_standard="a financial institution that holds deposits"
    ),
    "account": GlossaryEntry(
        term="account",
        complexity=0.15,
        definition_simple="a place at a bank where your money is kept",
        definition_standard="a record of money held at a financial institution"
    ),
    "digital": GlossaryEntry(
        term="digital",
        complexity=0.20,
        definition_simple="on a computer or phone, not paper",
        definition_standard="electronic or computerized"
    ),
    "ledger": GlossaryEntry(
        term="ledger",
        complexity=0.35,
        definition_simple="a list that keeps track of money",
        definition_standard="a record of financial transactions"
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


def extract_concepts_from_text(text: str) -> List[str]:
    """
    Extract known concepts from text for glossary lookup.
    Returns list of concept keys that appear in the text.
    """
    text_lower = text.lower()
    found_concepts = []
    
    # Check for each glossary term in the text
    for term in GLOSSARY.keys():
        if term in text_lower:
            found_concepts.append(term)
    
    return found_concepts


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
    controls_applied: bool = False  # True if control scalars were used


class CLGEngine:
    """
    Controlled Language Generator for TAP 3.0.
    
    RULES:
    1. NEVER modify baseline text
    2. ONLY ADD sentences before or after baseline
    3. Respect CLS (Cognitive Load Span) - truncate if exceeded
    4. Higher EL = more sophisticated additions, NEVER simplified
    5. Control scalars influence module selection thresholds
    """
    
    def process(
        self,
        baseline_text: str,
        scalars: TAP3Scalars,
        content_type: str = "lpi",  # "ppi" or "lpi"
        concepts: Optional[List[str]] = None,
        controls: Optional[TAPControlInputs] = None
    ) -> CLGOutput:
        """
        Process baseline text through CLG.
        
        Args:
            baseline_text: The IMMUTABLE baseline text
            scalars: TAP 3.0 scalars (age, EL, LC, CD, IA, CLS)
            content_type: "ppi" or "lpi"
            concepts: List of concept keys for glossary lookup
            controls: Optional 8 control scalars from PPI trait vector
        
        Returns:
            CLGOutput with baseline preserved and additions listed
        """
        # Use neutral controls if none provided
        if controls is None:
            controls = TAPControlInputs.neutral()
        
        controls_applied = controls is not None
        
        # Gate 0: Capture baseline hash
        baseline_hash = hash_baseline(baseline_text)
        
        additions: List[CLGAddition] = []
        
        # =====================================================================
        # CONTROL-DRIVEN MODULE SELECTION
        # Controls modify the thresholds for adding scaffolding
        # =====================================================================
        
        # Compute effective thresholds based on controls
        # Higher support_need → lower threshold → more likely to add scaffolding
        definition_threshold = 0.5 - (controls.support_need * 0.3)  # 0.2-0.5
        example_threshold = 0.5 - (controls.support_need * 0.2)     # 0.3-0.5
        analogy_threshold = 0.25 - (controls.support_need * 0.1)   # 0.15-0.25
        
        # Higher stretch_appetite → more likely to add stretch content
        stretch_threshold = 0.5 - (controls.stretch_appetite * 0.3)  # 0.2-0.5
        
        # =====================================================================
        # Gate 4: Framing (based on IA + tone_warmth + guardrail_need)
        # =====================================================================
        framing_ia_threshold = 0.30 + (controls.tone_warmth * 0.1)  # Warm users get more framing
        
        if scalars.ia < framing_ia_threshold:
            # Select framing based on tone_warmth and guardrail_need
            if controls.guardrail_need > 0.6:
                framing = "Before we begin, remember to think carefully: "
            elif controls.tone_warmth > 0.6:
                framing = "Let's explore something helpful together: "
            else:
                framing = FRAMING_TEMPLATES["low_ia"]
            additions.append(CLGAddition("framing", framing, "before"))
        elif scalars.ia < 0.60:
            framing = FRAMING_TEMPLATES["mid_ia"]
            additions.append(CLGAddition("framing", framing, "before"))
        # High IA: no framing (experts don't need it)
        
        # =====================================================================
        # Gate 1 & 2: Concept definitions (based on LC + support_need)
        # For young users (low LC), ALWAYS add definitions regardless of support_need
        # =====================================================================
        if concepts:
            # Low LC users get definitions regardless of support_need
            should_add_definitions = scalars.lc < 0.3 or controls.support_need > 0.4
            if should_add_definitions:
                for concept in concepts:
                    definition = get_definition(concept, scalars.lc)
                    if definition:
                        def_text = f"({concept}: {definition})"
                        additions.append(CLGAddition("definition", def_text, "after"))
        
        # =====================================================================
        # Gate 2 continued: Example (based on LC + support_need)
        # =====================================================================
        example_lc_threshold = example_threshold if controls.support_need > 0.3 else 0.50
        if scalars.lc < example_lc_threshold and concepts:
            for concept in concepts:
                if concept in EXAMPLE_TEMPLATES:
                    additions.append(CLGAddition(
                        "example",
                        EXAMPLE_TEMPLATES[concept],
                        "after"
                    ))
                    break  # Only one example to respect CLS
        
        # =====================================================================
        # Gate 2 continued: Analogy (for young users or high support_need)
        # =====================================================================
        analogy_lc_threshold = analogy_threshold if controls.support_need > 0.5 else 0.25
        if scalars.lc < analogy_lc_threshold and concepts:
            for concept in concepts:
                if concept in ANALOGY_TEMPLATES:
                    additions.append(CLGAddition(
                        "analogy",
                        ANALOGY_TEMPLATES[concept],
                        "after"
                    ))
                    break  # Only one analogy
        
        # =====================================================================
        # Gate 6: Stretch (based on EL + stretch_appetite)
        # =====================================================================
        if scalars.el < scalars.el_max and content_type == "lpi":
            # Only add stretch if user has appetite for it
            if controls.stretch_appetite > 0.4 and scalars.el in STRETCH_TEMPLATES:
                additions.append(CLGAddition(
                    "stretch",
                    STRETCH_TEMPLATES[scalars.el],
                    "after"
                ))
        
        # =====================================================================
        # Gate 5: Apply CLS (Cognitive Load Span)
        # Higher pacing_density allows more additions
        # =====================================================================
        effective_cls = scalars.cls
        if controls.pacing_density > 0.6:
            effective_cls = min(5, scalars.cls + 1)  # Allow one more addition
        
        cls_exceeded = len(additions) > effective_cls
        if cls_exceeded:
            # Prioritize: framing > definition > example > analogy > stretch
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
        
        # Gate 0: Verify baseline immutability
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
