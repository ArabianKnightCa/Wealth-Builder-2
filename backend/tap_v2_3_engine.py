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
