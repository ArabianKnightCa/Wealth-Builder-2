# TAP 4.0 Implementation Request

## Context
We're building a financial literacy app called "Wealth Builder" with an Adaptive Engine that transforms complex financial content for different user levels (ages 6-65, experience levels 1-5). 

**Core Constraint: BASELINE IMMUTABILITY** - The original expert content cannot be rewritten. We create parallel simplified versions that must preserve the exact same meaning.

## Answers to Your Questions

1. **Meaning drift approach:** Use BOTH - Tiered TF-IDF (fast path) + Embeddings (deep check when needed)
2. **Grammar correction:** FLAG for review only - do NOT auto-apply corrections. Return `corrected_text` as suggestion only.
3. **When to validate:** On content creation/admin update only. Cache results in MongoDB.

## Environment
- Python 3.11.14
- FastAPI backend (long-running supervisor service)
- MongoDB (no Redis)
- No GPU available
- No Docker available
- Outbound HTTP allowed

## Available Packages
```
language-tool-python==2.7.1
textstat==0.7.3
sentence-transformers==2.2.2
scikit-learn>=1.0
```

## Request: Create complete `tap_4_0.py`

Please provide a single, complete Python file with:

### 1. Dataclasses

```python
@dataclass
class TAPControlInputs:
    friction: float = 0.0
    momentum: float = 0.5
    verbosity: float = 0.0
    
    @classmethod
    def neutral(cls) -> "TAPControlInputs": ...

@dataclass
class TAP40Scalars:
    lc: float
    cd: float
    ia: float
    childiness: float
    weights: Dict[str, float]

@dataclass
class LessonSpec:
    baseline_text: str
    topic: str
    takeaway: str

@dataclass
class PPIOptionSpec:
    id: str
    baseline: str
    display: str
    gloss: str

@dataclass
class CLGOutput:
    child_text: str
    bridge_text: str
    expert_text: str
    blend_weights: Dict[str, float]
    validation: Optional[ValidationResult]

@dataclass
class GrammarIssue:
    message: str
    offset: int
    length: int
    replacements: List[str]
    rule_id: str

@dataclass
class GrammarResult:
    score: float
    issues: List[GrammarIssue]
    corrected_text: Optional[str]

@dataclass
class ReadabilityResult:
    flesch_kincaid_grade: float
    target_grade: float
    is_appropriate: bool
    smog_index: Optional[float]
    
@dataclass
class MeaningDriftResult:
    similarity_score: float
    threshold: float
    is_acceptable: bool
    method: str

@dataclass
class ValidationResult:
    is_valid: bool
    overall_score: float
    grammar: GrammarResult
    readability: ReadabilityResult
    meaning_drift: MeaningDriftResult
    validated_at: str
```

### 2. Validators

```python
class GrammarValidator:
    """Uses language-tool-python with remote API (no local JVM)."""
    def validate(self, text: str) -> GrammarResult: ...

class ReadabilityScorer:
    """
    Uses textstat. Target grades by age:
    - Age 6-8: grade 2-3
    - Age 9-12: grade 4-6
    - Age 13-17: grade 7-9
    - Age 18+: grade 10-12
    """
    def score(self, text: str, user_age: int) -> ReadabilityResult: ...

class MeaningSimilarityValidator:
    """
    Tiered approach:
    1. TF-IDF (<50ms): >0.6 PASS, 0.3-0.6 check embeddings, <0.3 FLAG
    2. Embeddings (~200ms): all-MiniLM-L6-v2, threshold 0.75
    """
    def validate(self, baseline: str, adapted: str) -> MeaningDriftResult: ...
```

### 3. Unified Validator Suite

```python
class ValidatorSuite:
    def __init__(self): 
        self.grammar = GrammarValidator()
        self.readability = ReadabilityScorer()
        self.meaning = MeaningSimilarityValidator()
    
    def validate(self, baseline: str, adapted: str, user_age: int, el: int) -> ValidationResult: ...
```

### 4. TAP 4.0 Engine

```python
class TAP40Engine:
    def __init__(self, el_max_poc: int = 5, enable_validation: bool = True): ...
    
    def compute_scalars(self, age: int, el_declared: int, baseline_text: str, controls: TAPControlInputs) -> TAP40Scalars:
        """
        - age_norm = clamp((age - 6) / 60)
        - el_norm = (el_declared - 1) / (el_max - 1)
        - lc = 0.4 * age_norm + 0.6 * el_norm
        - childiness = 1 - lc
        """
        ...
    
    def process_lpi(self, spec: LessonSpec, age: int, el_declared: int, controls: Optional[TAPControlInputs] = None) -> CLGOutput: ...
    
    def process_ppi(self, options: List[PPIOptionSpec], age: int, el_declared: int, controls: Optional[TAPControlInputs] = None) -> List[PPIOptionSpec]: ...
```

## Requirements

1. Complete, runnable file - No placeholders or TODOs
2. Lazy loading - Only load sentence-transformers when needed
3. Error handling - Graceful fallbacks if validators fail
4. Logging - Use Python logging module
5. Type hints - Full typing throughout
6. Docstrings - Document all public methods

## Performance Targets

- Grammar check: <200ms
- Readability check: <10ms
- TF-IDF similarity: <50ms
- Embedding similarity: <300ms
- Full validation suite: <500ms P95

## Example Usage

```python
from tap_4_0 import TAP40Engine, TAPControlInputs, LessonSpec

engine = TAP40Engine(el_max_poc=5, enable_validation=True)

output = engine.process_lpi(
    spec=LessonSpec(
        baseline_text="Compound interest is growth on growth - you earn returns on your principal AND on previous earnings.",
        topic="Saving Early",
        takeaway="Start small, stay steady."
    ),
    age=6,
    el_declared=1,
    controls=TAPControlInputs.neutral()
)

print(f"Child version: {output.child_text}")
print(f"Validation passed: {output.validation.is_valid}")
print(f"Meaning preserved: {output.validation.meaning_drift.is_acceptable}")
```

## Expected Output

```python
CLGOutput(
    child_text="💰 Your money can grow all by itself!",
    bridge_text="When you save money and earn interest...",
    expert_text="Compound interest is growth on growth...",
    blend_weights={"child": 0.87, "bridge": 0.07, "expert": 0.06},
    validation=ValidationResult(
        is_valid=True,
        overall_score=0.91,
        grammar=GrammarResult(score=1.0, issues=[], corrected_text=None),
        readability=ReadabilityResult(flesch_kincaid_grade=2.8, target_grade=3.0, is_appropriate=True),
        meaning_drift=MeaningDriftResult(similarity_score=0.84, threshold=0.75, is_acceptable=True, method="embedding_deep"),
        validated_at="2025-12-28T01:30:00Z"
    )
)
```

Please provide the complete `tap_4_0.py` file ready to use.
