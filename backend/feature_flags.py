"""
Feature Flags Configuration
============================
Control feature rollout and A/B testing.

Version: 5.0 (TAP 5.0 Only)
"""

import os


# TAP 5.0 is the ONLY active version
# All old TAP versions (2.3, 3.0, 3.2, 3.2.4) have been removed


# EL_MAX Configuration (POC=5, Beta=10, Commercial=15)
EL_MAX = int(os.environ.get('EL_MAX', '5'))


def get_el_max() -> int:
    """
    Get the maximum experience level.
    
    Returns:
        int: EL_MAX value (5 for POC, 15 for commercial)
    """
    return EL_MAX
