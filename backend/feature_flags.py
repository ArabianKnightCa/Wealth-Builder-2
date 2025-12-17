"""
Feature Flags Configuration
============================
Control feature rollout and A/B testing.

Version: 1.1 (TAP v2.3.1)
"""

import os


# TAP Version Control
USE_TAP_V2_3 = os.environ.get('USE_TAP_V2_3', 'true').lower() == 'true'

# EL_MAX Configuration (POC=5, Beta=10, Commercial=15)
EL_MAX = int(os.environ.get('EL_MAX', '15'))

# TAP v2.3.1 Pipeline Flags
USE_SAFE_REWRITE_PIPELINE = os.environ.get('USE_SAFE_REWRITE_PIPELINE', 'true').lower() == 'true'
USE_LLM_REWRITE_LAYER = os.environ.get('USE_LLM_REWRITE_LAYER', 'false').lower() == 'true'
LLM_REWRITE_ONLY_ON_RISK = os.environ.get('LLM_REWRITE_ONLY_ON_RISK', 'true').lower() == 'true'


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
