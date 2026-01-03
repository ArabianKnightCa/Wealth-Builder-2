"""
TAP v2.3 AE Integration
=======================
Adaptive Engine state integration for scaffolding adjustments.
AE CANNOT change core scalars (EL, CD, stretch).

Version: 2.3
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class AEStatePacket:
    """
    Adaptive Engine state packet.
    
    These values affect HOW content is delivered,
    but NOT WHAT level of content is delivered.
    """
    friction: float = 0.0         # 0.0 (smooth) to 1.0 (struggling)
    momentum: float = 0.0         # 0.0 (low) to 1.0 (high progress)
    exposure: int = 0             # Number of times user has seen this content
    confidence_band: float = 0.5  # 0.0 (uncertain) to 1.0 (confident)
    rolling_mastery: Optional[float] = None  # 0.0 to 1.0 if available


class AEModifier:
    """
    Apply AE-driven modifications to content delivery.
    
    CRITICAL: AE modifiers ONLY affect scaffolding, pacing, and examples.
    They NEVER change EL_declared, CD, IA, or stretch_norm.
    """
    
    def should_add_extra_examples(self, ae_state: AEStatePacket) -> bool:
        """
        Determine if extra examples should be added.
        
        Triggers:
        - High friction (struggling)
        - First exposure
        
        Args:
            ae_state: AE state packet
        
        Returns:
            bool: True if extra examples needed
        """
        return ae_state.friction > 0.6 or ae_state.exposure == 1
    
    def should_add_clarifiers(self, ae_state: AEStatePacket) -> bool:
        """
        Determine if inline clarifiers should be added.
        
        Triggers:
        - High friction
        - Low confidence
        
        Args:
            ae_state: AE state packet
        
        Returns:
            bool: True if clarifiers needed
        """
        return ae_state.friction > 0.6 or ae_state.confidence_band < 0.4
    
    def should_slow_pacing(self, ae_state: AEStatePacket) -> bool:
        """
        Determine if pacing should be slowed.
        
        Triggers:
        - High friction
        - Low momentum
        
        Args:
            ae_state: AE state packet
        
        Returns:
            bool: True if pacing should be slowed
        """
        return ae_state.friction > 0.6 or ae_state.momentum < 0.3
    
    def should_compress(self, ae_state: AEStatePacket) -> bool:
        """
        Determine if content should be compressed.
        
        Triggers:
        - High momentum
        - High confidence
        - Multiple exposures
        
        Args:
            ae_state: AE state packet
        
        Returns:
            bool: True if content should be compressed
        """
        return (ae_state.momentum > 0.7 and 
                ae_state.confidence_band > 0.7 and 
                ae_state.exposure > 2)
    
    def get_example_count(self, ae_state: AEStatePacket, base_count: int = 1) -> int:
        """
        Determine how many examples to provide.
        
        Args:
            ae_state: AE state packet
            base_count: Base number of examples
        
        Returns:
            int: Adjusted example count
        """
        if ae_state.friction > 0.6:
            # High friction: Add 1-2 more examples
            return base_count + 2
        elif ae_state.exposure == 1:
            # First exposure: Add 1 more example
            return base_count + 1
        elif self.should_compress(ae_state):
            # High performance: Reduce examples
            return max(0, base_count - 1)
        else:
            return base_count
    
    def apply_modifications(self, text: str, ae_state: AEStatePacket) -> str:
        """
        Apply AE-driven modifications to text.
        
        Args:
            text: Input text
            ae_state: AE state packet
        
        Returns:
            str: Modified text
        """
        # High friction: Add reinforcement
        if ae_state.friction > 0.6:
            if not text.endswith('.'):
                text += '.'
            text += " It's important to understand this concept."
        
        # First exposure: Add "For example" bridge
        if ae_state.exposure == 1 and 'example' not in text.lower():
            text += " For example, this helps you make better financial decisions."
        
        # High momentum + confidence: Keep concise
        if self.should_compress(ae_state):
            # Remove redundant phrases (simplified for now)
            pass
        
        return text


# Singleton instance
_ae_modifier = None


def get_ae_modifier() -> AEModifier:
    """Get singleton AEModifier instance."""
    global _ae_modifier
    if _ae_modifier is None:
        _ae_modifier = AEModifier()
    return _ae_modifier
