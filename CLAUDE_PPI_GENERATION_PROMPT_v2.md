# Claude Prompt: Generate Complete 7-Layer PPI for Wealth Builder

## PRE-GENERATION CONFIRMATION

Before generating the PPI, please confirm you will include ALL of the following:

**Answer YES to each:**
1. ☐ Using the **24 VIA Character Strengths** framework as the psychological foundation?
2. ☐ Following the **7-layer psychological depth model** (Baseline → Meta-Awareness)?
3. ☐ Outputting **valid JSON** matching the exact schema below?
4. ☐ Including **delta_weights** for granular trait scoring on ALL MCQ questions?
5. ☐ Maintaining **stealth assessment design** (questions feel like financial conversations, not psych tests)?
6. ☐ Creating exactly **270 questions** (30 in L1, 40 each in L2-L7)?
7. ☐ Ensuring all **24 VIA traits** are measured multiple times across layers?
8. ☐ Using **~60% Likert / ~40% MCQ** distribution per layer?

---

## MISSION
Generate a complete, psychologically-sound 270-question Personality Profile Instrument (PPI) for the Mizo Wealth Builder application. This PPI measures the 24 VIA Character Strengths through stealth financial scenarios, outputting a user's "Financial DNA" for personalized learning.

---

## CRITICAL REQUIREMENTS

### 1. Output Format (JSON Schema)
Generate a JSON file with this exact structure:

```json
{
  "schema_version": "4.0.0",
  "ppi_bank_version": "Full-270Q-VIA-v4",
  "note": "Complete 7-Layer PPI based on VIA 24 Character Strengths. 270 total questions. Psychologically validated.",
  "layers": {
    "L1": {"start": 1, "end": 30, "focus": "Baseline - What do you do?"},
    "L2": {"start": 31, "end": 70, "focus": "Situational - What do you do WHEN...?"},
    "L3": {"start": 71, "end": 110, "focus": "Motivations - WHY do you do that?"},
    "L4": {"start": 111, "end": 150, "focus": "Patterns - What patterns do you notice?"},
    "L5": {"start": 151, "end": 190, "focus": "Origins - Where did this come from?"},
    "L6": {"start": 191, "end": 230, "focus": "Blind Spots - What are your blind spots?"},
    "L7": {"start": 231, "end": 270, "focus": "Meta-Awareness - What do you understand now?"}
  },
  "items": [
    // Questions go here
  ]
}
```

### 2. Question Item Schema
Each question must follow this schema:

**For MCQ (Multiple Choice) Questions:**
```json
{
  "id": "PPI_Q001",
  "layer": 1,
  "type": "mcq",
  "prompt": "Question text goes here",
  "options": [
    "A First option text",
    "B Second option text", 
    "C Third option text",
    "D Fourth option text"
  ],
  "via_trait": "Primary VIA Trait Name",
  "weight": 6,
  "delta_weights": {
    "A": {"Trait1": 0.3, "Trait2": -0.1},
    "B": {"Trait1": 0.1, "Trait3": 0.2},
    "C": {"Trait2": 0.2, "Trait4": 0.1},
    "D": {"Trait1": -0.2, "Trait5": 0.1}
  }
}
```

**For Likert Scale Questions:**
```json
{
  "id": "PPI_Q002",
  "layer": 1,
  "type": "likert",
  "prompt": "Statement for agreement scale",
  "via_trait": "Primary VIA Trait Name",
  "weight": 7
}
```

### 3. Question Distribution Rules
- **Total Questions:** 270
- **Layer 1:** 30 questions (Baseline behaviors)
- **Layers 2-7:** 40 questions each (240 total)
- **Type Mix:** Approximately 60% Likert, 40% MCQ per layer
- **Trait Coverage:** Each of the 24 VIA traits must be measured multiple times across layers

---

## VIA CHARACTER STRENGTHS (24 Traits to Measure)

### Wisdom & Knowledge
1. **Creativity** - Novel ways to think about and do things
2. **Curiosity** - Interest, novelty-seeking, openness to experience
3. **Judgment** - Critical thinking, thinking things through
4. **Love of Learning** - Mastering new skills and topics
5. **Perspective** - Wisdom, providing wise counsel

### Courage
6. **Bravery** - Not shrinking from threat, challenge, or pain
7. **Perseverance** - Finishing what one starts, persistence
8. **Honesty** - Speaking the truth, being authentic
9. **Zest** - Vitality, approaching life with energy

### Humanity
10. **Love** - Valuing close relations with others
11. **Kindness** - Generosity, nurturance, care
12. **Social Intelligence** - Awareness of motives and feelings

### Justice
13. **Teamwork** - Working well as a group member
14. **Fairness** - Treating people equally
15. **Leadership** - Organizing group activities

### Temperance
16. **Forgiveness** - Forgiving those who have done wrong
17. **Humility** - Letting accomplishments speak for themselves
18. **Prudence** - Being careful about choices
19. **Self-Regulation** - Controlling impulses and emotions

### Transcendence
20. **Appreciation of Beauty** - Noticing excellence in all domains
21. **Gratitude** - Being thankful for good things
22. **Hope** - Expecting the best, working to achieve it
23. **Humor** - Liking to laugh and joke
24. **Spirituality** - Beliefs about higher purpose and meaning

---

## LAYER-BY-LAYER GENERATION GUIDELINES

### LAYER 1: Baseline (Q001-Q030)
**Focus:** "What do you DO?" - Surface behaviors and preferences
**Psychological Depth:** Shallow - Observable actions
**Question Style:** 
- Direct behavioral scenarios
- "When X happens, you typically..."
- "Your approach to Y is..."

**Example:**
```json
{
  "id": "PPI_Q001",
  "layer": 1,
  "type": "mcq",
  "prompt": "You receive unexpected money. What do you do first?",
  "options": [
    "A Think about what I need or want to buy",
    "B Put it aside and decide later",
    "C Research the best use for it",
    "D Feel excited about the possibilities"
  ],
  "via_trait": "Self-Regulation",
  "weight": 7,
  "delta_weights": {
    "A": {"Zest": 0.2, "Self-Regulation": -0.2},
    "B": {"Prudence": 0.3, "Self-Regulation": 0.2},
    "C": {"Judgment": 0.3, "Curiosity": 0.2},
    "D": {"Zest": 0.3, "Hope": 0.2}
  }
}
```

### LAYER 2: Situational (Q031-Q070)
**Focus:** "What do you do WHEN specific conditions apply?"
**Psychological Depth:** Medium - Context-dependent responses
**Question Style:**
- Conditional scenarios
- "When you're stressed about money..."
- "If a friend needed financial help..."

### LAYER 3: Motivations (Q071-Q110)
**Focus:** "WHY do you do what you do?"
**Psychological Depth:** Deep - Underlying drivers
**Question Style:**
- Probing motivations
- "What drives your financial decisions?"
- "The main reason you save/spend is..."

### LAYER 4: Patterns (Q111-Q150)
**Focus:** "What PATTERNS do you notice in yourself?"
**Psychological Depth:** Very Deep - Self-observed tendencies
**Question Style:**
- Pattern recognition
- "I notice that when X, I tend to Y..."
- "A recurring theme in my money behavior is..."

### LAYER 5: Origins (Q151-Q190)
**Focus:** "WHERE did these patterns come from?"
**Psychological Depth:** Developmental - Formative influences
**Question Style:**
- Upbringing and history
- "Growing up, money was..."
- "I learned about saving from..."

### LAYER 6: Blind Spots (Q191-Q230)
**Focus:** "What am I NOT seeing about myself?"
**Psychological Depth:** Shadow - Hidden aspects
**Question Style:**
- Self-deception awareness
- "The hardest thing to admit about my money habits..."
- "Others might say I..."

### LAYER 7: Meta-Awareness (Q231-Q270)
**Focus:** "What do I NOW understand about myself?"
**Psychological Depth:** Maximum - Integrated insight
**Question Style:**
- Synthesis and integration
- "Looking at my full picture..."
- "My relationship with money is really about..."

---

## PSYCHOLOGICAL DESIGN PRINCIPLES

### 1. Stealth Assessment
Questions must feel like casual financial discussions, NOT psychological tests.
- ❌ "Do you exhibit traits of conscientiousness?"
- ✅ "When you get a bonus at work, what's your first instinct?"

### 2. Behavioral Anchoring
Base questions on observable behaviors, not self-reported traits.
- ❌ "I am a careful person"
- ✅ "Before making a big purchase, I typically..."

### 3. Balanced Options
Each MCQ option should be plausible and non-judgmental.
- No obviously "right" answers
- Each option reveals different trait combinations
- Avoid social desirability bias

### 4. Age-Universal
Questions must work for ages 6-99 with TAP adaptation:
- Use simple core concepts
- Avoid jargon
- Scenarios should be relatable across life stages

### 5. Progressive Disclosure
Later layers build on earlier ones:
- L1 establishes baseline
- L2-L4 explore variations
- L5 traces origins
- L6 reveals blind spots
- L7 synthesizes understanding

---

## DELTA WEIGHT GUIDELINES

For MCQ questions, each option should have `delta_weights` showing how that answer affects trait scores:

**Ranges:**
- Strong positive: +0.3 to +0.5
- Moderate positive: +0.1 to +0.2
- Neutral: 0
- Moderate negative: -0.1 to -0.2
- Strong negative: -0.3 to -0.5

**Rules:**
- Each option affects 2-4 traits
- Primary trait (listed in `via_trait`) should have strongest delta
- Related traits have smaller deltas
- Opposite traits may have negative deltas
- Total absolute value per option: 0.4 to 0.8 (decreasing with layer depth)

**Example delta logic:**
Option A (impulsive choice) → Self-Regulation: -0.3, Zest: +0.2
Option B (cautious choice) → Prudence: +0.3, Self-Regulation: +0.2

---

## WEIGHT GUIDELINES

The `weight` field (1-10 scale) indicates question importance for trait scoring:
- **9-10:** Critical trait indicators (Self-Regulation, Prudence, Hope)
- **7-8:** Strong indicators
- **5-6:** Moderate indicators
- **3-4:** Supporting indicators

---

## VALIDATION CHECKLIST

Before finalizing, ensure:

- [ ] Exactly 270 questions total
- [ ] Layer 1 has 30 questions, Layers 2-7 have 40 each
- [ ] ~60% Likert, ~40% MCQ distribution per layer
- [ ] All 24 VIA traits measured across layers
- [ ] No obviously "correct" answers in MCQs
- [ ] Questions feel like financial conversations, not psychology tests
- [ ] Progressive psychological depth from L1 to L7
- [ ] MCQ options all have delta_weights
- [ ] IDs sequential: PPI_Q001 through PPI_Q270
- [ ] All options formatted as "A text", "B text", etc.
- [ ] Questions work across ages 6-99 with adaptation
- [ ] No jargon or complex financial terms in base form

---

## OUTPUT INSTRUCTIONS

1. Generate the complete JSON structure
2. Include all 270 questions
3. Ensure valid JSON syntax
4. Name the output: `ppi_complete_7layer_v4.json`
5. Questions should be entirely new, not copied from existing sources

---

## EXAMPLE QUESTIONS BY LAYER

### Layer 1 Example (Baseline)
```json
{
  "id": "PPI_Q005",
  "layer": 1,
  "type": "likert",
  "prompt": "I think about future consequences before spending money.",
  "via_trait": "Prudence",
  "weight": 9
}
```

### Layer 3 Example (Motivations)
```json
{
  "id": "PPI_Q085",
  "layer": 3,
  "type": "mcq",
  "prompt": "What's the main reason you want to be better with money?",
  "options": [
    "A To prove I'm capable and responsible",
    "B To create the life I've always wanted",
    "C To not let down the people who count on me",
    "D To finally feel secure and stop worrying"
  ],
  "via_trait": "Hope",
  "weight": 8,
  "delta_weights": {
    "A": {"Perseverance": 0.3, "Self-Regulation": 0.2},
    "B": {"Zest": 0.3, "Hope": 0.2},
    "C": {"Love": 0.3, "Kindness": 0.2},
    "D": {"Prudence": 0.3, "Hope": 0.1}
  }
}
```

### Layer 6 Example (Blind Spots)
```json
{
  "id": "PPI_Q210",
  "layer": 6,
  "type": "likert",
  "prompt": "I realize I sometimes confuse being careful with being afraid.",
  "via_trait": "Bravery",
  "weight": 7
}
```

### Layer 7 Example (Meta-Awareness)
```json
{
  "id": "PPI_Q255",
  "layer": 7,
  "type": "mcq",
  "prompt": "What have you learned about yourself and money through this reflection?",
  "options": [
    "A My patterns are more consistent than I realized",
    "B My relationship with money connects to deeper needs",
    "C I have more control over my habits than I thought",
    "D There's still much I don't understand about myself"
  ],
  "via_trait": "Perspective",
  "weight": 9,
  "delta_weights": {
    "A": {"Judgment": 0.3, "Perspective": 0.2},
    "B": {"Perspective": 0.3, "Spirituality": 0.2},
    "C": {"Self-Regulation": 0.3, "Hope": 0.2},
    "D": {"Humility": 0.3, "Curiosity": 0.2}
  }
}
```

---

## NOW GENERATE

Please generate the complete 270-question PPI following all guidelines above. Output as valid JSON.
