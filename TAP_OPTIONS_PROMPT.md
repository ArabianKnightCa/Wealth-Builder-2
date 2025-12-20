# TAP ARCHITECTURE DECISION — PROMPT FOR EVALUATION

## CONTEXT

We are building **Mizo Wealth Builder**, a financial literacy app with an **Adaptive Engine (AE)** at its core. The key component is **TAP (Text Adaptation Processor)** which must adapt content for users of ALL ages and experience levels.

### Content Scale
- **PPI**: 20 psychological assessment questions (users answer to generate their Financial DNA)
- **LPI**: ~500 topics × 8-60 chapters each × multiple lessons per chapter × 4-10 quizzes per chapter
- Total: Potentially **tens of thousands** of content pieces

### User Variables (Continuous, NOT Bucketed)
- **Age**: 6 to 100+ (normalized as `age_norm = age/100`)
- **Experience Level (EL)**: 1 to EL_MAX (POC uses EL_MAX=5, normalized as `el_norm = (EL-1)/(EL_MAX-1)`)
- **Financial DNA**: Personality traits from PPI (discipline, impulse, confidence, tempo)

### Core Formulas (Already Defined)
```
LC = 0.65 × age_norm + 0.35 × el_norm   # Language Complexity (age-dominant)
CD = 0.85 × el_norm + 0.15 × age_norm   # Conceptual Depth (EL-dominant)
IA = 0.50 × age_norm + 0.50 × el_norm   # Ideological Abstraction (balanced)
```

### Hard Constraints
1. **NO BUCKETS** — No child/teen/adult categories. No low/med/high bands. Age and EL are continuous.
2. **NO SYNONYM REPLACEMENT** — Random word swapping breaks grammar and meaning.
3. **SINGLE BASELINE** — We cannot maintain multiple versions of 10,000+ content pieces.
4. **GRAMMAR MUST BE CORRECT** — Output must be grammatically safe.
5. **MEASUREMENT INTENT PRESERVED** — PPI questions must still measure what they're designed to measure.
6. **DETERMINISTIC** — Same inputs must produce same outputs.

---

## THE PROBLEM

We have been stuck for weeks trying to implement TAP. Previous attempts failed because:

1. **String replacement approach**: Using `text.replace("financial decisions", "money choices")` breaks grammar and doesn't scale.

2. **Band/bucket approach**: Creating 4 versions of each content piece at bands 0.10, 0.35, 0.70, 0.90 is essentially bucketing and doesn't scale to 10,000+ content pieces.

3. **Synonym dictionaries**: Swapping words without context produces nonsensical output.

---

## OPTIONS TO EVALUATE

### OPTION A: Scaffolding Injection (Inline Definitions)

**Concept**: Keep baseline content unchanged. Inject explanations for complex terms based on user's LC.

**Mechanism**:
- Maintain a glossary of ~100-200 financial terms with complexity scores and simple definitions
- For each term in content: if `term_complexity > user_LC`, inject inline explanation
- No rewriting of baseline text

**Example**:
```
BASELINE: "Diversification reduces portfolio risk through asset allocation."

User LC=0.05 (child):
"Diversification [spreading your money across different things] reduces portfolio [your mix of investments] risk through asset allocation [how you divide up your money]."

User LC=0.74 (expert):
"Diversification reduces portfolio risk through asset allocation."
(No injection needed)
```

**Pros**:
- Single baseline maintained
- Scales to any content volume
- Formula-driven (term_complexity vs LC)
- Grammar preserved (injections are additive)

**Cons**:
- Bracketed text may feel cluttered for young users
- Doesn't simplify sentence structure
- May not be enough for very young children

---

### OPTION B: Layered Content Architecture

**Concept**: Content has a core message + optional layers that appear based on LC/CD.

**Mechanism**:
- Each content piece has: `{core, support_layer, challenge_layer, analogy_layer}`
- Core always shown
- Layers appear based on scalar thresholds

**Example**:
```json
{
  "core": "Saving money helps you prepare for the future.",
  "support_layer": "When you save, you put money aside instead of spending it all.",
  "analogy_layer": "It's like storing acorns for winter.",
  "challenge_layer": "Consider how compound interest accelerates savings growth."
}
```

**User LC=0.05**: core + support_layer + analogy_layer
**User LC=0.50**: core + support_layer
**User LC=0.74**: core + challenge_layer

**Pros**:
- Clean separation of complexity levels
- Single content piece, multiple presentations
- Formula-driven layer selection

**Cons**:
- Requires restructuring all existing content
- 4 layers per content piece = significant authoring

---

### OPTION C: Template-Based Generation (CLG)

**Concept**: Don't store full sentences. Store structured data and generate sentences from templates.

**Mechanism**:
- Content stored as: `{concept_id, key_points[], examples[], analogies[]}`
- Sentence templates: `"{TERM} means {DEFINITION}."`, `"Example: {EXAMPLE}"`
- Generator assembles output based on LC/CD

**Example**:
```json
{
  "concept_id": "COMPOUND_INTEREST",
  "term_simple": "interest on interest",
  "term_advanced": "compound interest",
  "definition_simple": "your money grows, then the growth also grows",
  "definition_advanced": "interest calculated on initial principal plus accumulated interest",
  "example": "If you save $100 and earn 10%, next year you earn interest on $110"
}
```

**User LC=0.05**: "Interest on interest means your money grows, then the growth also grows. Example: ..."
**User LC=0.74**: "Compound interest means interest calculated on initial principal plus accumulated interest."

**Pros**:
- Highly structured, predictable output
- Grammar guaranteed by templates
- Scalable data model

**Cons**:
- Requires complete content restructure
- May feel robotic/repetitive
- Complex to author at scale

---

### OPTION D: Hybrid — Baseline + Glossary + Conditional Framing

**Concept**: Combine baseline preservation with smart glossary injection and age-appropriate framing.

**Mechanism**:
1. **Glossary injection**: Complex terms get inline definitions when LC < term_complexity
2. **Framing prefix**: Based on IA, add motivational context
3. **Support suffix**: Based on LC, add examples/analogies

**Example**:
```
BASELINE: "Creating a budget helps you track spending."

User age=8, EL=1 (LC=0.05, IA=0.04):
FRAMING: "Here's something cool to learn: "
GLOSSARY: "budget [a plan for your money]"
SUPPORT: " For example, you can decide how much to spend on toys vs saving."

OUTPUT: "Here's something cool to learn: Creating a budget [a plan for your money] helps you track spending. For example, you can decide how much to spend on toys vs saving."

User age=60, EL=5 (LC=0.74, IA=0.80):
OUTPUT: "Creating a budget helps you track spending."
(No modifications needed)
```

**Pros**:
- Baseline preserved
- Modular additions (glossary, framing, support)
- Each module is formula-driven
- Scales well

**Cons**:
- Multiple systems to maintain (glossary, framing rules, support library)
- Integration complexity

---

### OPTION E: AI-Assisted Rewrite (LLM Layer)

**Concept**: Use an LLM to rewrite content in real-time based on user profile.

**Mechanism**:
- Pass baseline + user scalars (LC, CD, IA) to LLM
- LLM rewrites to appropriate level
- Cache results for performance

**Example Prompt**:
```
Rewrite the following for a user with:
- Language Complexity: 0.05 (very simple vocabulary)
- Conceptual Depth: 0.01 (basic concepts only)
- Age: 8

Original: "Diversification reduces portfolio risk through asset allocation."

Rewrite in age-appropriate language while preserving meaning.
```

**Pros**:
- Highly flexible
- Handles edge cases well
- No manual content variants needed

**Cons**:
- Non-deterministic (same input may vary)
- Latency and cost at scale
- Risk of meaning drift
- Dependency on external service

---

## QUESTIONS FOR EVALUATION

1. **Which option best balances scalability with quality?**

2. **Can options be combined?** (e.g., Option D for most content, Option E as fallback for complex cases)

3. **For PPI specifically**: How do we adapt questions without breaking psychological measurement validity? The question must still measure the same trait.

4. **What's the minimum viable approach** that works for POC with ~20 PPI questions and ~50 LPI lessons?

5. **What data structures** would each option require?

6. **Are there approaches we haven't considered?**

---

## DESIRED OUTPUT

Please evaluate these options and recommend:
1. The best approach for **PPI** (20 questions, must preserve measurement intent)
2. The best approach for **LPI** (scalable to thousands of lessons)
3. Whether a hybrid is appropriate
4. Implementation priority for POC
5. Any alternative approaches worth considering

The goal is a **deterministic, grammar-safe, scalable** solution that adapts content using continuous age and EL variables without creating content buckets or relying on brittle string replacement.
