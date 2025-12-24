"""
Feature Flags Configuration
============================
Control feature rollout and A/B testing.

Version: 1.2 (TAP 3.0)
"""

import os


# TAP Version Control
# TAP 3.0 is the NEW clean-room implementation (default: enabled)
USE_TAP_V3_0 = os.environ.get('USE_TAP_V3_0', 'true').lower() == 'true'

# Legacy TAP v2.3 (used as fallback if TAP 3.0 is disabled)
USE_TAP_V2_3 = os.environ.get('USE_TAP_V2_3', 'true').lower() == 'true'

# EL_MAX Configuration (POC=5, Beta=10, Commercial=15)
EL_MAX = int(os.environ.get('EL_MAX', '15'))

# TAP v2.3.1 Pipeline Flags
USE_SAFE_REWRITE_PIPELINE = os.environ.get('USE_SAFE_REWRITE_PIPELINE', 'true').lower() == 'true'
USE_LLM_REWRITE_LAYER = os.environ.get('USE_LLM_REWRITE_LAYER', 'false').lower() == 'true'
LLM_REWRITE_ONLY_ON_RISK = os.environ.get('LLM_REWRITE_ONLY_ON_RISK', 'true').lower() == 'true'

# CLG (Controlled Language Generator) - Grammar-safe realization layer
USE_CLG_ENGINE = os.environ.get('USE_CLG_ENGINE', 'true').lower() == 'true'


def is_tap_v2_3_enabled() -> bool:
    """
    Check if TAP v2.3 is enabled.
    
    Returns:
        bool: True if TAP v2.3 should be used
    """
    return USE_TAP_V2_3


def get_el_max() -> int:
    """
    Get the maximum experience level.
    
    Returns:
        int: EL_MAX value
    """
    return EL_MAX


def use_safe_rewrite_pipeline() -> bool:
    """
    Check if safe rewrite pipeline is enabled.
    
    Returns:
        bool: True if pipeline should be used
    """
    return USE_SAFE_REWRITE_PIPELINE


def use_llm_rewrite_layer() -> bool:
    """
    Check if LLM rewrite layer is enabled.
    
    Returns:
        bool: True if LLM repair should be used
    """
    return USE_LLM_REWRITE_LAYER


def llm_rewrite_only_on_risk() -> bool:
    """
    Check if LLM should only be used for high-risk rewrites.
    
    Returns:
        bool: True if LLM should only trigger on risk
    """
    return LLM_REWRITE_ONLY_ON_RISK


def use_clg_engine() -> bool:
    """
    Check if CLG (Controlled Language Generator) is enabled.
    
    CLG is the grammar-safe realization layer that uses:
    - Phrase Bank Matrix (approved phrases by concept)
    - Sentence Template Library (grammar-safe frames)
    - Slot fill + assembly (NO paraphrasing)
    
    Returns:
        bool: True if CLG should be used
    """
    return USE_CLG_ENGINE


def is_tap_v3_0_enabled() -> bool:
    """
    Check if TAP 3.0 is enabled.
    
    TAP 3.0 is the clean-room implementation that:
    - NEVER rewrites baseline text (immutable)
    - Only ADDS scaffolding (definitions, examples, analogies)
    - Uses continuous formulas (no buckets/bands)
    - Respects Cognitive Load Span (CLS)
    
    Returns:
        bool: True if TAP 3.0 should be used
    """
    return USE_TAP_V3_0
