# TAP - LEGEND OF ACRONYMS

Quick reference guide for all acronyms used in the TAP (Text Adaptation Processor) system.

---

## Core System

### TAP - Text Adaptation Processor
A formula-driven system that transforms financial education content based on user age and experience level. It adapts text complexity, terminology, and framing to match the user's comprehension level without using age buckets or simple word replacement.

### EL - Experience Level
A discrete numerical rung (1-5 for POC, 1-10 for Beta, 1-15 for Commercial) representing a user's financial knowledge and expertise. Unlike traditional "beginner/intermediate/advanced" labels, EL uses precise integer steps for granular content adaptation.

### EL_MAX - Experience Level Maximum
The highest experience level available in the current deployment stage (5 for POC, 10 for Beta, 15 for Commercial). This ceiling grows as the platform expands, with each new EL rung "interlaced" between existing ones like interwoven fingers.

---

## Core Scalars (The Three Dimensions)

### LC - Language Complexity
A scalar (0.0 to 1.0) that controls vocabulary sophistication, sentence structure, and grammatical complexity. Dominated by age (65%) with experience (35%), it determines whether content uses simple 6-word sentences or complex multi-clause structures.

### CD - Conceptual Depth
A scalar (0.0 to 1.0) that controls financial topic depth and terminology density. Dominated by experience (85%) with age (15%), it ensures that a 50-year-old beginner gets adult language with simple financial concepts, not childish language.

### IA - Ideological Abstraction
A scalar (0.0 to 1.0) that controls life-stage framing and "why this matters" context. Balanced equally between age (50%) and experience (50%), it determines whether examples reference allowances, career savings, or estate planning.

---

## Normalization & Processing

### age_norm - Normalized Age
Age divided by 100 and clamped to 0.0-1.0 range (age 6 = 0.06, age 50 = 0.50, age 99 = 0.99). This continuous scalar ensures smooth gradations rather than bucketed age groups like "child/teen/adult."

### el_norm - Normalized Experience Level
Experience level converted to 0.0-1.0 scale using (EL - 1) / (EL_MAX - 1). For EL_MAX=5: EL1=0.0, EL3=0.5, EL5=1.0.

### stretch_EL - Stretch Experience Level
Always one rung above the user's current EL (min(EL + 1, EL_MAX)). This "growth target" ensures content includes elements slightly beyond current mastery to promote learning without overwhelming.

### stretch_norm - Normalized Stretch Level
The stretch_EL converted to 0.0-1.0 scale, used to determine which "stretch content blocks" should be revealed to challenge the user appropriately.

---

## Content Types

### PPI - Personal Personality Inventory
Psychometric assessment questions that measure financial attitudes, behaviors, and psychological traits. These questions are intentionally NOT transformed by TAP because precise wording is required for scientific validity.

### LPI - Learning Path Interface
Educational content (chapters, lessons, explanations) about financial literacy topics. This content IS transformed by TAP to match user age and experience level.

---

## Adaptive Engine

### AE - Adaptive Engine
The system that tracks user performance, struggle, and progress to adjust content delivery in real-time. AE modifies HOW content is delivered (pacing, examples, scaffolding) but never changes WHAT level of content (EL, CD, stretch).

### AE State Packet
A data structure containing friction, momentum, exposure, and confidence metrics from the Adaptive Engine. TAP uses this to add extra examples when users struggle or compress content when they're excelling.

---

## Pipeline Components

### Safe Rewrite Pipeline
The 8-step grammar-safe transformation process in TAP v2.3.1 that protects numbers, restructures sentences, adds clarifications, validates output, and falls back to safe rewrites if quality checks fail.

### Token Map
A dictionary storing protected content (numbers like "$100", critical phrases like "not recommended") that must be preserved exactly during transformation. Tokens like NUM_1, PHRASE_1 are used as placeholders, then restored after processing.

### Validation Result
Output from the pipeline's quality checks indicating whether transformation passed (no grammar errors, numbers preserved, fluency maintained) and risk level (low/medium/high).

---

## Block-Based Templates

### Content Block
A single piece of content with a type (concept/ideology/stretch) and threshold (0.0-1.0). Blocks are progressively revealed based on user scalars—higher CD reveals more concept blocks, higher IA reveals more ideology blocks.

### Content Template
A collection of blocks organized by topic (e.g., "credit cards") that renders different amounts of content based on user LC, CD, IA, and stretch_norm values.

---

## Deployment Stages

### POC - Proof of Concept
Initial deployment stage with EL_MAX=5 (5 experience levels). Used for testing core TAP functionality with a smaller scale before expanding to Beta (10 levels) and Commercial (15 levels).

### Beta
Second deployment stage with EL_MAX=10. The 5 new levels are "interlaced" between existing POC levels, not simply added on top.

### Commercial
Production deployment with EL_MAX=15. Full-scale system with maximum granularity for experience-based content adaptation.

---

## Technical Terms

### NLP - Natural Language Processing
Computational techniques for analyzing and manipulating human language. TAP v2.3.1 deliberately avoids heavy NLP libraries to prevent the grammar-breaking issues that plagued earlier versions.

### Feature Flag
Configuration toggle (e.g., USE_SAFE_REWRITE_PIPELINE=true) that enables/disables specific functionality without code changes. Allows A/B testing and graceful rollback if issues arise.

### Singleton Instance
A design pattern ensuring only one instance of a class exists (e.g., one TAP engine, one AE modifier). Prevents resource duplication and ensures consistent behavior across all transformations.

---

## Key Principles (Not Acronyms, But Essential)

### No Age Buckets
TAP treats age as continuous (6, 7, 8... 99), not grouped categories like "child/teen/adult." A 12-year-old gets different content than an 11-year-old, ensuring smooth gradations.

### No Experience Buckets
EL uses discrete integer rungs (1, 2, 3, 4, 5), not fuzzy labels like "beginner/intermediate/advanced." Each rung has precise scalar values for consistent transformation.

### No Synonym Replacement
TAP does NOT swap words like "difficult→hard" or "purchase→buy." Instead, it restructures sentences, adjusts complexity, and reframes context while preserving meaning.

### Formula-Driven
All transformations use mathematical formulas (LC = 0.65×age_norm + 0.35×el_norm) rather than hardcoded dictionaries or random rules. This ensures predictable, testable, reproducible results.

### Progressive Reveal
Content blocks are revealed based on threshold comparisons (if threshold <= CD, show block). Users see more content as their scalars increase, creating a natural learning progression.

---

## Quick Reference Formula

```
age_norm = age / 100
el_norm = (EL - 1) / (EL_MAX - 1)

LC = (0.65 × age_norm) + (0.35 × el_norm)
CD = (0.85 × el_norm) + (0.15 × age_norm)
IA = (0.50 × age_norm) + (0.50 × el_norm)

stretch_EL = min(EL + 1, EL_MAX)
```

---

END OF LEGEND
