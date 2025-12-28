# TAP 3.2.4 Quiz Fix Testing - 2025-12-27

## Test Focus
- Quiz endpoint was broken: options showing as empty letters ('A ', 'B ', etc.)
- Root cause: Quiz options stored as dict {'A': 'text'} but code expected list ['A text']
- Also: compute_scalars called with wrong parameter ('quiz' string instead of baseline_text)

## Fixes Applied
1. Fixed quiz option handling to support both dict and list formats
2. Fixed compute_scalars call to use actual question text
3. Added normalize_quiz_options() helper function
4. Enhanced simplify_quiz_question() and simplify_quiz_option() with more patterns

## Test Cases Required

### Backend Tests
1. Quiz endpoint for 6yo EL1 - should return child-friendly content
   - Questions: simplified language
   - Options: simplified with letter prefixes (A, B, C, D)
   - childiness should be ~0.9
   
2. Quiz endpoint for 35yo EL5 - should return baseline content
   - Questions: original professional language
   - Options: original with letter prefixes
   - childiness should be ~0.003

3. PPI endpoint for 6yo EL1 - should return child-friendly content
4. PPI endpoint for 35yo EL5 - should return baseline content

5. LPI endpoint for 6yo EL1 - should return child-friendly content (emoji, simple language)
6. LPI endpoint for 35yo EL5 - should return baseline/expert content

### Validation Points
- All options must have letter prefix (A, B, C, D)
- All options must have actual text content (not empty)
- For 6yo: content should be simplified
- For 35yo: content should be professional/baseline

