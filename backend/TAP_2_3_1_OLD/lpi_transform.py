"""
LPI Content Transformation - CLG Integration
=============================================
Transforms LPI lesson content using:
- Age (via age_norm)
- Experience Level (via el_norm)
- Financial DNA (discipline, impulse, confidence, tempo)

The transformation formula combines all three inputs to produce
appropriately adapted educational content.

Version: 1.0.0
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from tap_v2_3_formulas import compute_tap_scalars, TAPScalars


@dataclass
class FinancialDNA:
    """User's Financial DNA from PPI assessment."""
    discipline: float  # 0.0-1.0: Planning and structure tendency
    impulse: float     # 0.0-1.0: Spontaneous spending tendency
    confidence: float  # 0.0-1.0: Financial confidence level
    tempo: str         # "fast" | "steady" | "slow"
    profile: str       # Archetype: Planner, Spontaneous, etc.


@dataclass
class LPIScalars:
    """
    Complete scalar set for LPI transformation.
    Combines TAP scalars (from age+EL) with DNA influence.
    """
    # Base TAP scalars (from age + EL)
    age: int
    el: int
    age_norm: float
    el_norm: float
    lc: float  # Language Complexity
    cd: float  # Conceptual Depth
    ia: float  # Ideological Abstraction
    
    # DNA influence scalars
    discipline: float
    impulse: float
    confidence: float
    tempo: str
    
    # Combined/derived scalars for LPI
    support_level: float      # How much scaffolding/examples to include
    challenge_level: float    # How much to stretch the user
    tone_warmth: float        # Supportive vs direct tone
    pacing_density: float     # Content density based on tempo


def compute_lpi_scalars(
    age: int,
    el: int,
    el_max: int,
    dna: Optional[FinancialDNA] = None
) -> LPIScalars:
    """
    Compute complete LPI transformation scalars.
    
    Combines:
    - TAP scalars from age + EL (LC, CD, IA)
    - DNA influence on support, challenge, tone, pacing
    
    Args:
        age: User's age
        el: User's declared Experience Level (1 to el_max)
        el_max: Maximum EL for current release
        dna: User's Financial DNA from PPI (optional - uses defaults if None)
    
    Returns:
        LPIScalars with all transformation parameters
    """
    # Get base TAP scalars
    tap = compute_tap_scalars(age, el, el_max)
    
    # Default DNA if not provided
    if dna is None:
        dna = FinancialDNA(
            discipline=0.5,
            impulse=0.5,
            confidence=0.5,
            tempo="steady",
            profile="Balanced"
        )
    
    # ==========================================================================
    # DERIVED SCALARS - Combining Age, EL, and DNA
    # ==========================================================================
    
    # SUPPORT LEVEL: How much scaffolding/examples to include
    # - Lower LC needs more support (language is simpler, need more explanation)
    # - Lower confidence needs more support (reassurance)
    # - Higher impulse benefits from more examples (concrete over abstract)
    # Formula: support = (1 - LC) * 0.4 + (1 - confidence) * 0.3 + impulse * 0.3
    support_level = (
        (1 - tap.lc) * 0.40 +
        (1 - dna.confidence) * 0.30 +
        dna.impulse * 0.30
    )
    support_level = min(1.0, max(0.0, support_level))
    
    # CHALLENGE LEVEL: How much to stretch the user
    # - Higher CD can handle more challenge
    # - Higher discipline can handle more complexity
    # - Higher confidence welcomes challenge
    # Formula: challenge = CD * 0.4 + discipline * 0.3 + confidence * 0.3
    challenge_level = (
        tap.cd * 0.40 +
        dna.discipline * 0.30 +
        dna.confidence * 0.30
    )
    challenge_level = min(1.0, max(0.0, challenge_level))
    
    # TONE WARMTH: Supportive vs Direct
    # - Lower confidence needs warmer tone
    # - Higher impulse responds to engaging/warmer tone
    # - Younger users (lower age_norm) need warmer tone
    # Formula: warmth = (1 - confidence) * 0.4 + impulse * 0.3 + (1 - age_norm) * 0.3
    tone_warmth = (
        (1 - dna.confidence) * 0.40 +
        dna.impulse * 0.30 +
        (1 - tap.age_norm) * 0.30
    )
    tone_warmth = min(1.0, max(0.0, tone_warmth))
    
    # PACING DENSITY: Content density based on tempo and other factors
    # - Fast tempo = higher density
    # - Higher discipline = can handle higher density
    # - Higher LC = can handle higher density
    tempo_factor = {"fast": 0.8, "steady": 0.5, "slow": 0.2}.get(dna.tempo, 0.5)
    pacing_density = (
        tempo_factor * 0.40 +
        dna.discipline * 0.30 +
        tap.lc * 0.30
    )
    pacing_density = min(1.0, max(0.0, pacing_density))
    
    return LPIScalars(
        # Base TAP
        age=age,
        el=el,
        age_norm=tap.age_norm,
        el_norm=tap.el_norm,
        lc=tap.lc,
        cd=tap.cd,
        ia=tap.ia,
        # DNA
        discipline=dna.discipline,
        impulse=dna.impulse,
        confidence=dna.confidence,
        tempo=dna.tempo,
        # Derived
        support_level=round(support_level, 4),
        challenge_level=round(challenge_level, 4),
        tone_warmth=round(tone_warmth, 4),
        pacing_density=round(pacing_density, 4)
    )


# =============================================================================
# LPI CONTENT TRANSFORMATION
# =============================================================================

# Substitution rules for LPI content
# Format: (original, simplified, lc_threshold)
# Applied when LC < threshold

LPI_VOCABULARY_SUBSTITUTIONS = [
    # Financial terms
    ("compound growth", "growth on growth", 0.25),
    ("compound interest", "interest on interest", 0.25),
    ("compounding", "growing over time", 0.20),
    ("portfolio", "mix of investments", 0.30),
    ("diversification", "spreading your money around", 0.25),
    ("asset allocation", "how you divide your money", 0.30),
    ("liquidity", "how easy it is to use your money", 0.30),
    ("principal", "the money you started with", 0.25),
    ("appreciation", "increase in value", 0.35),
    ("depreciation", "decrease in value", 0.35),
    ("amortization", "paying off over time", 0.30),
    ("equity", "ownership value", 0.35),
    ("liability", "what you owe", 0.30),
    ("net worth", "what you own minus what you owe", 0.25),
    ("cash flow", "money coming in and going out", 0.25),
    ("budget", "plan for your money", 0.20),
    ("expenditure", "spending", 0.35),
    ("revenue", "money coming in", 0.35),
    ("transaction", "exchange of money", 0.30),
    ("interest rate", "the cost of borrowing", 0.25),
    ("APR", "yearly interest rate", 0.30),
    ("credit score", "your money trust score", 0.25),
    ("collateral", "something you promise to give up if you can't pay", 0.25),
    ("refinancing", "getting a new loan to replace an old one", 0.30),
    
    # General simplifications
    ("subsequently", "then", 0.30),
    ("consequently", "so", 0.30),
    ("fundamentally", "basically", 0.35),
    ("significantly", "a lot", 0.25),
    ("approximately", "about", 0.30),
    ("accumulate", "build up", 0.25),
    ("allocate", "set aside", 0.30),
    ("fluctuate", "go up and down", 0.25),
    ("mitigate", "reduce", 0.35),
    ("optimize", "make better", 0.35),
    ("prioritize", "put first", 0.30),
    ("evaluate", "look at", 0.30),
    ("implement", "do", 0.30),
    ("utilize", "use", 0.40),
    ("facilitate", "help", 0.35),
]

# Tone modifiers based on tone_warmth
WARM_TONE_ADDITIONS = {
    "lesson_start": [
        (0.7, "You're doing great! "),
        (0.5, "Let's explore this together. "),
        (0.3, ""),
    ],
    "takeaway_start": [
        (0.7, "Remember: "),
        (0.5, "Key point: "),
        (0.3, ""),
    ],
}

# Support additions based on support_level
SUPPORT_TEMPLATES = {
    "example_intro": [
        (0.7, "Here's a simple example: "),
        (0.5, "For example: "),
        (0.3, "Example: "),
    ],
    "analogy_intro": [
        (0.7, "Think of it like this: "),
        (0.5, "It's similar to: "),
        (0.3, ""),
    ],
}


def transform_lpi_content(
    content: str,
    scalars: LPIScalars,
    content_type: str = "lesson"  # "lesson", "takeaway", "quiz"
) -> str:
    """
    Transform LPI content based on combined scalars (age + EL + DNA).
    
    Args:
        content: Original baseline content
        scalars: LPIScalars with all transformation parameters
        content_type: Type of content being transformed
    
    Returns:
        Transformed content
    """
    result = content
    
    # Apply vocabulary substitutions based on LC
    for original, simple, threshold in LPI_VOCABULARY_SUBSTITUTIONS:
        if scalars.lc < threshold:
            # Case-insensitive replacement preserving original case
            result = _replace_preserve_case(result, original, simple)
    
    # Apply tone warmth prefix if appropriate
    if content_type == "lesson" and scalars.tone_warmth > 0.5:
        prefix = _get_scaled_addition(WARM_TONE_ADDITIONS["lesson_start"], scalars.tone_warmth)
        if prefix:
            result = prefix + result
    
    if content_type == "takeaway" and scalars.tone_warmth > 0.3:
        prefix = _get_scaled_addition(WARM_TONE_ADDITIONS["takeaway_start"], scalars.tone_warmth)
        if prefix:
            result = prefix + result
    
    return result


def _replace_preserve_case(text: str, old: str, new: str) -> str:
    """Replace text while trying to preserve case."""
    import re
    
    def replace_match(match):
        matched = match.group(0)
        if matched.isupper():
            return new.upper()
        elif matched[0].isupper():
            return new.capitalize()
        return new
    
    pattern = re.compile(re.escape(old), re.IGNORECASE)
    return pattern.sub(replace_match, text)


def _get_scaled_addition(options: list, scalar: float) -> str:
    """Get the appropriate addition based on scalar value."""
    for threshold, text in options:
        if scalar >= threshold:
            return text
    return ""


def transform_lpi_lesson(
    lesson: Dict[str, Any],
    age: int,
    el: int,
    el_max: int,
    dna: Optional[FinancialDNA] = None
) -> Dict[str, Any]:
    """
    Transform a complete LPI lesson.
    
    Args:
        lesson: Original lesson dict with text, takeaway, etc.
        age: User's age
        el: User's Experience Level
        el_max: Maximum EL
        dna: User's Financial DNA (optional)
    
    Returns:
        Transformed lesson dict
    """
    scalars = compute_lpi_scalars(age, el, el_max, dna)
    
    transformed = lesson.copy()
    
    # Transform main text
    if "text" in transformed:
        transformed["text"] = transform_lpi_content(
            transformed["text"], scalars, "lesson"
        )
    
    # Transform takeaway
    if "takeaway" in transformed:
        transformed["takeaway"] = transform_lpi_content(
            transformed["takeaway"], scalars, "takeaway"
        )
    
    # Add transformation metadata
    transformed["_transform_meta"] = {
        "age": age,
        "el": el,
        "lc": round(scalars.lc, 4),
        "cd": round(scalars.cd, 4),
        "support_level": scalars.support_level,
        "challenge_level": scalars.challenge_level,
        "tone_warmth": scalars.tone_warmth,
        "dna_used": dna is not None
    }
    
    return transformed


# =============================================================================
# TESTING
# =============================================================================

if __name__ == "__main__":
    # Test LPI scalar computation
    print("=" * 70)
    print("LPI SCALARS: AGE + EL + DNA")
    print("=" * 70)
    
    # Test cases
    test_cases = [
        (8, 1, FinancialDNA(0.3, 0.7, 0.3, "slow", "Spontaneous"), "Child, low discipline, high impulse"),
        (8, 1, FinancialDNA(0.8, 0.2, 0.7, "fast", "Planner"), "Child, high discipline, confident"),
        (35, 3, FinancialDNA(0.5, 0.5, 0.5, "steady", "Balanced"), "Adult, balanced DNA"),
        (35, 3, FinancialDNA(0.2, 0.8, 0.3, "slow", "Spontaneous"), "Adult, impulsive, low confidence"),
        (60, 5, FinancialDNA(0.9, 0.1, 0.9, "fast", "Planner"), "Expert, highly disciplined"),
    ]
    
    for age, el, dna, label in test_cases:
        scalars = compute_lpi_scalars(age, el, 5, dna)
        print(f"\n{label}:")
        print(f"  Age={age}, EL={el}, DNA=({dna.discipline:.1f}D, {dna.impulse:.1f}I, {dna.confidence:.1f}C, {dna.tempo})")
        print(f"  LC={scalars.lc:.3f}, CD={scalars.cd:.3f}")
        print(f"  Support={scalars.support_level:.3f}, Challenge={scalars.challenge_level:.3f}")
        print(f"  Warmth={scalars.tone_warmth:.3f}, Pacing={scalars.pacing_density:.3f}")
