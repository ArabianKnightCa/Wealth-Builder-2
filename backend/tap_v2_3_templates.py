"""
TAP v2.3 Template System
========================
Granular block-based templates with numeric thresholds.
Progressive reveal based on user scalars.

Version: 2.3
"""

from dataclasses import dataclass, field
from typing import List, Literal
from tap_v2_3_formulas import TAPScalars


BlockType = Literal["concept", "ideology", "stretch"]


@dataclass
class ContentBlock:
    """
    A single content block with threshold-based reveal.
    """
    type: BlockType
    threshold: float  # 0.0 to 1.0
    text: str
    
    def should_include(self, scalars: TAPScalars) -> bool:
        """
        Determine if this block should be included based on user scalars.
        
        Rules:
        - concept blocks: Include if threshold <= CD
        - ideology blocks: Include if threshold <= IA
        - stretch blocks: Include if threshold <= stretch_norm AND stretch_norm > CD
        
        Args:
            scalars: User's TAP scalars
        
        Returns:
            bool: True if block should be included
        """
        if self.type == "concept":
            return self.threshold <= scalars.cd
        
        elif self.type == "ideology":
            return self.threshold <= scalars.ia
        
        elif self.type == "stretch":
            # Stretch blocks require two conditions
            return (self.threshold <= scalars.stretch_norm and 
                    scalars.stretch_norm > scalars.cd)
        
        return False


@dataclass
class ContentTemplate:
    """
    A complete content template with multiple blocks.
    """
    topic_id: str
    baseline_question: str
    blocks: List[ContentBlock] = field(default_factory=list)
    
    def get_included_blocks(self, scalars: TAPScalars) -> List[ContentBlock]:
        """
        Get all blocks that should be included for this user.
        
        Args:
            scalars: User's TAP scalars
        
        Returns:
            List[ContentBlock]: Blocks to include
        """
        return [block for block in self.blocks if block.should_include(scalars)]
    
    def render(self, scalars: TAPScalars) -> str:
        """
        Render the complete content for this user.
        
        Args:
            scalars: User's TAP scalars
        
        Returns:
            str: Rendered content
        """
        included_blocks = self.get_included_blocks(scalars)
        
        if not included_blocks:
            return self.baseline_question
        
        # Start with baseline question
        parts = [self.baseline_question]
        
        # Add all included block texts
        for block in included_blocks:
            parts.append(block.text)
        
        # Join with spaces
        return " ".join(parts)


def create_sample_template(topic_id: str = "credit_cards") -> ContentTemplate:
    """
    Create a sample template for testing.
    
    This is the "Credit Cards" example from the specification.
    
    Args:
        topic_id: Topic identifier
    
    Returns:
        ContentTemplate: Sample template
    """
    return ContentTemplate(
        topic_id=topic_id,
        baseline_question="How do you feel about using credit cards?",
        blocks=[
            # Concept blocks
            ContentBlock(
                type="concept",
                threshold=0.0,
                text="A credit card lets you buy things now and pay later."
            ),
            ContentBlock(
                type="concept",
                threshold=0.15,
                text="When you use a credit card, you're borrowing money from the bank."
            ),
            ContentBlock(
                type="concept",
                threshold=0.40,
                text="Credit cards charge interest if you don't pay the full balance each month."
            ),
            ContentBlock(
                type="concept",
                threshold=0.65,
                text="Your credit utilization ratio (balance / limit) affects your credit score."
            ),
            
            # Ideology blocks
            ContentBlock(
                type="ideology",
                threshold=0.0,
                text="Using cards wisely helps you get things you need."
            ),
            ContentBlock(
                type="ideology",
                threshold=0.35,
                text="Credit cards can be a tool for building your financial reputation."
            ),
            ContentBlock(
                type="ideology",
                threshold=0.70,
                text="Strategic credit management enables wealth-building through optimized cash flow."
            ),
            
            # Stretch blocks
            ContentBlock(
                type="stretch",
                threshold=0.10,
                text="Some people use credit cards to earn rewards points."
            ),
            ContentBlock(
                type="stretch",
                threshold=0.50,
                text="Advanced users leverage credit card float for short-term liquidity management."
            ),
            ContentBlock(
                type="stretch",
                threshold=0.85,
                text="Sophisticated strategies include balance transfer arbitrage and rewards optimization across multiple card ecosystems."
            ),
        ]
    )
