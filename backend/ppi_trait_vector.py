"""
PPI → 24 Trait Vector System (Option A: Trait Tags + Shared Weight Templates)
==============================================================================

This module computes a deterministic 24-trait vector from PPI answers without
creating per-question weight bloat.

Each question has:
- primary_trait: T01..T24 (required)
- secondary_trait: T01..T24 (optional)
- polarity: "normal" or "reverse"
- intensity: "light" | "medium" | "heavy"

Shared templates convert these tags into weights.
Output is a deterministic 24-trait vector (0.0–1.0 each), plus a stability score.

NO BUCKETS. NO PARAPHRASING. DETERMINISTIC ONLY.

Version: 1.0.0
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from enum import Enum


# =============================================================================
# TRAIT REGISTRY (LOCKED)
# =============================================================================

class Trait(Enum):
    """24 Character Strengths/Traits from VIA Classification"""
    T01 = "Creativity"
    T02 = "Curiosity"
    T03 = "Open-mindedness"
    T04 = "Love of Learning"
    T05 = "Perspective"
    T06 = "Bravery"
    T07 = "Persistence"
    T08 = "Integrity/Honesty"
    T09 = "Vitality/Zest"
    T10 = "Kindness"
    T11 = "Love"
    T12 = "Social Intelligence"
    T13 = "Fairness"
    T14 = "Leadership"
    T15 = "Teamwork"
    T16 = "Forgiveness"
    T17 = "Humility/Modesty"
    T18 = "Prudence"
    T19 = "Self-Regulation/Self-Control"
    T20 = "Appreciation of Beauty & Excellence"
    T21 = "Gratitude"
    T22 = "Hope/Optimism"
    T23 = "Humor"
    T24 = "Spirituality/Religiousness"


# All trait IDs for iteration
ALL_TRAIT_IDS = [f"T{i:02d}" for i in range(1, 25)]

# Trait ID to name mapping
TRAIT_NAMES = {t.name: t.value for t in Trait}


# =============================================================================
# INTENSITY WEIGHT TEMPLATES (SHARED - NOT PER QUESTION)
# =============================================================================

@dataclass
class WeightTemplate:
    """Shared weight template for intensity levels"""
    w1: float  # Primary trait weight
    w2: float  # Secondary trait weight (if present)


INTENSITY_TEMPLATES: Dict[str, WeightTemplate] = {
    "light": WeightTemplate(w1=0.70, w2=0.30),
    "medium": WeightTemplate(w1=0.80, w2=0.20),
    "heavy": WeightTemplate(w1=0.90, w2=0.10),
}


# =============================================================================
# ANSWER NORMALIZATION
# =============================================================================

# A/B/C/D → [0.0, 1.0] mapping
ANSWER_VALUES = {
    "A": 0.00,
    "B": 0.33,
    "C": 0.67,
    "D": 1.00,
}


def normalize_answer(answer: str, polarity: str) -> float:
    """
    Normalize answer to [0.0, 1.0] with polarity adjustment.
    
    Args:
        answer: "A", "B", "C", or "D"
        polarity: "normal" or "reverse"
    
    Returns:
        float: Normalized value in [0.0, 1.0]
    """
    # Get base value
    answer_key = answer.upper().strip()
    if answer_key not in ANSWER_VALUES:
        # Handle "A Research extensively..." format
        answer_key = answer_key[0] if answer_key else "B"
    
    v = ANSWER_VALUES.get(answer_key, 0.5)  # Default to middle if unknown
    
    # Apply polarity
    if polarity == "reverse":
        v = 1.0 - v
    
    return v


# =============================================================================
# PPI QUESTION TRAIT TAGS (POC 20 QUESTIONS)
# =============================================================================

# This maps each PPI question to its trait tags
# These should ideally be stored in the database, but we define them here
# for the POC implementation

PPI_TRAIT_TAGS: Dict[str, Dict[str, Any]] = {
    "PPI_Q01": {
        # "When making financial decisions, I prefer to:"
        # A=Research, B=Gut, C=Ask others, D=Follow experts
        "primary_trait": "T18",    # Prudence
        "secondary_trait": "T02",  # Curiosity
        "polarity": "normal",      # A (research) = high prudence
        "intensity": "medium"
    },
    "PPI_Q02": {
        # "My approach to saving money is:"
        # A=Fixed amount, B=Whatever left, C=Specific goals, D=Struggle
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": "T07",  # Persistence
        "polarity": "normal",      # A (fixed amount) = high self-regulation
        "intensity": "heavy"
    },
    "PPI_Q03": {
        # "When I think about my financial future, I feel:"
        # A=Excited, B=Anxious, C=Uncertain hopeful, D=Confident
        "primary_trait": "T22",    # Hope/Optimism
        "secondary_trait": "T06",  # Bravery
        "polarity": "normal",      # A (excited) = high optimism
        "intensity": "medium"
    },
    "PPI_Q04": {
        # "I track my spending:"
        # A=Daily/weekly, B=Monthly, C=Rarely, D=Only when worried
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": "T18",  # Prudence
        "polarity": "normal",      # A (daily) = high self-regulation
        "intensity": "heavy"
    },
    "PPI_Q05": {
        # "My biggest financial priority right now is:"
        # A=Emergency fund, B=Paying debt, C=Specific goal, D=Budget better
        "primary_trait": "T18",    # Prudence
        "secondary_trait": "T05",  # Perspective
        "polarity": "normal",      # All answers show prudent thinking
        "intensity": "light"
    },
    "PPI_Q06": {
        # "When I receive unexpected money, I usually:"
        # A=Save it, B=Spend on want, C=Split, D=Pay bills
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": "T18",  # Prudence
        "polarity": "normal",      # A (save) = high self-regulation
        "intensity": "medium"
    },
    "PPI_Q07": {
        # "I learn best through:"
        # A=Reading, B=Hands-on, C=Videos, D=Discussion
        "primary_trait": "T04",    # Love of Learning
        "secondary_trait": "T02",  # Curiosity
        "polarity": "normal",      # All answers show learning engagement
        "intensity": "light"
    },
    "PPI_Q08": {
        # "My relationship with credit cards is:"
        # A=Responsible, B=Avoid, C=Sometimes balance, D=Struggle
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": "T18",  # Prudence
        "polarity": "normal",      # A (responsible) = high self-regulation
        "intensity": "heavy"
    },
    "PPI_Q09": {
        # "When setting financial goals, I prefer:"
        # A=Detailed plans, B=General direction, C=Short-term, D=Long-term flex
        "primary_trait": "T18",    # Prudence
        "secondary_trait": "T07",  # Persistence
        "polarity": "normal",      # A (detailed) = high prudence
        "intensity": "medium"
    },
    "PPI_Q10": {
        # "Financial stress affects me by:"
        # A=More motivated, B=Avoid, C=Impacts mood, D=Not much stress
        "primary_trait": "T22",    # Hope/Optimism
        "secondary_trait": "T09",  # Vitality/Zest
        "polarity": "normal",      # A (motivated) = high optimism
        "intensity": "medium"
    },
    "PPI_Q11": {
        # "I would describe my spending habits as:"
        # A=Disciplined, B=Mostly controlled, C=Impulsive, D=Emotional
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": None,
        "polarity": "normal",      # A (disciplined) = high self-regulation
        "intensity": "heavy"
    },
    "PPI_Q12": {
        # "My knowledge of investing is:"
        # A=Strong, B=Basic, C=Limited, D=None
        "primary_trait": "T04",    # Love of Learning
        "secondary_trait": "T06",  # Bravery
        "polarity": "normal",      # A (strong) = high learning engagement
        "intensity": "medium"
    },
    "PPI_Q13": {
        # "When facing a financial setback, I:"
        # A=Quickly adjust, B=Discouraged but recover, C=Need support, D=Difficult
        "primary_trait": "T07",    # Persistence
        "secondary_trait": "T22",  # Hope/Optimism
        "polarity": "normal",      # A (adjust) = high persistence
        "intensity": "heavy"
    },
    "PPI_Q14": {
        # "I prefer to make purchases:"
        # A=After comparison, B=Good deal, C=When need, D=Impulsively
        "primary_trait": "T18",    # Prudence
        "secondary_trait": "T19",  # Self-Regulation
        "polarity": "normal",      # A (comparison) = high prudence
        "intensity": "medium"
    },
    "PPI_Q15": {
        # "My comfort level with financial risk is:"
        # A=High, B=Moderate, C=Low, D=Very low
        "primary_trait": "T06",    # Bravery
        "secondary_trait": "T03",  # Open-mindedness
        "polarity": "normal",      # A (high risk) = high bravery
        "intensity": "medium"
    },
    "PPI_Q16": {
        # "I talk about money with friends/family:"
        # A=Openly, B=Occasionally, C=Rarely, D=Never
        "primary_trait": "T12",    # Social Intelligence
        "secondary_trait": "T08",  # Integrity/Honesty
        "polarity": "normal",      # A (openly) = high social intelligence
        "intensity": "light"
    },
    "PPI_Q17": {
        # "My biggest financial challenge is:"
        # A=Not earning enough, B=Controlling spending, C=Understanding, D=Motivation
        "primary_trait": "T07",    # Persistence
        "secondary_trait": "T04",  # Love of Learning
        "polarity": "reverse",     # D (motivation) indicates need for persistence
        "intensity": "medium"
    },
    "PPI_Q18": {
        # "When planning my budget, I:"
        # A=Detailed spreadsheets, B=Mental estimate, C=Simple system, D=Don't budget
        "primary_trait": "T18",    # Prudence
        "secondary_trait": "T19",  # Self-Regulation
        "polarity": "normal",      # A (detailed) = high prudence
        "intensity": "heavy"
    },
    "PPI_Q19": {
        # "I would describe my financial personality as:"
        # A=Planner/saver, B=Balanced, C=Spontaneous, D=Figuring out
        "primary_trait": "T19",    # Self-Regulation
        "secondary_trait": "T18",  # Prudence
        "polarity": "normal",      # A (planner) = high self-regulation
        "intensity": "heavy"
    },
    "PPI_Q20": {
        # "My motivation for improving financial literacy is:"
        # A=Goals, B=Reduce stress, C=Build wealth, D=Confidence
        "primary_trait": "T22",    # Hope/Optimism
        "secondary_trait": "T07",  # Persistence
        "polarity": "normal",      # All answers show positive motivation
        "intensity": "light"
    },
}


# =============================================================================
# TRAIT VECTOR COMPUTATION (DETERMINISTIC)
# =============================================================================

@dataclass
class TraitVectorOutput:
    """Output packet from PPI trait vector computation"""
    ppi_version: str
    traits: Dict[str, float]  # T01-T24 → 0.0-1.0
    dominant_traits: List[str]  # Top 2-4 traits
    stability: float  # 0.0-1.0 confidence score
    raw_coverage: Dict[str, int]  # How many questions covered each trait


def compute_trait_vector(
    answers: List[Dict[str, str]],
    total_questions: int = 20
) -> TraitVectorOutput:
    """
    Compute 24-trait vector from PPI answers.
    
    Args:
        answers: List of {"question_id": "PPI_Q01", "selected_option": "A"}
        total_questions: Total questions in the PPI (for stability calc)
    
    Returns:
        TraitVectorOutput with trait scores, dominant traits, and stability
    """
    # Initialize accumulators for all 24 traits
    numerator: Dict[str, float] = {t: 0.0 for t in ALL_TRAIT_IDS}
    denominator: Dict[str, float] = {t: 0.0 for t in ALL_TRAIT_IDS}
    coverage: Dict[str, int] = {t: 0 for t in ALL_TRAIT_IDS}
    
    answered_count = 0
    
    for answer in answers:
        q_id = answer.get("question_id", "")
        selected = answer.get("selected_option", "")
        
        # Get trait tags for this question
        trait_tags = PPI_TRAIT_TAGS.get(q_id)
        if not trait_tags:
            continue
        
        answered_count += 1
        
        # Get normalized answer value with polarity adjustment
        v_star = normalize_answer(selected, trait_tags["polarity"])
        
        # Get weight template from intensity
        intensity = trait_tags.get("intensity", "medium")
        template = INTENSITY_TEMPLATES.get(intensity, INTENSITY_TEMPLATES["medium"])
        
        primary_trait = trait_tags["primary_trait"]
        secondary_trait = trait_tags.get("secondary_trait")
        
        # Determine weights
        if secondary_trait:
            w1 = template.w1
            w2 = template.w2
        else:
            w1 = 1.0
            w2 = 0.0
        
        # Add contributions to primary trait
        numerator[primary_trait] += w1 * v_star
        denominator[primary_trait] += w1
        coverage[primary_trait] += 1
        
        # Add contributions to secondary trait if present
        if secondary_trait:
            numerator[secondary_trait] += w2 * v_star
            denominator[secondary_trait] += w2
            coverage[secondary_trait] += 1
    
    # Compute final trait scores
    traits: Dict[str, float] = {}
    for t in ALL_TRAIT_IDS:
        if denominator[t] > 0:
            score = numerator[t] / denominator[t]
            # Clamp to [0.0, 1.0]
            traits[t] = round(max(0.0, min(1.0, score)), 4)
        else:
            # Neutral default for uncovered traits
            traits[t] = 0.5
    
    # Compute dominant traits (deterministic rule)
    # Top 4 by score, include if score >= max_score - 0.08
    sorted_traits = sorted(traits.items(), key=lambda x: x[1], reverse=True)
    max_score = sorted_traits[0][1] if sorted_traits else 0.5
    threshold = max_score - 0.08
    
    dominant_traits = []
    for trait_id, score in sorted_traits[:4]:
        if score >= threshold:
            dominant_traits.append(trait_id)
    
    # Ensure at least 2 dominant traits
    if len(dominant_traits) < 2:
        dominant_traits = [t[0] for t in sorted_traits[:2]]
    
    # Compute stability score
    stability = round(answered_count / total_questions, 4) if total_questions > 0 else 0.0
    stability = max(0.0, min(1.0, stability))
    
    return TraitVectorOutput(
        ppi_version="POC_20Q_OPTION_A",
        traits=traits,
        dominant_traits=dominant_traits,
        stability=stability,
        raw_coverage=coverage
    )


def trait_vector_to_dict(output: TraitVectorOutput) -> Dict[str, Any]:
    """Convert TraitVectorOutput to JSON-serializable dict (API contract)"""
    return {
        "ppi_version": output.ppi_version,
        "traits": output.traits,
        "dominant_traits": output.dominant_traits,
        "stability": output.stability
    }


def get_trait_name(trait_id: str) -> str:
    """Get human-readable trait name from ID"""
    return TRAIT_NAMES.get(trait_id, trait_id)


def get_trait_summary(output: TraitVectorOutput) -> Dict[str, Any]:
    """Get a human-readable summary of the trait vector"""
    dominant_names = [
        f"{tid}: {get_trait_name(tid)} ({output.traits[tid]:.2f})"
        for tid in output.dominant_traits
    ]
    
    # Find lowest traits for contrast
    sorted_traits = sorted(output.traits.items(), key=lambda x: x[1])
    lowest_traits = [
        f"{tid}: {get_trait_name(tid)} ({score:.2f})"
        for tid, score in sorted_traits[:3]
    ]
    
    return {
        "dominant_traits": dominant_names,
        "growth_areas": lowest_traits,
        "stability": f"{output.stability:.0%}",
        "traits_covered": sum(1 for c in output.raw_coverage.values() if c > 0)
    }


# =============================================================================
# TEST/VALIDATION
# =============================================================================

def run_sample_test() -> Dict[str, Any]:
    """Run a sample test with mock answers"""
    # Simulate a user who answers mostly A's (disciplined/prudent profile)
    sample_answers = [
        {"question_id": "PPI_Q01", "selected_option": "A"},
        {"question_id": "PPI_Q02", "selected_option": "A"},
        {"question_id": "PPI_Q03", "selected_option": "A"},
        {"question_id": "PPI_Q04", "selected_option": "A"},
        {"question_id": "PPI_Q05", "selected_option": "A"},
        {"question_id": "PPI_Q06", "selected_option": "A"},
        {"question_id": "PPI_Q07", "selected_option": "B"},
        {"question_id": "PPI_Q08", "selected_option": "A"},
        {"question_id": "PPI_Q09", "selected_option": "A"},
        {"question_id": "PPI_Q10", "selected_option": "A"},
        {"question_id": "PPI_Q11", "selected_option": "A"},
        {"question_id": "PPI_Q12", "selected_option": "B"},
        {"question_id": "PPI_Q13", "selected_option": "A"},
        {"question_id": "PPI_Q14", "selected_option": "A"},
        {"question_id": "PPI_Q15", "selected_option": "B"},
        {"question_id": "PPI_Q16", "selected_option": "A"},
        {"question_id": "PPI_Q17", "selected_option": "C"},
        {"question_id": "PPI_Q18", "selected_option": "A"},
        {"question_id": "PPI_Q19", "selected_option": "A"},
        {"question_id": "PPI_Q20", "selected_option": "C"},
    ]
    
    result = compute_trait_vector(sample_answers)
    
    return {
        "test_type": "sample_disciplined_user",
        "answers_count": len(sample_answers),
        "output_packet": trait_vector_to_dict(result),
        "summary": get_trait_summary(result)
    }


if __name__ == "__main__":
    import json
    result = run_sample_test()
    print(json.dumps(result, indent=2))
