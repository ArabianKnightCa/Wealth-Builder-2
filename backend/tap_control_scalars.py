"""
TAP Control Scalars — Mapping PPI 24-Trait Vector to 8 CLG Controls
====================================================================

This module computes 8 continuous control scalars from the VIA 24-trait vector.
These controls influence CLG module selection and tone framing ONLY.

CRITICAL: Controls do NOT rewrite baseline text. They only select which
CLG modules (definitions, examples, analogies, framing) are applied.

Inputs:
- traits: dict {T01..T24} each float in [0,1]

Outputs:
- 8 control scalars, each in [0,1]
- dominant_traits list (top 2-4)

NO BUCKETS. NO PERSONALITY TYPES. NO TEXT REWRITING.

Version: 1.0.0
"""

from typing import Dict, List, Any
from dataclasses import dataclass


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def clamp(x: float) -> float:
    """Clamp value to [0, 1]"""
    return min(1.0, max(0.0, x))


def inv(x: float) -> float:
    """Invert value: inv(x) = 1 - x"""
    return 1.0 - x


# =============================================================================
# CONTROL SCALAR FORMULAS
# =============================================================================

@dataclass
class TAPControlScalars:
    """8 continuous control scalars for CLG module selection"""
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
    
    Args:
        traits: Dict mapping T01..T24 to float scores in [0,1]
    
    Returns:
        TAPControlScalars with 8 continuous values in [0,1]
    
    Formula Reference:
        T01=Creativity, T02=Curiosity, T03=Open-mindedness, T04=Love of Learning
        T05=Perspective, T06=Bravery, T07=Persistence, T08=Integrity/Honesty
        T09=Vitality/Zest, T10=Kindness, T11=Love, T12=Social Intelligence
        T13=Fairness, T14=Leadership, T15=Teamwork, T16=Forgiveness
        T17=Humility/Modesty, T18=Prudence, T19=Self-Regulation
        T20=Appreciation of Beauty, T21=Gratitude, T22=Hope/Optimism
        T23=Humor, T24=Spirituality
    """
    # Helper to get trait value with neutral default (0.5) for missing traits
    def t(trait_id: str) -> float:
        return traits.get(trait_id, 0.5)
    
    # =========================================================================
    # SUPPORT_NEED
    # Higher when user lacks self-regulation, prudence, persistence, perspective
    # These users need more definitions, examples, and scaffolding
    # =========================================================================
    support_need = clamp(
        0.35 * inv(t("T19")) +  # Low self-regulation → needs support
        0.25 * inv(t("T18")) +  # Low prudence → needs guidance
        0.20 * inv(t("T07")) +  # Low persistence → needs encouragement
        0.20 * inv(t("T05"))    # Low perspective → needs context
    )
    
    # =========================================================================
    # GUARDRAIL_NEED
    # Higher when user lacks prudence, self-regulation, integrity
    # These users need cautionary framing and risk awareness content
    # =========================================================================
    guardrail_need = clamp(
        0.45 * inv(t("T18")) +  # Low prudence → needs guardrails
        0.35 * inv(t("T19")) +  # Low self-regulation → needs boundaries
        0.20 * inv(t("T08"))    # Low integrity → needs ethical framing
    )
    
    # =========================================================================
    # STRUCTURE_PREFERENCE
    # Higher when user has prudence, persistence, love of learning
    # These users prefer organized, methodical content presentation
    # =========================================================================
    structure_preference = clamp(
        0.40 * t("T18") +  # High prudence → likes structure
        0.35 * t("T07") +  # High persistence → follows through on steps
        0.25 * t("T04")    # High love of learning → appreciates organization
    )
    
    # =========================================================================
    # EXPLORATION_BIAS
    # Higher when user has curiosity, creativity, open-mindedness
    # These users enjoy discovery-based and open-ended content
    # =========================================================================
    exploration_bias = clamp(
        0.40 * t("T02") +  # High curiosity → explores
        0.35 * t("T01") +  # High creativity → enjoys novelty
        0.25 * t("T03")    # High open-mindedness → tries new approaches
    )
    
    # =========================================================================
    # SOCIAL_FRAME_BIAS
    # Higher when user values kindness, love, social intelligence, teamwork
    # These users respond to relational and social framing
    # =========================================================================
    social_frame_bias = clamp(
        0.25 * t("T10") +  # Kindness
        0.25 * t("T11") +  # Love
        0.25 * t("T12") +  # Social Intelligence
        0.25 * t("T15")    # Teamwork
    )
    
    # =========================================================================
    # TONE_WARMTH
    # Higher when user values kindness, love, gratitude, optimism, humility
    # These users prefer warm, encouraging, supportive tone
    # =========================================================================
    tone_warmth = clamp(
        0.25 * t("T10") +  # Kindness
        0.20 * t("T11") +  # Love
        0.20 * t("T21") +  # Gratitude
        0.20 * t("T22") +  # Hope/Optimism
        0.15 * t("T17")    # Humility/Modesty
    )
    
    # =========================================================================
    # PACING_DENSITY
    # Higher when user has vitality, curiosity, love of learning, low prudence
    # These users can handle denser, faster-paced content
    # =========================================================================
    pacing_density = clamp(
        0.35 * t("T09") +       # High vitality → energy for dense content
        0.25 * t("T02") +       # High curiosity → wants more info
        0.25 * t("T04") +       # High love of learning → absorbs quickly
        0.15 * inv(t("T18"))    # Low prudence → less need for caution/spacing
    )
    
    # =========================================================================
    # STRETCH_APPETITE
    # Higher when user has love of learning, persistence, bravery, optimism
    # These users are eager for advanced concepts and growth challenges
    # =========================================================================
    stretch_appetite = clamp(
        0.30 * t("T04") +  # High love of learning → wants to grow
        0.25 * t("T07") +  # High persistence → will work through difficulty
        0.25 * t("T06") +  # High bravery → willing to try hard things
        0.20 * t("T22")    # High optimism → believes they can succeed
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


def controls_to_dict(controls: TAPControlScalars) -> Dict[str, float]:
    """Convert TAPControlScalars to dict"""
    return {
        "support_need": controls.support_need,
        "guardrail_need": controls.guardrail_need,
        "structure_preference": controls.structure_preference,
        "exploration_bias": controls.exploration_bias,
        "social_frame_bias": controls.social_frame_bias,
        "tone_warmth": controls.tone_warmth,
        "pacing_density": controls.pacing_density,
        "stretch_appetite": controls.stretch_appetite
    }


# =============================================================================
# DOMINANT TRAITS (from trait vector)
# =============================================================================

def compute_dominant_traits(traits: Dict[str, float]) -> List[str]:
    """
    Compute dominant traits from trait vector.
    
    Rule:
    - Take top 4 traits by score
    - Include trait if score >= max_score - 0.08
    - Returns 2-4 traits
    """
    # Sort traits by score descending
    sorted_traits = sorted(traits.items(), key=lambda x: x[1], reverse=True)
    
    if not sorted_traits:
        return []
    
    max_score = sorted_traits[0][1]
    threshold = max_score - 0.08
    
    dominant = []
    for trait_id, score in sorted_traits[:4]:
        if score >= threshold:
            dominant.append(trait_id)
    
    # Ensure at least 2 dominant traits
    if len(dominant) < 2 and len(sorted_traits) >= 2:
        dominant = [t[0] for t in sorted_traits[:2]]
    
    return dominant


# =============================================================================
# FULL OUTPUT PACKET
# =============================================================================

@dataclass
class TAPControlPacket:
    """Complete TAP control output packet"""
    traits: Dict[str, float]
    dominant_traits: List[str]
    controls: Dict[str, float]


def compute_tap_controls(traits: Dict[str, float]) -> TAPControlPacket:
    """
    Compute full TAP control packet from 24-trait vector.
    
    Args:
        traits: Dict mapping T01..T24 to float scores in [0,1]
    
    Returns:
        TAPControlPacket with traits, dominant_traits, and 8 controls
    """
    # Compute control scalars
    controls = compute_control_scalars(traits)
    
    # Compute dominant traits
    dominant = compute_dominant_traits(traits)
    
    return TAPControlPacket(
        traits=traits,
        dominant_traits=dominant,
        controls=controls_to_dict(controls)
    )


def tap_control_packet_to_dict(packet: TAPControlPacket) -> Dict[str, Any]:
    """Convert TAPControlPacket to JSON-serializable dict"""
    return {
        "traits": packet.traits,
        "dominant_traits": packet.dominant_traits,
        "controls": packet.controls
    }


# =============================================================================
# CONTROL INTERPRETATION HELPERS (for CLG module selection)
# =============================================================================

def get_clg_recommendations(controls: Dict[str, float]) -> Dict[str, Any]:
    """
    Get CLG module recommendations based on control scalars.
    
    This is used by CLG to decide which modules to apply.
    Does NOT rewrite text - only selects modules.
    """
    recommendations = {
        "add_definitions": controls["support_need"] > 0.5,
        "add_examples": controls["support_need"] > 0.4,
        "add_analogies": controls["support_need"] > 0.6,
        "add_guardrail_framing": controls["guardrail_need"] > 0.5,
        "use_structured_format": controls["structure_preference"] > 0.5,
        "add_exploration_prompts": controls["exploration_bias"] > 0.5,
        "use_social_framing": controls["social_frame_bias"] > 0.5,
        "use_warm_tone": controls["tone_warmth"] > 0.5,
        "use_dense_pacing": controls["pacing_density"] > 0.6,
        "add_stretch_content": controls["stretch_appetite"] > 0.5,
        
        # Intensity levels (for graduated application)
        "definition_intensity": "high" if controls["support_need"] > 0.7 else "medium" if controls["support_need"] > 0.4 else "low",
        "framing_intensity": "high" if controls["guardrail_need"] > 0.7 else "medium" if controls["guardrail_need"] > 0.4 else "low",
    }
    
    return recommendations


# =============================================================================
# TEST / VALIDATION
# =============================================================================

def run_control_test() -> Dict[str, Any]:
    """Run test with sample trait vectors"""
    
    # Test Case 1: Disciplined/Prudent User (high T18, T19)
    disciplined_traits = {
        "T01": 0.5, "T02": 0.4, "T03": 0.5, "T04": 0.6,
        "T05": 0.7, "T06": 0.5, "T07": 0.8, "T08": 0.7,
        "T09": 0.5, "T10": 0.5, "T11": 0.5, "T12": 0.5,
        "T13": 0.5, "T14": 0.5, "T15": 0.5, "T16": 0.5,
        "T17": 0.5, "T18": 0.85, "T19": 0.9, "T20": 0.5,
        "T21": 0.5, "T22": 0.6, "T23": 0.5, "T24": 0.5
    }
    
    # Test Case 2: Impulsive/Creative User (high T01, T02, low T18, T19)
    impulsive_traits = {
        "T01": 0.9, "T02": 0.85, "T03": 0.8, "T04": 0.5,
        "T05": 0.4, "T06": 0.7, "T07": 0.3, "T08": 0.5,
        "T09": 0.8, "T10": 0.5, "T11": 0.5, "T12": 0.6,
        "T13": 0.5, "T14": 0.5, "T15": 0.5, "T16": 0.5,
        "T17": 0.5, "T18": 0.2, "T19": 0.25, "T20": 0.5,
        "T21": 0.5, "T22": 0.7, "T23": 0.6, "T24": 0.5
    }
    
    # Test Case 3: Social/Warm User (high T10, T11, T12, T15)
    social_traits = {
        "T01": 0.5, "T02": 0.5, "T03": 0.5, "T04": 0.5,
        "T05": 0.5, "T06": 0.5, "T07": 0.5, "T08": 0.6,
        "T09": 0.5, "T10": 0.9, "T11": 0.85, "T12": 0.8,
        "T13": 0.5, "T14": 0.5, "T15": 0.75, "T16": 0.5,
        "T17": 0.7, "T18": 0.5, "T19": 0.5, "T20": 0.5,
        "T21": 0.8, "T22": 0.7, "T23": 0.5, "T24": 0.5
    }
    
    results = {}
    
    for name, traits in [
        ("disciplined_user", disciplined_traits),
        ("impulsive_user", impulsive_traits),
        ("social_user", social_traits)
    ]:
        packet = compute_tap_controls(traits)
        recommendations = get_clg_recommendations(packet.controls)
        
        results[name] = {
            "dominant_traits": packet.dominant_traits,
            "controls": packet.controls,
            "clg_recommendations": recommendations
        }
    
    return results


if __name__ == "__main__":
    import json
    results = run_control_test()
    print(json.dumps(results, indent=2))
