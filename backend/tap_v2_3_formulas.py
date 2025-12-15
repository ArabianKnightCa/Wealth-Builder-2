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
    """
    Normalize age to 0.0-1.0 range.
    
    Args:
        age: User age (continuous, no bucketing)
    
    Returns:
        age_norm: Normalized age (0.0 to 1.0)
    """
    return clamp(age / 100.0, 0.0, 1.0)


def normalize_experience(el_declared: int, el_max: int) -> float:
    """
    Normalize experience level to 0.0-1.0 range.
    
    Args:
        el_declared: User's declared experience level (1..EL_MAX)
        el_max: Maximum experience level (POC=5, Beta=10, Commercial=15)
    
    Returns:
        el_norm: Normalized experience (0.0 to 1.0)
    """
    if el_max <= 1:
        return 0.0
    return (el_declared - 1) / (el_max - 1)


def compute_language_complexity(age_norm: float, el_norm: float) -> float:
    """
    Compute Language Complexity (LC).
    
    Purpose: Controls vocabulary sophistication, sentence structure, clause density
    Dominated by: Age (65%), Experience (35%)
    Governs: Word choice, sentence length, grammatical complexity
    
    Args:
        age_norm: Normalized age (0.0 to 1.0)
        el_norm: Normalized experience (0.0 to 1.0)
    
    Returns:
        lc: Language Complexity (0.0 to 1.0)
    """
    lc = (0.65 * age_norm) + (0.35 * el_norm)
    return clamp(lc, 0.0, 1.0)


def compute_conceptual_depth(el_norm: float, age_norm: float) -> float:
    """
    Compute Conceptual Depth (CD).
    
    Purpose: Controls financial topic depth and terminology density
    Dominated by: Experience (85%), Age (15%)
    Governs: Financial concept complexity, technical terminology
    Key principle: Adults with low EL get adult language + beginner concepts
    
    Args:
        el_norm: Normalized experience (0.0 to 1.0)
        age_norm: Normalized age (0.0 to 1.0)
    
    Returns:
        cd: Conceptual Depth (0.0 to 1.0)
    """
    cd = (0.85 * el_norm) + (0.15 * age_norm)
    return clamp(cd, 0.0, 1.0)


def compute_ideological_abstraction(age_norm: float, el_norm: float) -> float:
    """
    Compute Ideological Abstraction (IA).
    
    Purpose: Controls framing, "why this matters", life-stage relevance
    Balanced: Age (50%), Experience (50%)
    Governs: Example selection, contextual framing, motivation alignment
    
    Args:
        age_norm: Normalized age (0.0 to 1.0)
        el_norm: Normalized experience (0.0 to 1.0)
    
    Returns:
        ia: Ideological Abstraction (0.0 to 1.0)
    """
    ia = (0.50 * age_norm) + (0.50 * el_norm)
    return clamp(ia, 0.0, 1.0)


def compute_stretch(el_declared: int, el_max: int) -> tuple[int, float]:
    """
    Compute stretch target (one rung above current EL).
    
    Rules:
    1. Always one rung above current level
    2. Capped at EL_MAX
    3. Never downshift
    
    Args:
        el_declared: User's declared experience level
        el_max: Maximum experience level
    
    Returns:
        tuple: (stretch_el, stretch_norm)
    """
    stretch_el = min(el_declared + 1, el_max)
    
    if el_max <= 1:
        stretch_norm = 1.0
    else:
        stretch_norm = (stretch_el - 1) / (el_max - 1)
    
    return stretch_el, stretch_norm


def compute_tap_scalars(age: int, el_declared: int, el_max: int = 15) -> TAPScalars:
    """
    Compute all TAP v2.3 scalars for a user.
    
    This is the main entry point for TAP v2.3 scalar computation.
    
    Args:
        age: User age (continuous, no bucketing)
        el_declared: User's experience level (1..EL_MAX)
        el_max: Maximum experience level (default: 15)
    
    Returns:
        TAPScalars: Complete set of TAP scalars
    """
    # Normalize
    age_norm = normalize_age(age)
    el_norm = normalize_experience(el_declared, el_max)
    
    # Core scalars
    lc = compute_language_complexity(age_norm, el_norm)
    cd = compute_conceptual_depth(el_norm, age_norm)
    ia = compute_ideological_abstraction(age_norm, el_norm)
    
    # Stretch
    stretch_el, stretch_norm = compute_stretch(el_declared, el_max)
    
    return TAPScalars(
        age=age,
        el_declared=el_declared,
        el_max=el_max,
        age_norm=age_norm,
        el_norm=el_norm,
        lc=lc,
        cd=cd,
        ia=ia,
        stretch_el=stretch_el,
        stretch_norm=stretch_norm
    )
