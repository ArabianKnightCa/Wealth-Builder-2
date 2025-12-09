# AE-CORE v2.0 Test Harness Documentation

## Overview
The AE-CORE v2.0 Test Harness is a comprehensive testing and debugging interface for the Adaptive Engine. It provides both manual calculation tools and automated test suite execution.

## Access
**URL**: `/ae-test-harness` (requires authentication)

Access from:
- Direct URL: `http://localhost:3000/ae-test-harness`
- Can be linked from admin tools or internal navigation

## Features

### 1. 🧮 Manual Calculator
Interactive tool for testing the AE formula with custom inputs:

**Inputs:**
- Age slider (6-99 years)
- Financial Experience Level dropdown (1-5)

**Outputs:**
- Age Score (normalized 0.0-1.0)
- Experience Score (normalized 0.0-1.0)
- Combined Score (formula result)
- Score interpretation label
- Formula breakdown

**Use Cases:**
- Test edge cases manually
- Verify specific user scenarios
- Debug personalization issues
- Demonstrate formula behavior

### 2. 🧪 Automated Test Suite
Run all 18 comprehensive tests with one click:

**Test Groups:**

**Group 1: Edge Cases (Tests 1-6)**
- Minimum/maximum boundaries
- Age band verification
- Child and teen scenarios

**Group 2: Formula Accuracy (Tests 7-12)**
- Mid-point calculations
- Weight verification (40% age, 60% experience)
- Linear progression
- Score normalization

**Group 3: Real-World Scenarios (Tests 13-18)**
- Young professional (25, intermediate)
- Mid-career advanced (40, advanced)
- Senior expert (60, expert)
- Career changer (45, beginner)
- Child prodigy (8, intermediate)
- Consistency verification

**Results Display:**
- Total/Passed/Failed count
- Color-coded status (green = all pass, red = failures)
- Detailed results for each test
- Group organization

### 3. 📊 Quick Reference Table
Pre-calculated sample scores for common user types:

| User Type | Age | Experience | Combined Score | Level |
|-----------|-----|-----------|---------------|-------|
| Child Beginner | 10 | 1 | 0.017 | Beginner |
| Teen Novice | 16 | 2 | 0.193 | Beginner |
| Young Professional | 25 | 3 | 0.382 | Developing |
| Mid-Career Advanced | 40 | 4 | 0.596 | Intermediate |
| Senior Expert | 60 | 5 | 0.832 | Expert |
| Career Changer | 45 | 1 | 0.168 | Beginner |

## API Endpoints

### POST /api/ae/test/calculate-score
Calculate combined score for given age and experience.

**Request:**
```json
{
  "age": 25,
  "experience_level": 3
}
```

**Response:**
```json
{
  "age": 25,
  "experience_level": 3,
  "age_score": 0.204,
  "exp_score": 0.5,
  "combined_score": 0.382,
  "formula": "0.4 * age_score + 0.6 * exp_score"
}
```

### POST /api/ae/test/run-suite
Run all 18 automated tests.

**Request:** Empty body `{}`

**Response:**
```json
{
  "total": 18,
  "passed": 18,
  "failed": 0,
  "all_passed": true,
  "test_groups": [
    {
      "name": "Group 1: Edge Cases (Tests 1-6)",
      "tests": [
        {
          "name": "Test 1: Min age (6) + min exp (1)",
          "passed": true,
          "result": "Score: 0.000 (Expected: 0.000)"
        },
        ...
      ]
    },
    ...
  ]
}
```

## Formula Details

```
combined_score = 0.4 × age_score + 0.6 × exp_score
```

**Normalization:**
- Age: `(age - 6) / (99 - 6)` → 0.0-1.0
- Experience: `(level - 1) / 4` → 0.0-1.0

**Weights:**
- 40% contribution from age
- 60% contribution from experience
- Experience dominates to reflect skill over age

## Testing Workflow

### Manual Testing
1. Navigate to `/ae-test-harness`
2. Adjust age slider to desired value
3. Select experience level from dropdown
4. Click "🧪 Calculate Score"
5. Review results in Calculation Results box

### Automated Testing
1. Navigate to `/ae-test-harness`
2. Click "▶️ Run All 18 Tests" button
3. Wait ~5-10 seconds for completion
4. Review results grouped by test category
5. Verify "✅ All Tests Passed!" message

### Backend Testing
Run tests directly from command line:
```bash
cd /app/backend
python3 tests/test_ae_core_v2.py
```

## Score Interpretation

| Score Range | Label | Description |
|------------|-------|-------------|
| 0.00 - 0.20 | Beginner | New to financial concepts |
| 0.20 - 0.40 | Developing | Building financial knowledge |
| 0.40 - 0.60 | Intermediate | Comfortable with basics |
| 0.60 - 0.80 | Advanced | Strong financial understanding |
| 0.80 - 1.00 | Expert | Deep financial expertise |

## Use Cases

### For Developers
- Debug personalization logic
- Verify formula accuracy
- Test edge cases
- Validate API responses

### For Product Managers
- Understand scoring behavior
- Verify user segmentation
- Review personalization levels
- Demonstrate AE capabilities

### For QA Testing
- Regression testing
- Integration verification
- Performance testing
- Acceptance criteria validation

## Files

**Frontend:**
- `/app/frontend/src/pages/AETestHarness.js` - Test Harness UI
- `/app/frontend/src/App.js` - Route configuration

**Backend:**
- `/app/backend/ae_engine_v2.py` - AE implementation with formula
- `/app/backend/server.py` - API endpoints
- `/app/backend/tests/test_ae_core_v2.py` - Automated test suite

## Maintenance

### Adding New Tests
1. Add test case to `test_ae_core_v2.py`
2. Update API endpoint test groups in `server.py`
3. Increment total test count in documentation

### Modifying Formula
1. Update `calculate_combined_score()` in `ae_engine_v2.py`
2. Update formula display in `AETestHarness.js`
3. Run test suite to verify
4. Update expected values in tests if needed

## Troubleshooting

**Issue: Tests failing**
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Verify formula implementation in `ae_engine_v2.py`
- Run tests locally: `python3 tests/test_ae_core_v2.py`

**Issue: UI not loading**
- Check authentication (must be logged in)
- Verify route exists in `App.js`
- Check browser console for errors

**Issue: Calculations incorrect**
- Verify normalization ranges (age: 6-99, exp: 1-5)
- Check formula weights (0.4 and 0.6)
- Ensure rounding to 3 decimal places

---

**Version**: 1.0  
**Last Updated**: 2024-12-09  
**Status**: ✅ Production Ready
