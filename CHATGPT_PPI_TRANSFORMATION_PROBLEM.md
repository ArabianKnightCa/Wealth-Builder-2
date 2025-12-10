# PPI Language Transformation Problem - Need AI-Powered Solution

## CONTEXT
Building an adaptive financial education app (Mizo Wealth Builder) that personalizes content based on:
- **Age**: 6-99 years old
- **Experience**: Beginner (1) to Expert (5)
- **Personality (PPI)**: Financial DNA from questionnaire
- **Goals**: User's financial objectives

## THE PROBLEM WE'VE BEEN STUCK ON FOR HOURS

### What We Need (CORRECT APPROACH):
A FLEXIBLE, ADAPTABLE system that can take ANY baseline content (like a 5,000-word college essay) and dynamically transform it to be appropriate for:
- A 7-year-old beginner
- A 15-year-old intermediate
- A 40-year-old expert
- ANY age/experience combination

The transformation should handle:
- Vocabulary simplification
- Sentence structure adjustment
- Concept complexity
- Examples and analogies
- Tone and framing

### What We Built (WRONG APPROACH):
A static dictionary with hardcoded find-and-replace rules like:
```python
'financial decisions': {
    'child': 'money choices',
    'teen': 'money decisions',
    'adult': 'financial decisions'
}
```

**Why This is Wrong:**
- Not scalable - would need 1000s of dictionary entries
- Not flexible - can't handle new content
- Not truly adaptive - just word swapping
- Brittle and unmaintainable

## WHAT WE ACTUALLY NEED

An AI-powered transformation system that:
1. Takes baseline content (PPI questions, lesson text, etc.)
2. Analyzes user profile (age=7, experience=1)
3. Uses an LLM to rewrite the content appropriately
4. Returns transformed text

**Example:**
- **Input (baseline)**: "When making financial decisions, I prefer to research extensively before deciding"
- **User**: Age 7, Experience 1 (beginner)
- **Output**: "When I need to choose about money, I like to ask my mom or dad for help"

## CURRENT CODE STRUCTURE

### 1. Content Transformer (content_transformer.py)
Currently has a `transform_ppi_question()` method that uses dictionary replacements.

### 2. Adaptive Engine (ae_engine_v2.py)
The `compose_ppi()` method calls the transformer to adapt questions.

### 3. Integration
Backend endpoint `/api/content/ppi/personalized` returns adapted questions.

## TECHNICAL REQUIREMENTS

1. **LLM Integration Available**: 
   - We have an "Emergent LLM Key" that works with OpenAI, Anthropic, Google
   - Can use `emergentintegrations` library for API calls

2. **Performance**: 
   - PPI has 20 questions, each with 4 options
   - Need to transform 100 text strings (20 questions + 80 options)
   - Should complete in reasonable time (<10 seconds)

3. **Deterministic**: 
   - Same age/experience should produce same output
   - Use temperature=0 for consistency

## REQUEST FOR CHATGPT

**Please provide:**

1. **Architecture Recommendation**: 
   - Should we call LLM for each string, batch them, or pre-generate for age bands?
   - How to balance quality vs performance?

2. **Implementation Approach**:
   - Exact prompt template for the LLM
   - How to structure the API call
   - Code structure for the transformer

3. **Sample Code**:
   - A working `transform_ppi_question()` method using LLM
   - Prompt engineering for age/experience adaptation
   - Error handling and fallbacks

4. **Optimization Strategy**:
   - Caching mechanism for transformed content
   - Batch processing approach
   - Cost optimization

## CURRENT RELEVANT CODE

### File: /app/backend/content_transformer.py (RELEVANT SECTION)
```python
def transform_ppi_question(self, question_text: str, age: int, experience: str) -> str:
    """
    Transform a PPI question to be age and experience appropriate
    
    Args:
        question_text: The baseline PPI question text
        age: User's age
        experience: User's financial experience level ('beginner', 'intermediate', 'advanced')
    
    Returns:
        Transformed question text
    """
    age_band = self._get_age_band(age)
    
    # Apply age-based adjustments
    transformed = self._adjust_for_age(question_text, age_band)
    
    # Apply experience-based adjustments
    transformed = self._adjust_for_experience(transformed, experience)
    
    return transformed

def _get_age_band(self, age: int) -> str:
    """Determine age band category"""
    if MINIMUM_USER_AGE <= age <= CHILD_AGE_MAX:  # 6-12
        return 'child'
    elif CHILD_AGE_MAX < age <= TEEN_AGE_MAX:  # 13-17
        return 'teen'
    else:
        return 'adult'
```

### File: /app/backend/ae_engine_v2.py (COMPOSE_PPI METHOD)
```python
def compose_ppi(self, user_id: str, age: int, financial_experience: str, 
               occupation_bucket: str = None, locale: str = "en-US") -> Dict[str, Any]:
    # ... selection logic to pick 20 questions from bank ...
    
    # Format output with transformation
    transformer = get_content_transformer()
    output_items = []
    for idx, item in enumerate(final_items, 1):
        # Transform the question prompt
        transformed_prompt = transformer.transform_ppi_question(
            item['prompt'],
            age,
            financial_experience
        )
        
        # Transform each option
        transformed_options = []
        for option in item['options']:
            if len(option) > 2 and option[0].isalpha() and (option[1] == ' ' or option[1] == '.'):
                letter = option[0]
                option_text = option[2:].strip() if option[1] == '.' else option[1:].strip()
                transformed_text = transformer.transform_ppi_question(
                    option_text,
                    age,
                    financial_experience
                )
                transformed_options.append(f"{letter}. {transformed_text}")
            else:
                transformed_options.append(option)
        
        output_items.append({
            "question_id": f"PPI_Q{idx:02d}",
            "bank_id": item['id'],
            "type": item['type'],
            "prompt": transformed_prompt,
            "options": transformed_options
        })
    
    return {
        "ppi_version": "POC-v1.1.1",
        "items": output_items,
        "user_id": user_id,
        "age": age,
        "financial_experience": financial_experience,
        "composed_at": datetime.utcnow().isoformat() + "Z"
    }
```

### Example PPI Question from Bank:
```json
{
  "id": "ppi_01",
  "type": "decision_style",
  "prompt": "When making financial decisions, I prefer to:",
  "options": [
    "A Research extensively before deciding",
    "B Go with my gut feeling",
    "C Ask friends or family for advice",
    "D Follow what experts recommend"
  ],
  "age_min": 6,
  "age_max": 99,
  "experience_levels": ["beginner", "intermediate", "advanced"]
}
```

## DELIVERABLE NEEDED

Please provide a complete, working solution that:
1. Uses LLM-based transformation (not dictionary replacements)
2. Is flexible enough to handle any content
3. Produces age/experience-appropriate output
4. Includes proper prompt engineering
5. Has performance optimization (caching, batching)
6. Includes actual code we can implement immediately

**Budget consideration**: We're using Emergent LLM key - need cost-effective approach but quality is priority.

Thank you for helping solve this critical blocker!
