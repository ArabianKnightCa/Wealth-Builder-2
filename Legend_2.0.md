# Legend 2.0 — Mizo Wealth Builder Acronym Reference

**For programmers new to the Mizo Wealth Builder project**

---

## Core System Acronyms

### TAP — Text Adaptation Processor
The algorithmic engine that transforms baseline content to match a user's reading level and financial sophistication. TAP uses continuous mathematical formulas (not hardcoded buckets) to adapt vocabulary, sentence complexity, and conceptual depth. Current version: **TAP v2.3.1**.

### AE — Adaptive Engine
The parent system that orchestrates the entire personalization experience. AE selects which PPI questions to show, generates the user's Financial DNA profile, creates the personalized learning path (LPI), and calls TAP to transform content. Think of AE as the "brain" and TAP as the "voice."

### POC — Proof of Concept
The current development phase of Mizo Wealth Builder. In POC mode, the system uses simplified configurations (e.g., `EL_MAX = 5`) that will be expanded in Beta and Commercial releases.

---

## User Assessment Acronyms

### PPI — Personal Profile Instrument
The 20-question psychological assessment users complete during onboarding. PPI measures financial attitudes, risk tolerance, and learning preferences. The responses are used to calculate the user's Financial DNA and determine their learning path order.

### LPI — Learning Path Instrument
The 10-chapter financial education curriculum personalized for each user. Chapter order is determined by the user's Financial DNA profile (from PPI) and their stated financial goals. Each chapter contains 4 lessons and quizzes.

### EL — Experience Level
An integer (1 to `EL_MAX`) representing the user's self-declared financial knowledge. In POC, this ranges from 1 (complete beginner) to 5 (expert). EL heavily influences Conceptual Depth (CD) — higher EL means more technical financial terminology.

### EL_MAX — Maximum Experience Level
The ceiling for user experience levels. This value changes by release phase: POC = 5, Beta = 10, Commercial = 15. All experience-related calculations use this as a normalizer.

---

## TAP Formula Scalars (The Math Behind Adaptation)

### LC — Language Complexity
A float from 0.0 to 1.0 that controls vocabulary sophistication and sentence structure. **Formula: `LC = (0.65 × age_norm) + (0.35 × el_norm)`**. Age dominates because even financial experts who are children need simpler language.

### CD — Conceptual Depth
A float from 0.0 to 1.0 that controls financial topic complexity and terminology density. **Formula: `CD = (0.85 × el_norm) + (0.15 × age_norm)`**. Experience dominates because a 40-year-old beginner needs adult language but basic concepts.

### IA — Ideological Abstraction
A float from 0.0 to 1.0 that controls framing, motivation, and life-stage relevance. **Formula: `IA = (0.50 × age_norm) + (0.50 × el_norm)`**. Balanced because "why this matters" depends equally on maturity and knowledge.

### age_norm — Normalized Age
User's age converted to a 0.0–1.0 scale. **Formula: `age_norm = age / 100`**. A 6-year-old = 0.06, a 50-year-old = 0.50.

### el_norm — Normalized Experience Level
User's EL converted to a 0.0–1.0 scale. **Formula: `el_norm = (EL - 1) / (EL_MAX - 1)`**. With EL_MAX=5: EL 1 = 0.00, EL 3 = 0.50, EL 5 = 1.00.

---

## Financial DNA Terms

### Financial DNA
The psychological profile generated from PPI responses. Contains weights for discipline, impulse, confidence, and tempo. Used to determine learning path order and content framing.

### Discipline Weight
A 0.0–1.0 score measuring the user's tendency toward planning, structure, and delayed gratification. Higher discipline = more "Planner" archetype content.

### Impulse Weight
A 0.0–1.0 score measuring the user's tendency toward spontaneous decisions. Higher impulse = content emphasizes quick wins and immediate relevance.

### Confidence Weight
A 0.0–1.0 score measuring the user's financial self-assurance. Low confidence = more reassuring framing; high confidence = more challenging content.

### Tempo
The user's preferred learning pace: "fast", "steady", or "slow". Determines lesson pacing and content density.

### Archetype / Profile
The user's primary Financial DNA classification. One of: **Planner**, **Spontaneous**, **Confident Explorer**, **Cautious Learner**, or **Balanced Builder**. Each archetype has a customized chapter order.

---

## CLG (Controlled Language Generator) Terms — NEW in v2.3.1

### CLG — Controlled Language Generator
The grammar-safe realization layer inside TAP. Unlike the old paraphrasing approach, CLG uses pre-approved phrases and sentence templates to guarantee grammatical correctness. CLG decides HOW to say things; TAP CoreLogic decides WHAT to say.

### PBM — Phrase Bank Matrix
A dictionary of approved phrases organized by concept ID and band score. Each entry contains a term, definition, example, and optional analogy. CLG selects the nearest band_score to the user's CD (Conceptual Depth) to choose the appropriate phrase.

### STL — Sentence Template Library
A collection of grammar-safe sentence frames with slots (like `{TERM}` and `{DEFINITION}`). Templates include T_DEF for definitions, T_EXAMPLE for examples, T_ANALOGY for analogies, and T_STRETCH for growth content. Templates guarantee grammatical output.

### Band Score
A float from 0.0 to 1.0 indicating the sophistication level of a phrase in the PBM. Low scores (0.10) = child-friendly language; high scores (0.90) = expert terminology. CLG selects the band nearest to the user's CD.

### Slot Fill
The process of inserting approved phrases from PBM into STL templates. No paraphrasing or synonym replacement occurs—only exact slot filling.

---

## TAP v2.3.1 Pipeline Terms

### Baseline Text
The canonical, "guru-level" content stored in the database. All transformations start from baseline and adapt downward (simpler) based on user scalars.

### Stretch Target
The user's next growth level (EL + 1, capped at EL_MAX). Content occasionally includes stretch vocabulary to encourage progression.

### Invariant Protection
The first pipeline stage that identifies and protects text elements that must never be modified: proper nouns, numbers, percentages, dates, and financial terms.

### Safe Rewrite Pipeline
The v2.3.1 grammar-safe transformation approach. Processes text through stages: invariant protection → sentence normalization → clarification → framing → grammar reflow.

### LLM Rewrite Layer
An optional feature-flagged capability (currently disabled) that uses AI to repair any grammatical issues in transformed text.

---

## Feature Flag Variables

### USE_TAP_V2_3
Boolean flag enabling TAP v2.3 system. Default: `true`.

### USE_SAFE_REWRITE_PIPELINE
Boolean flag enabling the v2.3.1 grammar-safe pipeline. Default: `true`.

### USE_LLM_REWRITE_LAYER
Boolean flag enabling AI-assisted grammar repair. Default: `false` (disabled in POC).

### LLM_REWRITE_ONLY_ON_RISK
When LLM layer is enabled, this flag restricts AI rewrites to only high-risk transformations. Default: `true`.

---

## API Endpoints Reference

| Endpoint | Purpose |
|----------|---------|
| `/api/content/ppi/personalized` | Returns PPI questions adapted for user |
| `/api/content/lpi` | Returns user's personalized learning path |
| `/api/content/chapter/{id}` | Returns chapter content adapted for user |

---

## Key File Locations

| File | Purpose |
|------|---------|
| `clg_engine.py` | **NEW** CLG engine - grammar-safe realization layer |
| `clg_data.py` | **NEW** Phrase Bank Matrix (PBM) & templates (STL) |
| `tap_v2_3_formulas.py` | Core scalar calculations (LC, CD, IA) |
| `tap_v2_3_engine.py` | Main TAP orchestration engine |
| `tap_v2_3_1_language.py` | Legacy rewrite pipeline (superseded by CLG) |
| `ae_engine_v2.py` | Adaptive Engine main logic |
| `feature_flags.py` | Feature toggle configuration |

---

*Legend 2.0 — Last updated: December 2025*
