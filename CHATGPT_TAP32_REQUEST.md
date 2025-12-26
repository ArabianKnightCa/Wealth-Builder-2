# TAP 3.2 Implementation Request for ChatGPT

## Context

I have the test harness for TAP 3.2, but I need the **complete implementation code**. The test code shows the expected API but I need the actual engine.

---

## What I Need

Please provide the **complete, runnable Python implementation** for TAP 3.2 that includes:

### 1. TAP32Engine_v321 Class

```python
class TAP32Engine_v321:
    def process_lpi(
        self, 
        baseline_text: str, 
        age: int, 
        el_declared: int, 
        controls: Optional[TAPControlInputs] = None
    ) -> CLGOutput:
        """
        Process LPI content with:
        - Sentence-level scaffolding (interleaved, not appended)
        - Inline definitions at point of use for low LC
        - Preamble generation for very young users
        - Baseline complexity assessment
        - Adaptive CLS based on user LC + baseline complexity
        """
        ...
    
    def process_ppi(
        self, 
        question_text: str, 
        options: List[PPIOptionSpec], 
        age: int, 
        el_declared: int
    ) -> Dict:
        """
        Process PPI question with:
        - Question scaffolding for low LC
        - Option text adaptation (simpler wording for young users)
        - Option glosses (explanatory text)
        """
        ...
```

### 2. Data Classes

```python
@dataclass
class PPIOptionSpec:
    option_id: str      # "A", "B", "C", "D"
    option_text: str    # Original option text
    option_key: str     # Semantic key like "RESEARCH_FIRST"

@dataclass 
class TAP32Scalars:
    # Include these fields that the test expects:
    age: int
    el: int
    lc: float                    # Language Complexity
    cd: float                    # Conceptual Depth  
    ia: float                    # Ideological Abstraction
    baseline_complexity: float   # NEW: Assessed complexity of input text
    cls: int                     # Cognitive Load Span (adaptive)
    scaffold_intensity: float    # NEW: How much scaffolding to apply

@dataclass
class CLGOutput:
    baseline_text: str
    baseline_hash: str
    scalars: TAP32Scalars
    additions: List[CLGAddition]
    final_output: str
    baseline_mutated: bool
    # ... other fields
```

### 3. Core Formulas

Provide the updated formulas for:
- `LC`, `CD`, `IA` computation
- `baseline_complexity` scoring (word length, sentence complexity, technical terms)
- Adaptive `CLS` that increases for low-LC users facing complex content
- `scaffold_intensity` calculation

### 4. Sentence-Level Processing

The key innovation needed:
```python
def process_by_sentence(baseline: str, scalars: TAP32Scalars) -> str:
    """
    Split baseline into sentences.
    After each sentence, insert relevant scaffolding.
    For very low LC, use inline definitions within sentences.
    """
```

### 5. Preamble Generation

```python
def generate_preamble(topic: str, lc: float, age: int) -> str:
    """
    For LC < 0.15 (age ~6-10): Generate child-friendly intro
    For LC < 0.25 (age ~10-14): Generate simpler bridge text
    For LC >= 0.25: No preamble needed
    """
```

### 6. Inline Scaffolding

```python
def insert_inline_definitions(sentence: str, concepts: List[str], lc: float) -> str:
    """
    For low LC users, insert definitions at point of use:
    "Money is a shared agreement" -> "Money (coins and bills) is a shared agreement (when everyone decides something has value)"
    """
```

### 7. Updated Glossary

Expand the glossary to include:
- More financial terms
- Phrase-level entries (e.g., "digital entries in a secure ledger")
- Age-appropriate definitions for each term

### 8. PPI Option Adaptation

```python
def adapt_ppi_option(option: PPIOptionSpec, lc: float) -> Dict:
    """
    For low LC:
    - "Research extensively before deciding" -> "Look up lots of information first"
    - Add option_gloss explaining what the option means
    """
```

---

## Test Cases It Must Pass

The implementation must produce sensible output for:

```python
# LPI Cases
run_lpi_case("Money origin | age 6 EL1", BASELINE_MONEY_ORIGIN, age=6, el=1)   # Heavy scaffolding
run_lpi_case("Money origin | age 12 EL1", BASELINE_MONEY_ORIGIN, age=12, el=1) # Moderate scaffolding
run_lpi_case("Money origin | age 35 EL1", BASELINE_MONEY_ORIGIN, age=35, el=1) # Adult vocab, some help
run_lpi_case("Money origin | age 35 EL5", BASELINE_MONEY_ORIGIN, age=35, el=5) # Minimal scaffolding
run_lpi_case("Bank/ledger | age 6 EL1", BASELINE_BANK_LEDGER, age=6, el=1)     # STRESS TEST - complex baseline

# PPI Cases  
run_ppi_case("PPI Q | age 6 EL1", Q, age=6, el=1)   # Must simplify options
run_ppi_case("PPI Q | age 35 EL5", Q, age=35, el=5) # Keep original options
```

---

## Hard Constraints (MUST FOLLOW)

1. **NO BUCKETS** - All calculations use continuous formulas from `age` and `EL`
2. **BASELINE IMMUTABLE** - The original baseline text must appear verbatim in output
3. **DETERMINISTIC** - Same inputs always produce same outputs
4. **NO PARAPHRASING** - Never replace words in the baseline with synonyms

---

## Expected Output Format

For a 6-year-old EL1 reading the money baseline, output should look something like:

```
🌟 Let's learn about money!

Money is what we use to buy things, like coins and dollar bills.

---

Money (coins and bills) is a shared agreement (when everyone decides something has value). 

💡 "Shared agreement" means everyone agrees money is useful - like how everyone at school agrees gold stars are special!

We accept it today because we believe others will accept it tomorrow. Before money, people bartered (traded things without using money)—two loaves of bread for one bowl of grain.

💡 That's like swapping your sandwich for your friend's chips at lunch!

That only worked when both sides needed each other at the same time. Money solved the timing problem.

💡 Now you can sell something, keep the money, and buy what you want later!
```

---

## Output Format

Please provide:
1. **Complete Python file** that can be saved as `tap_3_2.py`
2. **All imports** at the top
3. **All dataclasses** with full field definitions
4. **The full TAP32Engine_v321 class** with all methods
5. **The test harness** at the bottom in `if __name__ == "__main__":`

Make it a single, self-contained file I can run immediately.
