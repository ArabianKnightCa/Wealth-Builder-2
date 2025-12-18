# TAP v2.3.1 - PART 2 OF 2

## Continuation from PART 1

This part contains the complete grammar-safe pipeline implementation and supporting modules.

---

## FILE 4: tap_v2_3_1_language.py (Safe Rewrite Pipeline)

**NOTE:** This is a 590+ line file. Here are the key sections:

### Pipeline Overview (8 Steps):
```python
class SafeRewritePipeline:
    """
    8-step grammar-safe rewrite pipeline:
    1. _protect_invariants()      # Protect numbers, entities, critical phrases
    2. _normalize_sentences()     # Structure-first simplification by LC
    3. _add_clarifications()      # CD-based financial term definitions
    4. _add_framing()            # IA-based "why it matters" context
    5. _reflow_grammar()         # Fix punctuation, capitalization
    6. _restore_tokens()         # Put back protected content
    7. _validate()               # Check quality & correctness
    8. _minimal_rewrite_fallback() # Safe fallback if validation fails
    """
```

### Key Methods:

#### Step 1: Invariant Protection
```python
def _protect_invariants(self, text: str) -> Tuple[str, TokenMap]:
    """
    Protect:
    - Numbers: $100, 5.5%, 1,000
    - Critical phrases: "not recommended", "must avoid"
    
    Replace with tokens: NUM_1, NUM_2, PHRASE_1, etc.
    Store in TokenMap for later restoration.
    """
```

#### Step 2: Sentence Normalization (Key Logic)
```python
def _normalize_sentences(self, text: str, lc: float, age: int) -> str:
    """
    LC >= 0.6: Keep complex sentences (adult expert)
    LC >= 0.3: Moderate simplification (teen/young adult)
    LC >= 0.15: Significant simplification (breaking compound sentences)
    LC < 0.15: Maximum simplification (child - call _rewrite_for_child)
    """
```

#### Child Rewriting (LC < 0.15, age <= 12)
```python
def _rewrite_for_child(self, text: str, age: int) -> str:
    """
    Complete sentence restructuring for children.
    
    Vocabulary replacements:
    - 'financial literacy' → 'learning about money'
    - 'budgeting' → 'planning your money'
    - 'investing' → 'saving money to grow it'
    - 'ability to' → 'you can'
    
    Sentence simplification:
    - Max 8 words per sentence
    - Break at commas
    - Avoid fragments
    """
```

#### Step 3: CD-Based Clarification
```python
def _add_clarifications(self, text: str, cd: float) -> str:
    """
    CD < 0.3: Add 2 clarifications max
    CD < 0.5: Add 1 clarification
    CD >= 0.5: No clarifications needed
    
    Example: "interest (extra money you pay or earn)"
    """
```

#### Step 4: IA-Based Framing
```python
def _add_framing(self, text: str, ia: float, age: int, cd: float) -> str:
    """
    Skip framing if:
    - Text < 10 words (likely a question/option)
    - Starts with "I", "When", "Strongly", etc.
    
    Add framing based on IA + age:
    - IA >= 0.9, age >= 60: "This reflects long-term wealth preservation..."
    - IA >= 0.8, age >= 40: "This is key to building financial security..."
    - IA >= 0.4, cd < 0.5: "This is about how you handle money choices."
    """
```

#### Step 5: Grammar Reflow
```python
def _reflow_grammar(self, text: str, lc: float) -> str:
    """
    Fix:
    - Multiple spaces
    - Period spacing
    - Capitalization after periods
    - Spaces before punctuation
    
    DON'T add period if:
    - Short phrase (≤ 6 words)
    - Question pattern detected
    - Starts with "I", "when", "strongly", etc.
    """
```

#### Step 7: Validation
```python
def _validate(self, original: str, transformed: str, token_map: TokenMap) -> ValidationResult:
    """
    Check:
    1. All tokens restored (no NUM_1 or PHRASE_1 left)
    2. Numbers preserved (count matches)
    3. Critical keywords preserved ("not", "never", "must")
    4. Fluency (no "..", no sentence fragments)
    
    Returns: ValidationResult(passed, issues, risk_level)
    """
```

#### Step 8: Fallback
```python
def _minimal_rewrite_fallback(self, text: str, scalars: TAPScalars) -> str:
    """
    If validation fails, use safe minimal rewrite:
    - Keep original structure
    - Only apply child context for age <= 10
    - Add max 1 clarification
    - Add simple framing if needed
    """
```

### Financial Terms Dictionary
```python
self.financial_terms = {
    'interest': 'extra money you pay or earn',
    'credit': 'borrowed money',
    'debt': 'money you owe',
    'savings': 'money you keep for later',
    'investment': 'money you put in to grow',
    'budget': 'plan for your money',
    'compound': 'growth that builds on itself',
    'principal': 'original amount of money',
    'APR': 'yearly interest rate',
    'ROI': 'return on investment',
}
```

---

## FILE 5: tap_v2_3_ae_integration.py

```python
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
        """Triggers: High friction or first exposure"""
        return ae_state.friction > 0.6 or ae_state.exposure == 1
    
    def should_add_clarifiers(self, ae_state: AEStatePacket) -> bool:
        """Triggers: High friction or low confidence"""
        return ae_state.friction > 0.6 or ae_state.confidence_band < 0.4
    
    def should_slow_pacing(self, ae_state: AEStatePacket) -> bool:
        """Triggers: High friction or low momentum"""
        return ae_state.friction > 0.6 or ae_state.momentum < 0.3
    
    def should_compress(self, ae_state: AEStatePacket) -> bool:
        """Triggers: High momentum + confidence + multiple exposures"""
        return (ae_state.momentum > 0.7 and 
                ae_state.confidence_band > 0.7 and 
                ae_state.exposure > 2)
    
    def get_example_count(self, ae_state: AEStatePacket, base_count: int = 1) -> int:
        """
        Adjust example count based on AE state:
        - High friction: +2 examples
        - First exposure: +1 example
        - High performance: -1 example
        """
        if ae_state.friction > 0.6:
            return base_count + 2
        elif ae_state.exposure == 1:
            return base_count + 1
        elif self.should_compress(ae_state):
            return max(0, base_count - 1)
        else:
            return base_count
    
    def apply_modifications(self, text: str, ae_state: AEStatePacket) -> str:
        """
        Apply AE-driven modifications to text.
        
        High friction: Add "It's important to understand..."
        First exposure: Add "For example, this helps..."
        High performance: Keep concise
        """
        # High friction: Add reinforcement
        if ae_state.friction > 0.6:
            if not text.endswith('.'):
                text += '.'
            text += " It's important to understand this concept."
        
        # First exposure: Add "For example" bridge
        if ae_state.exposure == 1 and 'example' not in text.lower():
            text += " For example, this helps you make better financial decisions."
        
        return text


# Singleton instance
_ae_modifier = None


def get_ae_modifier() -> AEModifier:
    """Get singleton AEModifier instance."""
    global _ae_modifier
    if _ae_modifier is None:
        _ae_modifier = AEModifier()
    return _ae_modifier
```

---

## FILE 6: tap_v2_3_templates.py (Abbreviated)

```python
"""
TAP v2.3 Template System
========================
Granular block-based templates with numeric thresholds.
Progressive reveal based on user scalars.
"""

from dataclasses import dataclass, field
from typing import List, Literal
from tap_v2_3_formulas import TAPScalars

BlockType = Literal["concept", "ideology", "stretch"]


@dataclass
class ContentBlock:
    """A single content block with threshold-based reveal."""
    type: BlockType
    threshold: float  # 0.0 to 1.0
    text: str
    
    def should_include(self, scalars: TAPScalars) -> bool:
        """
        Progressive reveal rules:
        - concept blocks: Include if threshold <= CD
        - ideology blocks: Include if threshold <= IA
        - stretch blocks: Include if threshold <= stretch_norm AND stretch_norm > CD
        """
        if self.type == "concept":
            return self.threshold <= scalars.cd
        elif self.type == "ideology":
            return self.threshold <= scalars.ia
        elif self.type == "stretch":
            return (self.threshold <= scalars.stretch_norm and 
                    scalars.stretch_norm > scalars.cd)
        return False


@dataclass
class ContentTemplate:
    """A complete content template with multiple blocks."""
    topic_id: str
    baseline_question: str
    blocks: List[ContentBlock] = field(default_factory=list)
    
    def get_included_blocks(self, scalars: TAPScalars) -> List[ContentBlock]:
        """Get all blocks that should be included for this user."""
        return [block for block in self.blocks if block.should_include(scalars)]
    
    def render(self, scalars: TAPScalars) -> str:
        """Render the complete content for this user."""
        included_blocks = self.get_included_blocks(scalars)
        
        if not included_blocks:
            return self.baseline_question
        
        parts = [self.baseline_question]
        for block in included_blocks:
            parts.append(block.text)
        
        return " ".join(parts)


def create_sample_template(topic_id: str = "credit_cards") -> ContentTemplate:
    """Create sample template with 10 blocks (4 concept, 3 ideology, 3 stretch)."""
    return ContentTemplate(
        topic_id=topic_id,
        baseline_question="How do you feel about using credit cards?",
        blocks=[
            # 4 Concept blocks
            ContentBlock(type="concept", threshold=0.0, 
                        text="A credit card lets you buy things now and pay later."),
            ContentBlock(type="concept", threshold=0.15,
                        text="When you use a credit card, you're borrowing money from the bank."),
            ContentBlock(type="concept", threshold=0.40,
                        text="Credit cards charge interest if you don't pay the full balance each month."),
            ContentBlock(type="concept", threshold=0.65,
                        text="Your credit utilization ratio affects your credit score."),
            
            # 3 Ideology blocks
            ContentBlock(type="ideology", threshold=0.0,
                        text="Using cards wisely helps you get things you need."),
            ContentBlock(type="ideology", threshold=0.35,
                        text="Credit cards can be a tool for building your financial reputation."),
            ContentBlock(type="ideology", threshold=0.70,
                        text="Strategic credit management enables wealth-building."),
            
            # 3 Stretch blocks
            ContentBlock(type="stretch", threshold=0.10,
                        text="Some people use credit cards to earn rewards points."),
            ContentBlock(type="stretch", threshold=0.50,
                        text="Advanced users leverage credit card float for liquidity management."),
            ContentBlock(type="stretch", threshold=0.85,
                        text="Sophisticated strategies include balance transfer arbitrage."),
        ]
    )
```

---

## Current Status & Known Issues

### ✅ Working:
- Core formula system (LC, CD, IA, stretch) - Fully functional
- Feature flag system - Operational
- TAP v2.3 engine integration - Complete
- Adult transformations (age 35+, EL 3-5) - Working well
- PPI questions - Baseline preserved (no transformation)

### ⚠️ Known Issues:

**1. Child Transformations (age 6, EL 1, LC=0.04)**
- Grammar errors can occur with complex LPI content
- Example: "learning about money is the can learn..." 
- Root cause: Vocabulary replacements breaking sentence structure

**2. Teen Level (age 18, EL 2, LC=0.20)**
- Sometimes not transforming (returns baseline)
- Falls in threshold gap between 0.15-0.30
- Needs enhanced middle-range handling

**3. Punctuation Issues**
- Occasionally creates fragments like "When making decisions. I prefer..."
- Should preserve commas or split properly

### 🔄 In Development:

**TAP v2.4 Candidates:**
- LLM repair layer (USE_LLM_REWRITE_LAYER currently disabled)
- Enhanced child/teen vocabulary mappings
- More sophisticated sentence restructuring
- ML-based semantic similarity validation

---

## Integration Points

### Where TAP is Currently Used:
1. **LPI Chapters** - `/api/content/lpi/chapters` (✅ Using TAP v2.3.1)
2. **LPI Content** - `/api/content/chapters/{id}` (✅ Using TAP v2.3.1)
3. **Quiz Questions** - `/api/content/chapters/{id}/quiz` (✅ Using TAP v2.3.1)
4. **PPI Questions** - ❌ NOT USED (baseline preserved for psychometric validity)

### How Content is Transformed:
```python
# LPI transformation example
from tap_v2_3_engine import get_tap_v23_engine

engine = get_tap_v23_engine()

lpi_text = "Financial literacy is the ability to understand and effectively use various financial skills."

# Transform for 35-year-old with EL 3
result = engine.transform_content(
    baseline_text=lpi_text,
    user_age=35,
    user_experience_level=3,
    el_max=5
)
# Output: Age-appropriate transformation
```

---

## Testing & Validation

### Test Command:
```bash
cd /app/backend && python3 -c "
from tap_v2_3_engine import get_tap_v23_engine
from tap_v2_3_formulas import compute_tap_scalars

engine = get_tap_v23_engine()

# Test all 5 EL levels
for age, el in [(6,1), (18,2), (35,3), (55,4), (75,5)]:
    s = compute_tap_scalars(age, el, 5)
    result = engine.transform_content('Test content here', age, el, 5)
    print(f'age={age}, EL={el}: LC={s.lc:.2f}, CD={s.cd:.2f}')
    print(f'  Result: {result}\n')
"
```

---

## Summary

**TAP v2.3.1** is a sophisticated text adaptation system with:
- ✅ 1,339 lines of code
- ✅ Formula-driven scalars (no buckets)
- ✅ 8-step grammar-safe pipeline
- ✅ Validation & fallback mechanisms
- ⚠️ Some edge cases need refinement

**Configuration:** POC stage with EL_MAX=5, grammar-safe pipeline enabled, LLM repair disabled.

**Status:** Functional for most use cases, with known issues in child/teen transformations that need addressing.

---

END OF PART 2

**For questions or enhancements, refer to:**
- `/app/TAP_V2_3_FOR_CHATGPT_EVALUATION.md`
- `/app/TAP_V2.3_CLEAN_ROOM_RULESET.md`
