# 🔍 ONBOARDING & ADAPTIVE ENGINE AUDIT REPORT

**Date:** December 3, 2025  
**Status:** ❌ CRITICAL ISSUES FOUND  
**Priority:** P0 - BLOCKING FOR PERSONALIZATION

---

## Executive Summary

The onboarding system captures all required user data correctly, BUT the adaptive engine is NOT connected to the frontend. The PPI questions shown to users are static and NOT personalized based on age, experience, or financial goals.

---

## ✅ What's WORKING

### 1. Registration Data Collection
**Location:** `/app/backend/server.py` - Lines 365-450

All required onboarding fields are captured:
- ✅ **Date of Birth** → Stored as `dob_month` and `dob_year`
- ✅ **Preferred Language** → Stored as `language` (default: "en")
- ✅ **State/Location** → Stored as `state`
- ✅ **Role/Occupation** → Stored as `occupation`
- ✅ **Financial Experience** → Stored as `experience_level` (1-5 scale)
- ✅ **Financial Goals** → Stored as `financial_goals` (array of goal IDs)
- ✅ **Custom Goals** → Stored as `custom_goals` (array of text)
- ✅ **School Information** → `school_name`, `school_city`, `school_state` (for students)
- ✅ **Parent Email** → `parent_email` (for minors <18)

**Data Model:**
```python
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    date_of_birth: str              # CAPTURED ✅
    language: str = "en"             # CAPTURED ✅
    experience_level: int            # CAPTURED ✅ (1-5)
    occupation: str                  # CAPTURED ✅
    state: Optional[str]             # CAPTURED ✅
    school_name: Optional[str]       # CAPTURED ✅
    parent_email: Optional[EmailStr] # CAPTURED ✅
    financial_goals: Optional[List[str]] = []  # CAPTURED ✅
    custom_goals: Optional[List[str]] = []     # CAPTURED ✅
```

### 2. Adaptive Engine V2 Implementation
**Location:** `/app/backend/ae_engine_v2.py`

The adaptive engine V2 HAS the correct function signature:

```python
def compose_ppi(self, user_id: str, age: int, financial_experience: str, 
               occupation_bucket: str = None, locale: str = "en-US"):
    """
    Dynamically select 20 PPI questions from bank based on:
    - Age constraints (8-12, 13-17, 18-99)
    - Financial experience level (beginner, intermediate, advanced)
    - Age band exclusions (kids don't get "advanced" questions)
    """
```

**Features:**
- ✅ Age band filtering (8-12, 13-17, 18-99)
- ✅ Experience level filtering (beginner, intermediate, advanced)
- ✅ Tag-based exclusions (e.g., exclude "credit_card" for 8-12)
- ✅ Deterministic selection using user_id as seed

### 3. Personalized PPI Endpoint EXISTS
**Location:** `/app/backend/server.py` - Lines 323-358

```python
@api_router.get("/content/ppi/personalized")
async def get_personalized_ppi(user_id: str = Depends(get_current_user)):
    """Returns personalized 20 PPI questions based on user profile"""
    user = await db.users.find_one({"id": user_id})
    
    # Calculate age from DOB
    age = today.year - user['dob_year']
    
    # Map experience level (1-5) to string
    exp_map = {1: 'beginner', 2: 'beginner', 3: 'intermediate', 4: 'advanced', 5: 'advanced'}
    financial_experience = exp_map.get(user['experience_level'], 'beginner')
    
    # Call AE compose_ppi with user data
    ae_v2 = get_adaptive_engine_v2()
    ppi_result = ae_v2.compose_ppi(
        user_id=user_id,
        age=age,
        financial_experience=financial_experience,
        occupation_bucket=user.get('occupation', None),
        locale=user.get('language', 'en-US')
    )
    return ppi_result
```

**This endpoint:**
- ✅ Reads user age from DOB
- ✅ Reads experience level
- ✅ Reads occupation
- ✅ Reads language preference
- ✅ Calls adaptive engine with ALL user context

---

## ❌ What's BROKEN

### CRITICAL ISSUE #1: Frontend Calls Wrong Endpoint

**Location:** `/app/frontend/src/pages/PPI.js` - Line 24

**Current Code:**
```javascript
const response = await axios.get(`${API}/content/ppi`);  // ❌ STATIC QUESTIONS
```

**Should Be:**
```javascript
const response = await axios.get(`${API}/content/ppi/personalized`, {
    headers: { Authorization: `Bearer ${token}` }
});  // ✅ PERSONALIZED QUESTIONS
```

**Impact:**
- 🚨 ALL users (regardless of age/experience) see the same 20 adult-oriented questions
- 🚨 8-year-olds see questions about credit card debt, emergency funds, and financial stress
- 🚨 Adaptive engine is completely bypassed

---

### CRITICAL ISSUE #2: No Age-Specific PPI Question Bank

**Location:** `/app/backend/content_data.py`

The PPI questions in `content_data.py` are:
- ❌ Written for adults (age 18+)
- ❌ Assume financial independence
- ❌ Reference adult concepts (credit cards, debt, budgeting, emergency funds)

**Examples of Inappropriate Questions for 8-Year-Old:**
```
Q1: "When making financial decisions, I prefer to:"
    - Research extensively before deciding
    - Go with my gut feeling
    
Q5: "My biggest financial priority right now is:"
    - Building an emergency fund
    - Paying off debt
    
Q8: "My relationship with credit cards is:"
    - I use them responsibly and pay in full
    - I struggle with credit card debt
```

**What 8-Year-Olds SHOULD See:**
```
Q1: "When you get money for your birthday, what do you like to do?"
    A. Save it in my piggy bank for something special
    B. Spend it right away on something fun
    C. Ask my parents to help me decide
    D. Save half and spend half

Q2: "Do you have a savings goal?"
    A. Yes! I'm saving for a toy/game
    B. Yes! I'm saving for something big
    C. Not yet, but I want to start
    D. No, I spend money when I get it

Q3: "When you want to buy something, do you:"
    A. Ask your parents to buy it for you
    B. Do extra chores to earn money
    C. Wait for your birthday or holiday
    D. Use your allowance or savings
```

---

### CRITICAL ISSUE #3: PPI Bank File Missing Age-Appropriate Questions

**Expected Location:** `/app/backend/ppi_bank_baseline_v1_1.json`

The adaptive engine v2 tries to load this file:
```python
self.ppi_bank = self._load_json('ppi_bank_baseline_v1_1.json')
```

**Status:** Need to verify if this file exists and has age-filtered questions.

Let me check:
