# 🔍 BACKEND CODE AUDIT REPORT

**Date:** December 3, 2025  
**Purpose:** Identify dead code, duplicates, deprecated functionality, and inefficiencies  
**Status:** 🚨 MULTIPLE ISSUES FOUND

---

## 🚨 CRITICAL ISSUES

### Issue #1: Unused Adaptive Engine (ae_engine.py)
**File:** `/app/backend/ae_engine.py`  
**Status:** ❌ DEAD CODE - Imported but never used

**Evidence:**
- `server.py` line 18: `from ae_engine import get_adaptive_engine` (imported)
- Grep search shows: ZERO usages of `get_adaptive_engine()` in server.py
- Only `get_adaptive_engine_v2()` is called (lines 352, 519)

**Impact:**
- Unnecessary import slows down server startup
- Confusing for future developers
- Maintenance burden for unused code

**Recommendation:** ❌ DELETE `/app/backend/ae_engine.py`

---

### Issue #2: Enhanced Adaptive Engine Not Used
**File:** `/app/backend/ae_engine_v2_enhanced.py`  
**Status:** ❌ DEAD CODE - File exists but never imported

**Evidence:**
- File exists in backend directory
- NOT imported in server.py
- NOT imported in any other file

**Recommendation:** ❌ DELETE `/app/backend/ae_engine_v2_enhanced.py`

---

### Issue #3: Multiple Content Data Backups
**Files:**
- `/app/backend/content_data_backup.py`
- `/app/backend/content_data_backup_generic.py`

**Status:** ⚠️ BACKUP FILES - Not imported, likely outdated

**Evidence:**
- Neither file is imported in server.py
- Only `content_data.py` is imported and used
- Backup files from earlier quiz rewrites

**Recommendation:** 
- ⚠️ Move to `/app/backend/archives/` folder (keep for reference)
- OR ❌ DELETE if quiz content is finalized

---

### Issue #4: Duplicate PPI Banks
**Files:**
- `/app/backend/ppi_bank_baseline_v1_1.json` ✅ USED
- `/app/backend/ppi_bank_poc_v1_1.json` ❌ UNUSED

**Evidence:**
```python
# ae_engine_v2.py line 27
self.ppi_bank = self._load_json('ppi_bank_baseline_v1_1.json')  # Uses baseline
```

**Recommendation:** ❌ DELETE `ppi_bank_poc_v1_1.json`

---

### Issue #5: Unused Schema Files
**Files:**
- `/app/backend/schemas_ae_contracts.json`
- `/app/backend/schemas_ae_rules.json`

**Status:** ❓ UNKNOWN - Not imported anywhere

**Investigation Needed:**
- Are these documentation files?
- Are they used by external tools?
- If not needed, DELETE

---

### Issue #6: Legacy PPI Questions Import
**Location:** `server.py` line 17

**Current:**
```python
from content_data import PPI_QUESTIONS, LPI_CHAPTERS, LPI_ANSWER_KEY
```

**Issue:**
- `PPI_QUESTIONS` is imported but NOT USED
- Server uses adaptive engine v2 which loads PPI from JSON file
- Only `LPI_CHAPTERS` and `LPI_ANSWER_KEY` are used

**Evidence:**
```bash
$ grep "PPI_QUESTIONS" /app/backend/server.py
17:from content_data import PPI_QUESTIONS, LPI_CHAPTERS, LPI_ANSWER_KEY
319:async def get_ppi_questions():
320:    """Legacy endpoint - returns static PPI questions"""
321:    return {"questions": PPI_QUESTIONS}
```

**Current State:**
- Legacy endpoint exists: `/content/ppi` (returns static PPI_QUESTIONS)
- New endpoint used: `/content/ppi/personalized` (uses adaptive engine)
- Frontend updated to use personalized endpoint
- Legacy endpoint is now DEAD CODE

**Recommendation:**
- ❌ DELETE legacy endpoint `/content/ppi` (lines 319-321)
- ❌ REMOVE `PPI_QUESTIONS` from import

---

## ⚠️ MODERATE ISSUES

### Issue #7: Inconsistent Error Handling
**Location:** Multiple endpoints

**Pattern Found:**
```python
# Some endpoints
try:
    # logic
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

# Other endpoints  
try:
    # logic
except Exception as e:
    raise HTTPException(status_code=500, detail=f"Failed to X: {str(e)}")
```

**Recommendation:** 
- ✅ Standardize error messages
- ✅ Use consistent format: `f"Failed to {action}: {str(e)}"`

---

### Issue #8: Duplicate Age Calculation Logic
**Locations:**
- `server.py` line 306: `calculate_age()` function
- Inline age calculation in personalized PPI endpoint (line 347-348)

**Current:**
```python
# Function (line 306)
def calculate_age(date_of_birth: str) -> int:
    dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
    today = datetime.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

# Inline (line 347-348)
today = datetime.today()
age = today.year - user['dob_year']
```

**Issue:** Inline version doesn't account for month/day, function version does

**Recommendation:** 
- ✅ Always use `calculate_age()` function
- ✅ Remove inline calculation, call function instead

---

## 📊 STATISTICS

### Files
- **Total Python files:** 6
- **Total JSON files:** 11
- **Dead code files:** 3 (ae_engine.py, ae_engine_v2_enhanced.py, content_data_backup*.py)
- **Unused JSON files:** 2-3 (ppi_bank_poc, possibly schema files)

### Code Quality
- **Unused imports:** 2 (ae_engine, PPI_QUESTIONS from content_data)
- **Deprecated endpoints:** 1 (/content/ppi)
- **Duplicate logic:** 1 (age calculation)
- **Inconsistent patterns:** Multiple (error handling, response formats)

---

## 🎯 CLEANUP PLAN

### Phase 1: Delete Dead Code (HIGH PRIORITY)
1. ❌ DELETE `/app/backend/ae_engine.py`
2. ❌ DELETE `/app/backend/ae_engine_v2_enhanced.py`
3. ❌ DELETE `/app/backend/ppi_bank_poc_v1_1.json`
4. ❌ DELETE legacy endpoint `/content/ppi` in server.py
5. ✅ REMOVE unused imports from server.py

**Impact:** Cleaner codebase, faster startup, less confusion

---

### Phase 2: Consolidate Duplicates (MEDIUM PRIORITY)
1. ✅ Fix inline age calculation to use `calculate_age()` function
2. ✅ Standardize error handling across all endpoints
3. 📁 ARCHIVE backup files to `/app/backend/archives/`

**Impact:** Consistent code patterns, easier maintenance

---

### Phase 3: Verify Unknowns (LOW PRIORITY)
1. ❓ Check if schema JSON files are needed
2. ❓ Verify ae_test_kit_users_poc.json usage
3. ❓ Check feature_flags_poc.json usage

**Impact:** Complete understanding of codebase

---

## 📝 RECOMMENDED FILE STRUCTURE

### Keep (Active Files)
```
/app/backend/
  ├── server.py              ✅ Main API
  ├── config.py              ✅ Configuration
  ├── content_data.py        ✅ Quiz/chapter content
  ├── ae_engine_v2.py        ✅ Adaptive engine (active version)
  ├── quiz_validator.py      ✅ Quiz validation
  │
  ├── ae_contracts_stable_v1_1.json     ✅ AE contracts
  ├── ae_rules_poc_v1_1.json            ✅ AE rules
  ├── ppi_bank_baseline_v1_1.json       ✅ PPI questions (active)
  ├── lpi_lessons_index.json            ✅ LPI index
  └── feature_flags_poc.json            ✅ Feature flags (if used)
```

### Delete (Dead Code)
```
  ├── ae_engine.py                      ❌ DELETE (v1, unused)
  ├── ae_engine_v2_enhanced.py          ❌ DELETE (never used)
  ├── ppi_bank_poc_v1_1.json            ❌ DELETE (duplicate)
```

### Archive (Backups)
```
/app/backend/archives/
  ├── content_data_backup.py            📁 MOVE HERE
  └── content_data_backup_generic.py    📁 MOVE HERE
```

---

## ✅ AFTER CLEANUP

### Expected Benefits
1. **Faster Startup:** Fewer imports, less code to load
2. **Clearer Code:** Only one adaptive engine, no confusion
3. **Easier Maintenance:** No dead endpoints or unused imports
4. **Better Performance:** Less code to parse and maintain in memory
5. **Reduced Confusion:** Future developers see only active code

### Testing After Cleanup
- ✅ Test registration flow
- ✅ Test personalized PPI endpoint
- ✅ Test quiz submission
- ✅ Test analytics generation
- ✅ Verify no broken imports

---

## 🎯 PRIORITY RECOMMENDATION

**START WITH PHASE 1 (Delete Dead Code)**
- Lowest risk (code isn't being used anyway)
- Highest impact (immediate cleanup)
- Quick to execute (10 minutes)

Then move to Phase 2 and 3 as time permits.
