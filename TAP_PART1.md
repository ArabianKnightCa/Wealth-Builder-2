# TAP v2.3.1 - PART 1 OF 2

## Overview
TAP (Text Adaptation Processor) v2.3.1 - Formula-driven text adaptation system for financial education content.

### Key Principles:
- ❌ NO age buckets (age is continuous 6-99)
- ❌ NO experience buckets (EL is discrete rungs 1-5 for POC)
- ✅ Formula-based transformations using LC, CD, IA scalars
- ✅ Grammar-safe rewrite pipeline with validation

---

## Configuration (.env)

```bash
# TAP Settings
USE_TAP_V2_3=true
EL_MAX=5
USE_SAFE_REWRITE_PIPELINE=true
USE_LLM_REWRITE_LAYER=false
LLM_REWRITE_ONLY_ON_RISK=true
```

---

## Core Formulas

### Normalization
```
age_norm = age / 100.0
el_norm = (EL_declared - 1) / (EL_MAX - 1)
```

### Core Scalars
```
LC (Language Complexity)     = (0.65 × age_norm) + (0.35 × el_norm)
CD (Conceptual Depth)        = (0.85 × el_norm) + (0.15 × age_norm)
IA (Ideological Abstraction) = (0.50 × age_norm) + (0.50 × el_norm)
```

### Stretch (Growth Engine)
```
stretch_EL = min(EL_declared + 1, EL_MAX)
stretch_norm = (stretch_EL - 1) / (EL_MAX - 1)
```

---

## Test Results (EL_MAX=5, POC)

| Age | EL | LC    | CD    | IA    | Description |
|-----|----| ------|-------|-------|-------------|
| 6   | 1  | 0.039 | 0.009 | 0.030 | Child beginner - very simple language, basic concepts |
| 18  | 2  | 0.204 | 0.239 | 0.215 | Teen beginner-intermediate |
| 35  | 3  | 0.402 | 0.477 | 0.425 | Adult intermediate |
| 55  | 4  | 0.620 | 0.720 | 0.650 | Mature advanced |
| 75  | 5  | 0.838 | 0.962 | 0.875 | Senior guru/expert - sophisticated language + expert concepts |

---

## FILE 1: feature_flags.py

```python
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
    """Check if TAP v2.3 is enabled."""
    return USE_TAP_V2_3


def get_el_max() -> int:
    """Get the maximum experience level."""
    return EL_MAX


def use_safe_rewrite_pipeline() -> bool:
    """Check if safe rewrite pipeline is enabled."""
    return USE_SAFE_REWRITE_PIPELINE


def use_llm_rewrite_layer() -> bool:
    """Check if LLM rewrite layer is enabled."""
    return USE_LLM_REWRITE_LAYER


def llm_rewrite_only_on_risk() -> bool:
    """Check if LLM should only be used for high-risk rewrites."""
    return LLM_REWRITE_ONLY_ON_RISK
```

---

## FILE 2: tap_v2_3_formulas.py

```python
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
```

---

## FILE 3: tap_v2_3_engine.py

```python
"""
TAP v2.3 Main Engine
====================
Complete TAP v2.3 implementation integrating all components.

Version: 2.3
"""

from typing import Dict, Any, Optional, List
from tap_v2_3_formulas import compute_tap_scalars, TAPScalars
from tap_v2_3_templates import ContentTemplate, ContentBlock
from tap_v2_3_language import get_language_shaper
from tap_v2_3_1_language import get_safe_rewrite_pipeline
from tap_v2_3_ae_integration import AEStatePacket, get_ae_modifier
from feature_flags import use_safe_rewrite_pipeline


class TAPv23Engine:
    """
    TAP v2.3 Engine
    
    Formula-driven, deterministic text adaptation.
    NO age buckets, NO experience buckets, NO synonym replacement.
    """
    
    VERSION = "2.3"
    
    def __init__(self):
        self.language_shaper = get_language_shaper()
        self.safe_pipeline = get_safe_rewrite_pipeline()
        self.ae_modifier = get_ae_modifier()
    
    def transform_content(
        self,
        baseline_text: str,
        user_age: int,
        user_experience_level: int,
        el_max: int = 15,
        ae_state: Optional[AEStatePacket] = None,
        apply_language_shaping: bool = True
    ) -> str:
        """
        Transform content for a specific user.
        
        Args:
            baseline_text: Canonical baseline content
            user_age: User's age (continuous, no bucketing)
            user_experience_level: User's EL (1..EL_MAX)
            el_max: Maximum experience level (default: 15)
            ae_state: Optional AE state packet
            apply_language_shaping: Whether to apply LC-based shaping
        
        Returns:
            str: Transformed content
        """
        # Compute TAP scalars
        scalars = compute_tap_scalars(user_age, user_experience_level, el_max)
        
        # Start with baseline
        text = baseline_text
        
        # Apply language shaping if requested
        if apply_language_shaping:
            # Use safe rewrite pipeline if enabled (v2.3.1)
            if use_safe_rewrite_pipeline():
                text = self.safe_pipeline.process(text, scalars)
            else:
                # Legacy language shaper (v2.3.0)
                text = self.language_shaper.shape_text(text, scalars)
        
        # Apply AE modifications if provided
        if ae_state:
            text = self.ae_modifier.apply_modifications(text, ae_state)
        
        return text
    
    def transform_with_template(
        self,
        template: ContentTemplate,
        user_age: int,
        user_experience_level: int,
        el_max: int = 15,
        ae_state: Optional[AEStatePacket] = None,
        apply_language_shaping: bool = True
    ) -> str:
        """
        Transform content using a block-based template.
        
        Args:
            template: Content template with blocks
            user_age: User's age
            user_experience_level: User's EL
            el_max: Maximum experience level
            ae_state: Optional AE state packet
            apply_language_shaping: Whether to apply LC-based shaping
        
        Returns:
            str: Rendered content
        """
        # Compute TAP scalars
        scalars = compute_tap_scalars(user_age, user_experience_level, el_max)
        
        # Render template with progressive reveal
        text = template.render(scalars)
        
        # Apply language shaping if requested
        if apply_language_shaping:
            text = self.language_shaper.shape_text(text, scalars)
        
        # Apply AE modifications if provided
        if ae_state:
            text = self.ae_modifier.apply_modifications(text, ae_state)
        
        return text
    
    def get_user_scalars(
        self,
        user_age: int,
        user_experience_level: int,
        el_max: int = 15
    ) -> Dict[str, Any]:
        """
        Get TAP scalars for a user (useful for debugging/monitoring).
        
        Args:
            user_age: User's age
            user_experience_level: User's EL
            el_max: Maximum experience level
        
        Returns:
            dict: TAP scalars as dictionary
        """
        scalars = compute_tap_scalars(user_age, user_experience_level, el_max)
        
        return {
            "age": scalars.age,
            "el_declared": scalars.el_declared,
            "el_max": scalars.el_max,
            "age_norm": round(scalars.age_norm, 4),
            "el_norm": round(scalars.el_norm, 4),
            "lc": round(scalars.lc, 4),
            "cd": round(scalars.cd, 4),
            "ia": round(scalars.ia, 4),
            "stretch_el": scalars.stretch_el,
            "stretch_norm": round(scalars.stretch_norm, 4)
        }


# Singleton instance
_tap_v23_engine = None


def get_tap_v23_engine() -> TAPv23Engine:
    """Get singleton TAP v2.3 Engine instance."""
    global _tap_v23_engine
    if _tap_v23_engine is None:
        _tap_v23_engine = TAPv23Engine()
    return _tap_v23_engine
```

---

## Usage Example

```python
from tap_v2_3_engine import get_tap_v23_engine

# Get engine instance
engine = get_tap_v23_engine()

# Transform content for a 35-year-old with intermediate experience (EL 3)
result = engine.transform_content(
    baseline_text="Financial literacy is the ability to understand and effectively use various financial skills.",
    user_age=35,
    user_experience_level=3,
    el_max=5
)

print(result)
# Output: Age-appropriate transformation with adult language + intermediate concepts

# Get user's TAP scalars for debugging
scalars = engine.get_user_scalars(user_age=35, user_experience_level=3, el_max=5)
print(scalars)
# Output: {'age': 35, 'el_declared': 3, 'lc': 0.4025, 'cd': 0.4775, 'ia': 0.4250, ...}
```

---

END OF PART 1

**Continue to PART 2 for:**
- tap_v2_3_1_language.py (Grammar-safe pipeline - 590+ lines)
- tap_v2_3_ae_integration.py (AE state integration)
- tap_v2_3_templates.py (Block-based templates)
- Current status and known issues
