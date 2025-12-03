"""
Application Configuration
Single source of truth for system-wide constants
"""

# ===========================
# Age Requirements
# ===========================
# IMPORTANT: This is the ONLY place where minimum age should be defined
# All validation, filtering, and age band calculations reference this value

MINIMUM_USER_AGE = 6  # Minimum age to register and use the platform

# Age band boundaries (used by adaptive engine)
CHILD_AGE_MAX = 12    # Maximum age for "child" category
TEEN_AGE_MAX = 17     # Maximum age for "teen" category
# Ages 18+ are considered "adult"

# ===========================
# How to Change Minimum Age:
# ===========================
# 1. Change MINIMUM_USER_AGE value above
# 2. Restart backend: sudo supervisorctl restart backend
# 3. System will automatically adjust:
#    - Registration validation
#    - Age band calculations
#    - Question filtering
#    - No code changes needed elsewhere
