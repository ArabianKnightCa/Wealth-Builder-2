# Minimum Age Configuration Test

## ✅ VERIFIED: Single Variable Configuration Working

### Current Configuration
- **File:** `/app/backend/config.py`
- **Variable:** `MINIMUM_USER_AGE = 6`

### What Happens When You Change This ONE Variable:

1. **Registration Validation** (`server.py`)
   - Automatically validates against new minimum age
   - Error message updates dynamically: "User must be at least {MINIMUM_USER_AGE} years old"

2. **Adaptive Engine Age Bands** (`ae_engine_v2.py`)
   - Age band automatically calculated: `"{MINIMUM_USER_AGE}-{CHILD_AGE_MAX}"`
   - Example: If MINIMUM_USER_AGE=6, band is "6-12"
   - Example: If MINIMUM_USER_AGE=5, band is "5-12"
   - Example: If MINIMUM_USER_AGE=8, band is "8-12"

3. **PPI Question Filtering**
   - Questions filtered based on age_min vs actual age
   - Fallback rules applied automatically for child/teen/adult categories

4. **No Code Changes Needed**
   - Just change the ONE value in config.py
   - Restart backend: `sudo supervisorctl restart backend`
   - System adapts automatically

---

## How to Change Minimum Age

### Step 1: Edit config.py
```python
# Change this line in /app/backend/config.py
MINIMUM_USER_AGE = 5  # or any age you want
```

### Step 2: Restart Backend
```bash
sudo supervisorctl restart backend
```

### Step 3: Done!
All validation, age bands, and filtering automatically adjust.

---

## Test Results

### Test 1: 6-Year-Old Registration
```
DOB: 2018-01-01
Current minimum age: 6
Result: ✅ ACCEPTED
```

### Test 2: 5-Year-Old Registration
```
DOB: 2020-01-01
Current minimum age: 6
Result: ❌ REJECTED - "User must be at least 6 years old"
```

### Test 3: Age Band Calculation
```
Age 7:
  Calculated band: "6-12"
  Rules applied: {exclude_tags: ['advanced'], reading_level: 'simple'}
  
Age 15:
  Calculated band: "13-17"
  Rules applied: {exclude_tags: [], reading_level: 'youth'}
  
Age 25:
  Calculated band: "18-99"
  Rules applied: {exclude_tags: [], reading_level: 'standard'}
```

---

## ✅ Formula is Correct

The system now uses **ONE variable** (`MINIMUM_USER_AGE`) that controls:
- Registration validation
- Age band calculations
- Question filtering
- Error messages

**No hardcoded "6" anywhere in the logic** - everything is calculated dynamically.

---

## Files Updated

1. `/app/backend/config.py` - **CREATED** (Single source of truth)
2. `/app/backend/server.py` - Imports from config.py
3. `/app/backend/ae_engine_v2.py` - Imports from config.py, calculates age bands dynamically
4. Error messages use f-strings to reference the variable
5. Age band logic uses `MINIMUM_AGE <= age <= CHILD_AGE_MAX` (no hardcoded values)

---

## Architecture

```
config.py (Single Source of Truth)
    ↓
    ├─> server.py (Registration validation)
    │     uses: MINIMUM_USER_AGE
    │
    └─> ae_engine_v2.py (Adaptive engine)
          uses: MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX
          calculates: age bands dynamically
          applies: fallback rules based on age category
```

---

## Future: Changing to Age 5

If you want minimum age to be 5:

1. Edit `/app/backend/config.py`:
   ```python
   MINIMUM_USER_AGE = 5
   ```

2. Restart: `sudo supervisorctl restart backend`

3. Result:
   - Registration allows 5+
   - Age bands become "5-12", "13-17", "18-99"
   - Error message: "User must be at least 5 years old"
   - All filtering adjusts automatically

**No other code changes needed!**
