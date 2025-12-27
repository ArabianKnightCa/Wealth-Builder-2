# TAP 3.2 Revision Request - Child Comprehension Problem

## Current Problem

TAP 3.2 is NOT working for young users. The output is still incomprehensible for a 6-year-old because:

1. **Baseline text is too complex** - Even with decode lines, sentences like "Money is a shared agreement" are beyond a 6yo's grammar/vocabulary level
2. **PPI options use adult concepts** - Options like "bills or debt" mean nothing to a child
3. **Decode lines don't solve the core problem** - Adding `🔎 Decode: Money is a shared agreement (when everyone agrees...)` doesn't help if the child can't parse the original sentence structure

---

## Current TAP 3.2 Output (FAILING)

### LPI Output for 6yo EL1:
```
📌 Let's learn about money!
We'll keep it clear and use examples.

First, here's the simple idea. Then we'll show the expert words.

---

Money is a shared agreement.

🔎 Decode: Money is a shared agreement (when everyone agrees money can be used).

💡 'shared agreement' means: when everyone agrees money can be used.
```

**PROBLEM**: A 6-year-old cannot read or understand "Money is a shared agreement" - the grammar structure, vocabulary, and abstract concept are all too advanced. The decode line comes AFTER they've already failed to understand.

### PPI Output for 6yo EL1:
```
Question: When making financial decisions, I prefer to:
💡 This question is asking how you like to choose when money is involved.

A. Look up information first  -> You like to learn first, then choose.
B. Go with what feels right  -> You choose fast based on feelings.
C. Ask a grown-up I trust  -> You like help from people you know.
D. Follow advice from experts  -> You trust people who study this stuff.
```

**PROBLEM**: 
- "financial decisions" - child doesn't know this phrase
- Options still reference adult concepts
- Real PPI questions have options like "Pay off bills or debt" which are meaningless to a 6yo

---

## What a 6-Year-Old ACTUALLY Needs

### LPI Content Should Look Like:
```
🌟 What is Money?

Money is the coins and paper bills you use to buy things!

When you go to a store and want candy, you give the person money, and they give you the candy. That's how money works - it's like trading, but easier!

---

📖 Here's how grown-ups say it:

"Money is a shared agreement. We accept it today because we believe others will accept it tomorrow."

This means: Everyone agrees that money can buy things. If you have a dollar today, you can use it tomorrow too!
```

### PPI Questions Should Look Like:
```
🤔 When you want to buy something, what do you do?

A. Ask mom or dad to help me decide
B. Pick what looks the coolest
C. Think about it for a long time
D. Get what my friends have
```

NOT:
```
When making financial decisions, I prefer to:
A. Research extensively before deciding
B. Go with my gut feeling
C. Ask friends or family for advice  
D. Follow what experts recommend
```

---

## Technical Requirements

### For LPI Processing:

1. **For LC < 0.15 (ages 6-10, EL 1-2)**:
   - Generate a CHILD-FRIENDLY VERSION first (simple words, short sentences, concrete examples)
   - THEN show the baseline as "Here's how grown-ups say it:" (optional/collapsible)
   - The child-friendly version IS the primary content, not scaffolding

2. **For LC 0.15-0.30 (ages 10-14, EL 1-3)**:
   - Show a BRIDGE introduction that simplifies the concept
   - Then show baseline with inline decode support
   
3. **For LC > 0.30 (older teens/adults)**:
   - Current approach is fine (baseline + scaffolding)

### For PPI Processing:

1. **For LC < 0.15**:
   - REWRITE the question stem into child language
   - REWRITE each option into child-appropriate choices
   - Map child answers back to original option keys for scoring

2. **For LC 0.15-0.30**:
   - Simplify question stem
   - Add glosses to complex options
   
3. **For LC > 0.30**:
   - Keep original questions/options

---

## Data Structures Needed

### LPI Content Database Should Have:
```python
{
    "lesson_id": "CH01_L01",
    "baseline_text": "Money is a shared agreement...",  # Expert version (immutable)
    "child_version": "Money is the coins and paper bills you use to buy things...",  # Pre-written for LC < 0.15
    "teen_bridge": "Let's break down what money really is...",  # Bridge for LC 0.15-0.30
    "concepts": ["money", "trade", "value"]
}
```

### PPI Question Database Should Have:
```python
{
    "question_id": "PPI_Q01",
    "question_text": "When making financial decisions, I prefer to:",  # Original
    "question_child": "When you want to buy something, what do you do?",  # For LC < 0.15
    "options": [
        {
            "id": "A",
            "text": "Research extensively before deciding",  # Original
            "text_child": "Ask mom or dad to help me decide",  # For LC < 0.15
            "key": "RESEARCH_FIRST"
        },
        ...
    ]
}
```

---

## Constraints

1. **Baseline Immutability** - The expert baseline text must be preserved and shown somewhere (can be secondary/collapsible for young users)
2. **Deterministic** - Same inputs produce same outputs
3. **Continuous Formulas** - LC/CD/IA calculations remain continuous
4. **Answer Mapping** - Child PPI answers must map to the same trait scoring as adult answers

---

## Questions for You (ChatGPT)

1. **Should child-friendly content be pre-written in the database, or generated by formula/template?**
   - Pre-written = more control, but requires content for every lesson
   - Generated = more scalable, but risk of inappropriate output

2. **How should the "show expert version" toggle work for young users?**
   - Always show both (child first, expert second)?
   - Collapsible expert section?
   - Progressive reveal as user advances?

3. **For PPI, should child options be completely different questions, or simplified versions of the same question?**
   - Different questions may not map to the same traits
   - Simplified versions may still be confusing

4. **What's the minimum viable implementation?**
   - Just fix PPI options for now?
   - Full child-friendly LPI content?
   - Both?

---

## Deliverables Requested

Please provide:

1. **Revised `TAP32Engine` class** that handles LC < 0.15 appropriately
2. **Updated data models** for child-friendly content variants
3. **PPI option mapping** for child-appropriate alternatives
4. **Sample child-friendly content** for the "Money Basics" lesson
5. **Clear explanation** of how baseline immutability is preserved while showing child-friendly content first

Make it a complete, runnable Python file with test cases showing output for:
- 6yo EL1 (LC ≈ 0.04)
- 12yo EL2 (LC ≈ 0.17)
- 35yo EL5 (LC ≈ 0.58)
