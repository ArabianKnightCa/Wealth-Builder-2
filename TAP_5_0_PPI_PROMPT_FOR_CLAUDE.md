# EMERGENT AI: PPI DATABASE REPLACEMENT & EXPANSION

## MISSION
Replace the existing PPI (Personality Profile Index) in the Mizo Wealth Builder POC database with the enhanced 30-question Layer 1 scaffold, then generate Layers 2-7 following the established architectural model for psychological depth + range refinement.

---

## CONTEXT: TAP v5.0 ARCHITECTURE

### System Flow
```
User Inputs: Age (6-99) + EL (1-5)
         ↓
    PPI Layer 1 (30 questions - BASELINE TEMPLATE)
         ↓
    TAP adapts questions based on Age + EL
         ↓
    User answers adapted questions
         ↓
    TAP processes: Answers + Age + EL
         ↓
    OUTPUT: DNA (3-6 VIA traits) + Calibrated EL
         ↓
    Used to personalize LPI lessons
```

### PPI Dual Purpose
1. **DNA Extraction**: Measure personality traits (24 VIA Character Strengths)
2. **EL Validation**: Calibrate user's self-reported experience level (1-5)

### Layer Architecture (Depth + Range Model)
- **Layer 1:** 30 questions - Broad range, shallow depth (scaffold foundation)
- **Layer 2:** 40 questions - Refined range, medium depth (interlaced between L1)
- **Layer 3:** 40 questions - Focused range, deep psychology (interlaced throughout L1+L2)
- **Layer 4:** 40 questions - Narrow range, core psychology (interlaced throughout L1-L3)
- **Layer 5:** 40 questions - Precision refinement (interlaced throughout L1-L4)
- **Layer 6:** 40 questions - Nuanced mastery (interlaced throughout L1-L5)
- **Layer 7:** 40 questions - Maximum resolution (interlaced throughout L1-L6)

**TOTAL QUESTIONS:** 30 + (40 × 6) = 270 questions across 7 layers

### Complete Depth Progression Example
```
L1_Q01: Money windfall (shallow)
  ↓
L2_Q01a: Windfall pattern (medium)
  ↓
L3_Q01a1: Windfall psychology (deep)
  ↓
L4_Q01a1a: Core impulse system (very deep)
  ↓
L5_Q01a1a1: Impulse consistency check (precision)
  ↓
L6_Q01a1a1a: Impulse vs. regulation disambiguation (nuance)
  ↓
L7_Q01a1a1a1: Absolute trait clarity under edge conditions (maximum)
```

**Key Principle:** Questions are STEALTH - users don't realize they're psychological assessments. All questions must feel like casual financial preference/scenario questions.

**Interlacing:** Later layer questions insert BETWEEN earlier questions to deepen understanding of the same psychological constructs, not add new topics.

---

## LAYER 1: ENHANCED 30-QUESTION SCAFFOLD (BASELINE TEMPLATE)

### Instructions for Database Implementation
- Replace ALL existing PPI Layer 1 questions with these 30
- Store as BASELINE TEMPLATE (neutral tone, average adult, EL 3 equivalent)
- TAP will adapt phrasing/vocabulary based on user's Age + EL before display
- Each question tagged with: question_id, layer, traits_measured, el_validation_domain

---

### PERSONALITY DNA QUESTIONS (Q1-Q20)

**PPI_L1_Q01** [Money Windfall - Impulse Control]
*"You receive unexpected money. What do you do first?"*
- A) Think about what I need or want to buy
- B) Put it aside and decide later
- C) Research the best use for it
- D) Feel excited about the possibilities

**Traits Measured:** Self-Regulation, Prudence, Judgment, Zest
**EL Validation:** None (pure personality)

---

**PPI_L1_Q02** [Risk Tolerance]
*"An opportunity could double your money or you could lose half. You:"*
- A) Take the chance - growth requires risk
- B) Pass - protecting what I have matters more
- C) Need to understand the odds first
- D) Ask someone I trust for advice

**Traits Measured:** Bravery, Prudence, Judgment, Social Intelligence
**EL Validation:** Risk literacy

---

**PPI_L1_Q03** [Time Orientation]
*"When thinking about money, your mind naturally goes to:"*
- A) What I can do with it soon
- B) Where I want to be years from now
- C) Both present needs and future goals
- D) I avoid thinking about money when possible

**Traits Measured:** Hope, Prudence, Perspective
**EL Validation:** Future orientation

---

**PPI_L1_Q04** [Delayed Gratification]
*"You want something now, but you're saving for something bigger. You:"*
- A) Get what I want now - the moment matters
- B) Stick to my plan - the bigger goal is more important
- C) Get it now but save extra to make up for it
- D) Feel torn and take time to decide

**Traits Measured:** Self-Regulation, Perseverance, Hope
**EL Validation:** None (pure personality)

---

**PPI_L1_Q05** [Social Proof]
*"Everyone is talking about a money strategy. Your reaction?"*
- A) I want to understand why it's popular
- B) I'm skeptical until I verify it myself
- C) If many people trust it, it's probably good
- D) I prefer strategies I discover on my own

**Traits Measured:** Curiosity, Judgment, Humility, Bravery
**EL Validation:** None (pure personality)

---

**PPI_L1_Q06** [Learning Style]
*"To understand how something financial works, you prefer:"*
- A) Someone explains it with examples
- B) Reading detailed information
- C) Trying it yourself and learning by doing
- D) Seeing pictures, charts, or videos

**Traits Measured:** Curiosity, Social Intelligence
**EL Validation:** Learning modality preference

---

**PPI_L1_Q07** [Error Response]
*"You made a money mistake. What's your strongest feeling?"*
- A) Frustrated that I didn't know better
- B) Determined to learn and not repeat it
- C) Embarrassed or regretful
- D) Curious about what went wrong

**Traits Measured:** Perseverance, Curiosity, Forgiveness (self), Hope
**EL Validation:** None (pure personality)

---

**PPI_L1_Q08** [Achievement Motivation]
*"Reaching a savings goal feels good because:"*
- A) I proved I could do it
- B) I can now get what I was saving for
- C) I feel more secure about the future
- D) It shows I'm disciplined

**Traits Measured:** Perseverance, Hope, Prudence, Self-Regulation
**EL Validation:** None (pure personality)

---

**PPI_L1_Q09** [Complexity Tolerance]
*"When a money topic gets complicated, you:"*
- A) Push through until it makes sense
- B) Take a break and come back later
- C) Look for a simpler explanation
- D) Ask someone to break it down

**Traits Measured:** Perseverance, Curiosity, Social Intelligence
**EL Validation:** Complexity tolerance

---

**PPI_L1_Q10** [Authority vs. Autonomy - MIDPOINT]
*"Experts say one thing, but your gut says another. You:"*
- A) Trust the experts - they know more
- B) Trust my instincts - I know myself
- C) Feel conflicted by the disagreement
- D) Research more to understand both sides

**Traits Measured:** Humility, Bravery, Judgment, Curiosity
**EL Validation:** None (pure personality)

---

**PPI_L1_Q11** [Social Comparison]
*"Someone your age is doing better financially. You feel:"*
- A) Motivated to improve my situation
- B) Happy for them, unbothered
- C) Curious what they're doing differently
- D) Discouraged or behind

**Traits Measured:** Hope, Kindness, Curiosity, Gratitude
**EL Validation:** None (pure personality)

---

**PPI_L1_Q12** [Stress Response]
*"Unexpected money problems stress you out. What helps most?"*
- A) Making a plan to handle it
- B) Talking to someone about it
- C) Knowing I've prepared for emergencies
- D) Reminding myself it's temporary

**Traits Measured:** Judgment, Social Intelligence, Prudence, Hope
**EL Validation:** Coping strategies

---

**PPI_L1_Q13** [Information Processing]
*"Before making a money decision, you need:"*
- A) All the information and time to analyze
- B) Key facts and good advice
- C) A gut feeling that it's right
- D) Just enough to feel reasonably confident

**Traits Measured:** Judgment, Prudence, Bravery
**EL Validation:** Decision-making style

---

**PPI_L1_Q14** [Money Meaning]
*"Money is mainly a tool for:"*
- A) Freedom and experiences
- B) Security and peace of mind
- C) Achieving goals and growth
- D) Taking care of people I love

**Traits Measured:** Zest, Prudence, Perseverance, Love
**EL Validation:** Value priorities

---

**PPI_L1_Q15** [Change Orientation]
*"Your current money approach isn't working. You:"*
- A) Eagerly try completely different strategies
- B) Make small adjustments
- C) Feel resistant but know change is needed
- D) Seek advice before changing

**Traits Measured:** Bravery, Prudence, Humility, Social Intelligence
**EL Validation:** None (pure personality)

---

**PPI_L1_Q16** [Structure Preference]
*"Budgets and money rules feel:"*
- A) Helpful - they keep me on track
- B) Restrictive - I prefer flexibility
- C) Necessary but sometimes frustrating
- D) Like something I should do but don't

**Traits Measured:** Self-Regulation, Zest, Perspective
**EL Validation:** None (pure personality)

---

**PPI_L1_Q17** [Wealth Definition]
*"Being 'wealthy' mainly means:"*
- A) Having choices and freedom
- B) Not worrying about money
- C) Building something that lasts
- D) Being able to help others

**Traits Measured:** Zest, Prudence, Perspective, Kindness
**EL Validation:** None (pure personality)

---

**PPI_L1_Q18** [Recovery/Resilience]
*"After a money setback, you typically:"*
- A) Bounce back quickly
- B) Need time to process first
- C) Analyze what went wrong
- D) Feel shaken for a while

**Traits Measured:** Hope, Perseverance, Judgment, Self-Regulation
**EL Validation:** Emotional resilience

---

**PPI_L1_Q19** [Future Self Connection]
*"Yourself 20 years from now feels like:"*
- A) A stranger - hard to imagine
- B) Someone I'm actively building toward
- C) Me, just older
- D) Something I hope works out

**Traits Measured:** Hope, Perspective, Perseverance
**EL Validation:** None (pure personality)

---

**PPI_L1_Q20** [Core Motivation - ENDCAP]
*"Getting better with money is really about:"*
- A) Proving I'm capable
- B) Creating the life I want
- C) Not letting myself or others down
- D) Finally feeling secure

**Traits Measured:** Perseverance, Zest, Love, Prudence
**EL Validation:** Core psychological needs

---

### EL VALIDATION + FINANCIAL PERSONALITY QUESTIONS (Q21-Q30)

**PPI_L1_Q21** [Saving Behavior]
*"When you get money, what usually happens to the part you don't spend right away?"*
- A) I put a set amount aside first
- B) I save whatever is left over
- C) I save only when I have a specific reason
- D) Saving is difficult for me

**Traits Measured:** Self-Regulation, Prudence
**EL Validation:** Savings literacy

---

**PPI_L1_Q22** [Spending Tracking]
*"How often do you know exactly how much money you have and where it went?"*
- A) I check daily or weekly
- B) I review it monthly
- C) Only when something seems wrong
- D) I usually don't track it

**Traits Measured:** Prudence, Judgment
**EL Validation:** Budgeting literacy

---

**PPI_L1_Q23** [Investing Knowledge]
*"If someone gave you money to invest, what would you do?"*
- A) Invest it in stocks, funds, or other investments I understand
- B) Put it in a savings account while I learn about investing
- C) Ask someone knowledgeable to help me invest it
- D) Investing feels too complicated right now

**Traits Measured:** Judgment, Bravery, Social Intelligence
**EL Validation:** Investment literacy

---

**PPI_L1_Q24** [Credit/Debt Understanding]
*"When you borrow money (or use credit), what matters most to you?"*
- A) Paying it back quickly to avoid extra costs
- B) Making sure I can afford the payments
- C) Only borrowing what I absolutely need
- D) I avoid borrowing money when possible

**Traits Measured:** Prudence, Judgment
**EL Validation:** Debt/credit literacy

---

**PPI_L1_Q25** [Financial Planning Style]
*"When you're working toward something you want to buy or achieve, you prefer:"*
- A) A detailed plan with specific steps and deadlines
- B) A general direction without strict timelines
- C) Small goals I can reach quickly
- D) A big vision with room to adjust along the way

**Traits Measured:** Self-Regulation, Perseverance, Perspective
**EL Validation:** Planning literacy

---

**PPI_L1_Q26** [Financial Stress Response]
*"When money problems stress you out, what happens?"*
- A) I feel more motivated to fix the situation
- B) I avoid thinking about it for a while
- C) It affects my mood or sleep
- D) I don't experience much money-related stress

**Traits Measured:** Hope, Self-Regulation, Perseverance
**EL Validation:** Stress resilience

---

**PPI_L1_Q27** [Spending Behavior Pattern]
*"When deciding whether to spend money on something, you:"*
- A) Carefully consider if it fits your plan
- B) Usually say yes but occasionally stop yourself
- C) Often decide based on how you feel at the moment
- D) Find it hard to say no to things you want

**Traits Measured:** Self-Regulation, Prudence, Judgment
**EL Validation:** Spending literacy

---

**PPI_L1_Q28** [Purchase Decision Process]
*"Before buying something that costs significant money, you:"*
- A) Compare options and prices carefully
- B) Buy it when you find a good deal
- C) Get it when you need or really want it
- D) Buy it if it feels right in the moment

**Traits Measured:** Judgment, Prudence, Self-Regulation
**EL Validation:** Consumer literacy

---

**PPI_L1_Q29** [Social Money Comfort]
*"Talking about money with friends or family feels:"*
- A) Natural and comfortable
- B) Okay when it's relevant to the situation
- C) A bit uncomfortable or awkward
- D) Too personal to discuss

**Traits Measured:** Social Intelligence, Bravery, Humility
**EL Validation:** Social financial literacy

---

**PPI_L1_Q30** [Core Motivation - Financial]
*"The main reason you want to get better with money is:"*
- A) To reach specific things you want to achieve
- B) To feel less worried or stressed about it
- C) To build security for the future
- D) To feel more capable and in control

**Traits Measured:** Perseverance, Prudence, Hope, Self-Regulation
**EL Validation:** Motivational clarity

---

## GENERATION INSTRUCTIONS FOR LAYERS 2-6

### Layer 2 (40 Questions - Medium Depth, Refined Range)

**Purpose:** Interlace between L1 questions to add depth and refine trait measurement

**Structure:**
- Generate 40 questions that insert BETWEEN the 30 L1 questions
- Each L2 question should deepen understanding of 1-2 L1 questions
- Narrow the range of facets measured (from 5 facets to 3 facets per trait)
- Increase psychological depth (from behavior to intensity/pattern)

**Example Interlacing:**
```
L1_Q02: Risk tolerance (broad: will you take risk?)
  ↓
L2_Q02a: Risk intensity (deeper: HOW MUCH risk? Under what conditions?)
L2_Q02b: Risk pattern (deeper: What drives your risk decisions - fear or opportunity?)
```

**Generation Rules:**
1. Each L2 question must reference the psychological territory of a specific L1 question
2. Questions must probe DEEPER into the same construct, not introduce new topics
3. Maintain stealth - still feel like casual financial scenarios
4. Must be TAP-adaptable across age 6-99, EL 1-5
5. Mix personality depth + EL validation (60% personality, 40% EL)

**Tagging Requirements:**
- question_id: PPI_L2_Q01 through PPI_L2_Q40
- parent_questions: [L1_Q## it deepens]
- depth_level: "medium"
- facets_measured: [specific trait facets]
- el_validation_domain: [if applicable]

---

### Layer 3 (40 Questions - Deep Psychology, Focused Range)

**Purpose:** Interlace throughout L1+L2 to probe psychological drivers and emotional aspects

**Structure:**
- Generate 40 questions interlaced throughout L1+L2
- Narrow range further (from 3 facets to 2 facets per trait)
- Reveal emotional/cognitive psychology behind behaviors
- Probe trait interactions (e.g., how Curiosity + Prudence interact)

**Example Interlacing:**
```
L1_Q07: Error response (shallow: what do you feel?)
  ↓
L2_Q07a: Error pattern (medium: how do you cope?)
  ↓
L3_Q07a1: Error psychology (deep: what's the emotional reward system? Growth mindset?)
```

**Generation Rules:**
1. Questions reveal WHY users think/feel the way they do
2. Probe emotional drivers, not just behavioral patterns
3. Measure trait strength on continuum (weak to strong expression)
4. Still stealth, still financial context
5. TAP-adaptable across all ages/ELs

**Tagging Requirements:**
- question_id: PPI_L3_Q01 through PPI_L3_Q40
- parent_questions: [L1_Q## and L2_Q## it deepens]
- depth_level: "deep_psychology"
- psychological_constructs: [specific constructs measured]

---

### Layer 4 (40 Questions - Core Psychology, Narrow Range)

**Purpose:** Target fundamental motivations and core personality structure

**Structure:**
- Generate 40 questions interlaced throughout L1-L3
- Narrowest range (1 core aspect per trait)
- Maximum psychological depth
- Reveal trait hierarchy (which traits dominate decision-making)

**Example Interlacing:**
```
L1_Q04: Delayed gratification (shallow: can you wait?)
  ↓
L2_Q04a: Gratification pattern (medium: under what circumstances?)
  ↓
L3_Q04a1: Gratification psychology (deep: what's the internal experience?)
  ↓
L4_Q04a1a: Core motivation (very deep: is self-regulation a fundamental driver or learned skill?)
```

**Generation Rules:**
1. Questions target core psychological needs (autonomy, competence, belonging, security)
2. Reveal whether traits are intrinsic or situational
3. Measure trait stability across contexts
4. Distinguish between strong/weak trait expression
5. Still feel like financial scenarios (stealth maintained)

**Tagging Requirements:**
- question_id: PPI_L4_Q01 through PPI_L4_Q40
- parent_questions: [full lineage from L1]
- depth_level: "core_psychology"
- core_needs_measured: [autonomy/competence/belonging/security]

---

### Layer 5 (40 Questions - Precision Refinement)

**Purpose:** Refine trait measurements to highest precision, validate consistency

**Structure:**
- Generate 40 questions that cross-validate earlier responses
- Test trait consistency across different financial scenarios
- Identify trait polarity (strong embrace vs. strong rejection)
- Catch inconsistencies or social desirability contamination

**Generation Rules:**
1. Questions present same psychological construct in different financial contexts
2. Validate if user's trait expression is consistent or context-dependent
3. Refine confidence scores for each trait
4. Measure trait interaction effects

**Tagging Requirements:**
- question_id: PPI_L5_Q01 through PPI_L5_Q40
- validates_questions: [which earlier questions this cross-checks]
- depth_level: "precision_refinement"
- validation_type: "consistency" or "interaction"

---

### Layer 6 (40 Questions - Nuanced Mastery)

**Purpose:** Achieve maximum psychological resolution, catch edge cases

**Structure:**
- Generate 40 questions for final trait disambiguation
- Separate highly correlated traits (e.g., Prudence vs. Self-Regulation)
- Identify trait expression nuances (situational variability)
- Achieve 95%+ confidence in DNA output

**Generation Rules:**
1. Questions distinguish between commonly confused traits
2. Probe trait expression under stress, conflict, uncertainty
3. Identify authentic vs. aspirational self-concept
4. Final validation of EL calibration

**Tagging Requirements:**
- question_id: PPI_L6_Q01 through PPI_L6_Q40
- disambiguates_traits: [which trait pairs it separates]
- depth_level: "nuanced_mastery"
- confidence_impact: "high"

---

### Layer 7 (40 Questions - Maximum Resolution)

**Purpose:** Achieve absolute trait clarity under edge conditions, final cross-validation

**Structure:**
- Generate 40 questions interlaced throughout L1-L6
- Test trait expression under extreme/unusual financial scenarios
- Final disambiguation of all remaining trait ambiguities
- Handle edge cases that earlier layers couldn't resolve
- Achieve 99%+ confidence in DNA output

**Example Interlacing:**
```
L6_Q01a1a1a: Impulse vs. regulation disambiguation (nuance)
  ↓
L7_Q01a1a1a1: Absolute trait clarity under edge conditions (maximum)
  - "You unexpectedly inherit a large sum, but there's a catch - you must decide how to use it within 24 hours or it goes to charity. You:"
```

**Generation Rules:**
1. Questions present unusual, high-stakes, or time-pressured financial scenarios
2. Force trait expression under stress/constraint to reveal authentic patterns
3. Final cross-validation of all trait measurements from L1-L6
4. Identify any remaining inconsistencies or edge cases
5. Distinguish authentic personality from situational adaptation
6. Still maintain stealth - scenarios feel realistic, not contrived

**Tagging Requirements:**
```json
{
  "question_id": "PPI_L7_Q01 through PPI_L7_Q40",
  "layer": 7,
  "parent_questions": ["full lineage from L1 through L6"],
  "depth_level": "maximum_resolution",
  "validation_type": "final_cross_validation",
  "confidence_impact": "critical",
  "edge_case_handling": "extreme_conditions",
  "traits_measured": ["applicable VIA traits"],
  "el_validation_domain": "domain or null",
  "tap_adaptation_notes": "guidance for TAP",
  "age_range_suitability": [6, 99],
  "el_range_suitability": [1, 5]
}
```

**Edge Condition Categories:**
- Time pressure scenarios (must decide quickly)
- High stakes scenarios (significant money at risk)
- Conflicting values scenarios (two good options compete)
- Social pressure scenarios (others expect different choice)
- Uncertainty scenarios (incomplete information)
- Recovery scenarios (after failure or loss)
- Windfall scenarios (unexpected gain)
- Sacrifice scenarios (give up something valued)

---

## OUTPUT REQUIREMENTS

### Database Structure

For each question across all layers, provide:

```json
{
  "question_id": "PPI_L#_Q##",
  "layer": 1-7,
  "question_text_baseline": "Question in neutral tone, average adult, EL 3",
  "options": [
    {"letter": "A", "text": "Option text", "delta_weights": {...}},
    {"letter": "B", "text": "Option text", "delta_weights": {...}},
    {"letter": "C", "text": "Option text", "delta_weights": {...}},
    {"letter": "D", "text": "Option text", "delta_weights": {...}}
  ],
  "traits_measured": ["Trait1", "Trait2", ...],
  "el_validation_domain": "domain_name or null",
  "parent_questions": ["PPI_L#_Q##", ...],
  "depth_level": "shallow|medium|deep_psychology|core_psychology|precision_refinement|nuanced_mastery|maximum_resolution",
  "tap_adaptation_notes": "Guidance for how TAP should adapt this question",
  "age_range_suitability": [6, 99],
  "el_range_suitability": [1, 5]
}
```

### Layer 7 Extended Schema

For Layer 7 questions specifically, include additional fields:

```json
{
  "question_id": "PPI_L7_Q##",
  "layer": 7,
  "parent_questions": ["full lineage from L1 through L6"],
  "depth_level": "maximum_resolution",
  "validation_type": "final_cross_validation",
  "confidence_impact": "critical",
  "edge_case_handling": "extreme_conditions",
  "edge_case_category": "time_pressure|high_stakes|conflicting_values|social_pressure|uncertainty|recovery|windfall|sacrifice",
  "traits_measured": ["applicable VIA traits"],
  "el_validation_domain": "domain or null",
  "tap_adaptation_notes": "guidance for TAP",
  "age_range_suitability": [6, 99],
  "el_range_suitability": [1, 5]
}
```

### Delta Weighting Structure

For each option, provide delta weights for VIA traits:

```json
"delta_weights": {
  "Curiosity": 0.3,
  "Hope": 0.2,
  "Prudence": -0.1,
  ...
}
```

**Rules:**
- Deltas range from -1.0 to +1.0
- Positive = strengthens trait expression
- Negative = weakens trait expression
- Each option affects 1-5 traits (Layer 1), narrowing to 1-2 traits (Layer 6)
- Total absolute delta per option should decrease with layer depth (broader in L1, focused in L6)

---

## VIA CHARACTER STRENGTHS REFERENCE (24 Traits)

**Wisdom:** Creativity, Curiosity, Judgment, Love of Learning, Perspective
**Courage:** Bravery, Perseverance, Honesty, Zest
**Humanity:** Love, Kindness, Social Intelligence
**Justice:** Teamwork, Fairness, Leadership
**Temperance:** Forgiveness, Humility, Prudence, Self-Regulation
**Transcendence:** Appreciation of Beauty, Gratitude, Hope, Humor, Spirituality

---

## DELIVERABLE

Generate a complete JSON file containing:

1. **Layer 1:** 30 questions (as specified above in detail)
2. **Layer 2:** 40 questions (interlaced, medium depth)
3. **Layer 3:** 40 questions (interlaced, deep psychology)
4. **Layer 4:** 40 questions (interlaced, core psychology)
5. **Layer 5:** 40 questions (precision refinement)
6. **Layer 6:** 40 questions (nuanced mastery)
7. **Layer 7:** 40 questions (maximum resolution, edge cases)

**TOTAL QUESTION COUNT:** 270 questions across 7 layers
- Layer 1: 30 questions
- Layers 2-7: 240 questions (40 per layer × 6 layers)

**File Format:** JSON
**File Name:** `ppi_complete_7layer_v5.json`

---

## VALIDATION CHECKLIST

Before finalizing, ensure:

- [ ] All 270 questions are in baseline neutral tone (average adult, EL 3)
- [ ] Every question is TAP-adaptable across age 6-99, EL 1-5
- [ ] All questions maintain financial context (stealth personality assessment)
- [ ] L2-L7 questions clearly interlace with parent questions
- [ ] Depth progression is evident (shallow → medium → deep → core → precision → nuance → maximum)
- [ ] Range contraction is evident (5 facets → 1 core aspect → absolute clarity)
- [ ] All 24 VIA traits are measurable across the question bank
- [ ] EL validation domains covered (savings, budgeting, investing, debt, planning, spending, consumer behavior)
- [ ] Delta weights are assigned to all options
- [ ] No social desirability bias (behavioral scenarios, not self-report)
- [ ] Questions feel natural, not clinical or academic
- [ ] Layer 7 achieves maximum resolution and handles edge cases
- [ ] Layer 7 includes all 8 edge case categories (time_pressure, high_stakes, conflicting_values, social_pressure, uncertainty, recovery, windfall, sacrifice)

---

## FINAL NOTE

This PPI will be the foundation of TAP v5.0's competitive advantage. Every question must be:
- **Psychologically sound** (measures what it claims to measure)
- **Financially relevant** (connects to LPI lessons)
- **Universally adaptable** (works for 6-year-olds and 99-year-olds)
- **Behaviorally revealing** (shows who they are, not what they say)
- **Engagement-optimized** (feels like a conversation, not a test)

Generate the complete 6-layer PPI now.
