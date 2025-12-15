"""
Feature Flags Configuration
============================
Control feature rollout and A/B testing.

Version: 1.0
"""

import os


# TAP Version Control
USE_TAP_V2_3 = os.environ.get('USE_TAP_V2_3', 'true').lower() == 'true'

# EL_MAX Configuration (POC=5, Beta=10, Commercial=15)
EL_MAX = int(os.environ.get('EL_MAX', '15'))


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
