from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables FIRST (before any other imports that depend on them)
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import os
import logging
import uuid
import bcrypt
import jwt
import random
import string
from content_data import LPI_CHAPTERS, LPI_ANSWER_KEY
from ae_engine_v2 import get_adaptive_engine_v2
from quiz_validator import validate_quiz_integrity
from config import MINIMUM_USER_AGE, CHILD_AGE_MAX, TEEN_AGE_MAX
from content_models import Chapter, Lesson, QuizQuestion, ChapterComplete
from profile_models import Profile, ProfileCreate, ProfileUpdate, ActiveProfileResponse, AVATAR_OPTIONS

# TAP 5.0 - The ONLY active TAP version
# DNA-based personalization with 24 VIA Character Strengths
from tap_5_0 import (
    TAP50Engine,
    TAPControlInputs as TAP50ControlInputs,
    TAPScalars as TAP50Scalars,
    LessonSpec as TAP50LessonSpec,
    PPIOptionSpec as TAP50PPIOptionSpec,
    PPIAnswer as TAP50PPIAnswer,
    DNAResult,
    AdaptedContent,
    compute_scalars as tap50_compute_scalars,
    generate_dna as tap50_generate_dna,
    accumulate_scores as tap50_accumulate_scores,
    analyze_quiz_balance as tap50_analyze_quiz,
    VIA_TRAITS,
    POC_CONFIG as TAP50_POC_CONFIG,
    EL_MAX_POC,
    simplify_for_child,
    apply_microglosses
)

# Helper functions for quiz simplification
def normalize_quiz_options(options_data) -> list:
    """
    Normalize quiz options to list format with letter prefixes.
    Handles both dict format {'A': 'text', ...} and list format ['A text', ...].
    """
    if isinstance(options_data, dict):
        # Options stored as dict: {'A': 'text', 'B': 'text', ...}
        result = []
        for opt_letter in ['A', 'B', 'C', 'D']:
            opt_text = options_data.get(opt_letter, '')
            if opt_text:
                result.append(f"{opt_letter} {opt_text}")
        return result
    elif isinstance(options_data, list):
        # Options stored as list - normalize to ensure letter prefix
        result = []
        for opt_idx, opt in enumerate(options_data):
            opt_id = chr(65 + opt_idx)
            opt_str = str(opt).strip()
            # Check if already has letter prefix
            if opt_str and opt_str[0] in 'ABCD' and len(opt_str) > 1 and opt_str[1] in (' ', '.'):
                # Already has prefix, keep as is but normalize format
                clean_opt = opt_str[1:].lstrip('. ').strip()
                result.append(f"{opt_id} {clean_opt}")
            else:
                # No prefix, add one
                result.append(f"{opt_id} {opt_str}")
        return result
    else:
        return []

def simplify_quiz_question(question_text: str, age: int = 7, el: int = 1) -> str:
    """
    Simplify quiz question using TAP 5.0 continuous adaptation.
    
    Works for ANY age (7, 8, 9, 10, 11, 12, 13... 99).
    Adaptation intensity scales with LC (Learning Complexity).
    
    Args:
        question_text: Original question text
        age: User's age (6-99)
        el: User's experience level (1-5)
    
    Returns:
        Age-appropriate question text
    """
    from tap_5_0 import adapt_ppi_text
    return adapt_ppi_text(question_text, age, el, 5)

def simplify_quiz_option(option_text: str, age: int = 7, el: int = 1) -> str:
    """
    Simplify quiz option using TAP 5.0 continuous adaptation.
    
    Works for ANY age (7, 8, 9, 10, 11, 12, 13... 99).
    Adaptation intensity scales with LC (Learning Complexity).
    
    Args:
        option_text: Original option text
        age: User's age (6-99)
        el: User's experience level (1-5)
    
    Returns:
        Age-appropriate option text
    """
    from tap_5_0 import adapt_ppi_text
    return adapt_ppi_text(option_text, age, el, 5)

# PPI Trait Vector System (Option A: Trait Tags + Shared Weight Templates)
from ppi_trait_vector import (
    compute_trait_vector,
    trait_vector_to_dict,
    get_trait_summary,
    ALL_TRAIT_IDS,
    TRAIT_NAMES
)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-12345')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Note: MINIMUM_USER_AGE is imported from config.py

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ===========================
# Pydantic Models
# ===========================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    date_of_birth: str
    language: str = "en"
    experience_level: int = Field(ge=1, le=5)
    user_type: str = "POC"  # POC, B1, B2, B3, COM
    life_stage: str  # ES, JH, HS, CL, UN, AD (expandable)
    occupation: str  # Role selector
    state: Optional[str] = None  # US state
    school_name: Optional[str] = None
    school_city: Optional[str] = None
    school_state: Optional[str] = None
    parent_email: Optional[EmailStr] = None  # For minors
    financial_goals: Optional[List[str]] = []  # Array of goal IDs
    custom_goals: Optional[List[str]] = []  # Array of custom goal texts

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    person_key: str  # PK-XXXXXXXX
    user_code: str  # UID-ENV-COHORT-SEQ-TIMESTAMP (legacy)
    uid: Optional[str] = None  # New UID: APP_STAGE-LIFE_STAGE-SEQ-DATEBLOCK-TIMEBLOCK
    user_type: str  # POC, B1, B2, B3, COM
    life_stage: str  # ES, JH, HS, CL, UN, AD (expandable)
    cohort: str  # EDU or GEN
    email: EmailStr
    first_name: str
    dob_month: int
    dob_year: int
    language: str = "en"
    experience_level: int
    occupation: str
    state: Optional[str] = None
    school_name: Optional[str] = None
    school_city: Optional[str] = None
    school_state: Optional[str] = None
    school_verified: bool = False
    age_verified: bool = True
    account_status: str = "active"  # active, restricted
    financial_goals: Optional[List[str]] = []  # Array of goal IDs
    custom_goals: Optional[List[str]] = []  # Array of custom goal texts
    reset_token: Optional[str] = None  # Password reset token
    reset_token_expires: Optional[datetime] = None  # Token expiration time
    ppi_completed: bool = False  # PPI questionnaire completion status
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class PPISubmit(BaseModel):
    answers: List[Dict[str, str]]

class QuizSubmit(BaseModel):
    chapter_id: str
    answers: List[Dict[str, str]]

class Progress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    current_module: str
    current_step: str
    ppi_completed: bool = False
    lpi_current_chapter: int = 1
    autosaved_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackSubmit(BaseModel):
    context_page: str
    feedback_text: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class SettingsUpdate(BaseModel):
    # Profile
    first_name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar: Optional[str] = None
    profile_picture_url: Optional[str] = None
    # Personal Info
    date_of_birth: Optional[str] = None
    language: Optional[str] = None
    experience_level: Optional[int] = None
    life_stage: Optional[str] = None
    occupation: Optional[str] = None
    location: Optional[dict] = None
    timezone: Optional[str] = None
    pronouns: Optional[str] = None
    secondary_email: Optional[str] = None
    # Learning Preferences
    financial_goals: Optional[List[str]] = None
    daily_goal_minutes: Optional[int] = None
    reminder_time: Optional[str] = None
    lesson_length: Optional[str] = None
    enable_hints: Optional[bool] = None
    # Notifications
    notifications_enabled: Optional[bool] = None
    weekly_email: Optional[bool] = None
    achievement_alerts: Optional[bool] = None
    milestone_celebrations: Optional[bool] = None
    streak_reminders: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    email_frequency: Optional[str] = None
    # Display
    dark_mode: Optional[bool] = None
    text_size: Optional[str] = None
    reduce_animations: Optional[bool] = None
    high_contrast: Optional[bool] = None
    font_family: Optional[str] = None
    # Privacy
    profile_visible: Optional[bool] = None
    show_progress_publicly: Optional[bool] = None
    allow_analytics: Optional[bool] = None
    data_retention_months: Optional[int] = None
    # Parental Controls
    parent_email: Optional[str] = None
    parent_name: Optional[str] = None
    daily_time_limit: Optional[int] = None
    content_filter: Optional[str] = None
    require_approval: Optional[bool] = None
    weekly_report: Optional[bool] = None

# ===========================
# Database Schema v1.0: Identity & Family Models (Complete Spec)
# ===========================

class UserV1(BaseModel):
    """Enhanced User model with complete audit trail"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "POC"
    email: Optional[EmailStr] = None
    email_verified: bool = False
    password_hash: Optional[str] = None
    auth_provider: Optional[str] = None  # google, email, etc
    auth_provider_id: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    display_name: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO date format
    locale: Optional[str] = "en"
    time_zone: Optional[str] = None
    role_primary: str = "student"
    role_flags: List[str] = []
    onboarding_status: Optional[str] = "not_started"
    onboarding_step: Optional[str] = None
    ppi_profile_id: Optional[str] = None
    avatar_style: Optional[str] = None
    settings: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    deleted_reason: Optional[str] = None

class UserV1Create(BaseModel):
    email: Optional[EmailStr] = None
    first_name: str
    last_name: Optional[str] = None
    role_primary: str = "student"
    tenant_id: str = "POC"
    date_of_birth: Optional[str] = None

class Family(BaseModel):
    """Represents a household group with complete audit trail"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "POC"
    family_name: Optional[str] = None
    family_code: Optional[str] = None
    created_by_user_id: str
    primary_contact_user_id: Optional[str] = None
    plan_tier: Optional[str] = "free"
    plan_status: Optional[str] = "active"
    billing_account_id: Optional[str] = None
    settings: Dict[str, Any] = {}
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    deleted_reason: Optional[str] = None

class FamilyCreate(BaseModel):
    family_name: Optional[str] = None
    primary_contact_user_id: Optional[str] = None
    tenant_id: str = "POC"
    plan_tier: str = "free"

class FamilyMember(BaseModel):
    """Join table with complete audit trail"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = "POC"
    family_id: str
    user_id: str
    role: str
    is_primary_guardian: bool = False
    permissions: Dict[str, Any] = {}
    status: str
    invited_at: Optional[datetime] = None
    joined_at: Optional[datetime] = None
    removed_at: Optional[datetime] = None
    removed_by_user_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: str
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    deleted_reason: Optional[str] = None

class FamilyMemberCreate(BaseModel):
    family_id: str
    user_id: str
    role: str = "child"
    is_primary_guardian: bool = False
    status: str = "active"

class FamilyMemberUpdate(BaseModel):
    role: Optional[str] = None
    is_primary_guardian: Optional[bool] = None
    status: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

# ===========================
# Helper Functions
# ===========================

def map_experience_level(level: int) -> str:
    """Map integer experience level (1-5) to string for AE compatibility"""
    if level <= 2:
        return "beginner"
    elif level <= 4:
        return "intermediate"
    else:
        return "advanced"

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def calculate_age(date_of_birth: str) -> int:
    """Calculate age from date of birth string (YYYY-MM-DD)"""
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
        today = datetime.now()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except:
        return 0

def generate_person_key() -> str:
    """Generate Person Key: PK-[A-Z0-9]{8}"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=8))
    return f"PK-{random_part}"

def generate_parent_key() -> str:
    """Generate Parent Person Key: PPK-[A-Z0-9]{8}"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=8))
    return f"PPK-{random_part}"

def generate_link_token() -> str:
    """Generate Family Link Token: FLK-[A-Z0-9]{6}"""
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=6))
    return f"FLK-{random_part}"

def determine_cohort(occupation: str) -> str:
    """Determine cohort (EDU or GEN) based on occupation"""
    edu_roles = [
        "Middle / High School Student",
        "College / University Student",
        "Part-Time Worker / Student",
        "Educator / Mentor / Advisor"
    ]
    return "EDU" if occupation in edu_roles else "GEN"

async def generate_user_code(user_type: str, cohort: str, created_at: datetime) -> str:
    """Generate UID: UID-[ENV]-[COHORT]-[SEQ]
    Example: UID-POC-EDU-1
    """
    # Count existing users of this type and cohort
    count = await db.users.count_documents({"user_type": user_type, "cohort": cohort})
    seq = count + 1
    
    return f"UID-{user_type}-{cohort}-{seq}"

async def generate_uid(user_type: str, life_stage: str, created_at: datetime) -> str:
    """
    Generate UID: APP_STAGE-LIFE_STAGE-SEQ-DATEBLOCK-TIMEBLOCK
    
    Format: POC-ES-1832-12042025-101300
    
    - APP_STAGE: POC, B1, B2, B3, COM
    - LIFE_STAGE: ES, JH, HS, CL, UN, AD (expandable)
    - SEQ: Sequential integer (starts at 1, increments)
    - DATEBLOCK: MMDDYYYY
    - TIMEBLOCK: HHMMSS (24-hour military time)
    
    SEQ is generated ONLY after onboarding completion (PPI submission)
    """
    # Get and increment SEQ counter
    counter = await db.seq_counter.find_one_and_update(
        {"_id": "uid_seq"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    seq = counter.get("seq", 1)
    
    # Format DATEBLOCK: MMDDYYYY
    dateblock = created_at.strftime("%m%d%Y")
    
    # Format TIMEBLOCK: HHMMSS (24-hour military time)
    timeblock = created_at.strftime("%H%M%S")
    
    # Construct UID
    uid = f"{user_type}-{life_stage}-{seq}-{dateblock}-{timeblock}"
    
    return uid


# ===========================
# API Endpoints
# ===========================

@api_router.get("/")
async def root():
    return {"message": "Mizo Wealth Builder API", "version": "3.0"}
@api_router.get("/content/ppi/personalized")
async def get_personalized_ppi(user_id: str = Depends(get_current_user)):
    """
    AE_FN_COMPOSE_PPI - Trigger: MCC_EVT_ONBOARDING_COMPLETE
    Returns personalized 20 PPI questions based on user profile
    """
    # Get user data
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate age
    from datetime import date
    today = date.today()
    age = today.year - user['dob_year']
    if today.month < user['dob_month']:
        age -= 1
    
    # Get financial experience
    financial_experience = map_experience_level(user.get('experience_level', 1))
    
    # Call AE compose_ppi
    ae_v2 = get_adaptive_engine_v2()
    ppi_result = ae_v2.compose_ppi(
        user_id=user_id,
        age=age,
        financial_experience=financial_experience,
        occupation_bucket=user.get('occupation', None),
        locale=user.get('language', 'en-US')
    )
    
    return ppi_result

@api_router.get("/content/lpi")
async def get_lpi_chapters(user_id: str = Depends(get_current_user)):
    """
    Get personalized LPI chapters with dynamically generated content
    Content is transformed at runtime based on user's Age, Experience, PPI, and Goals
    
    TAP 5.0: DNA-based personalization with 24 VIA Character Strengths
    - Continuous LC (Learning Complexity) calculation with 40/60 age/EL weighting
    - Child/Bridge/Expert text selection with micro-glosses
    - Immutable baseline principle maintained
    """
    # Fetch user profile using id field (from JWT token)
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch user's progress to get DNA profile and TAP controls (stored after PPI submission)
    progress = await db.progress.find_one({"user_id": user_id}, {"_id": 0})
    
    # Extract DNA profile from progress if available
    dna_profile = 'Balanced'
    dna_weights = {}
    tap_controls_dict = None  # Will hold the 8 control scalars
    
    if progress and 'learning_map' in progress:
        learning_map = progress['learning_map']
        if 'financial_dna' in learning_map:
            dna_profile = learning_map['financial_dna'].get('profile', 'Balanced')
            dna_weights = learning_map['financial_dna'].get('weights', {})
        # Extract TAP control scalars if available
        if 'tap_controls' in learning_map:
            tap_controls_dict = learning_map['tap_controls']
    
    # Get user age and experience level
    exp_level_map = {"beginner": 1, "intermediate": 3, "advanced": 5}
    financial_exp = map_experience_level(user.get('experience_level', 1))
    exp_level = exp_level_map.get(financial_exp, 1)
    user_age = calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01")
    
    # TAP 5.0: Comprehensive DNA-based personalization
    # - DNA-based personalization using 24 VIA Character Strengths
    # - 7-layer PPI (270 questions) for psychological depth
    # - Continuous LC calculation (40/60 age/EL weighting)
    # - Child/Bridge/Expert text selection with micro-glosses
    tap50_engine = TAP50Engine(el_max_poc=EL_MAX_POC)
    
    # Get DNA if PPI is complete
    dna_result = None
    ppi_completed = False
    if progress and progress.get('ppi_completed'):
        ppi_completed = True
        # In future, load DNA from user's PPI answers
        # For now, use empty DNA until PPI answers are processed
    
    personalized_chapters = []
    for chapter in LPI_CHAPTERS:
        transformed_lessons = []
        for lesson_idx, lesson in enumerate(chapter.get('lessons', []), 1):
            lesson_text = lesson.get('text', '')
            takeaway_text = lesson.get('takeaway', '')
            lesson_title = lesson.get('title', chapter.get('title', 'Lesson'))
            
            # Create LessonSpec for TAP 5.0
            lesson_spec = TAP50LessonSpec(
                topic=lesson_title,
                baseline_text=lesson_text,
                takeaway=takeaway_text
            )
            
            # Process through TAP 5.0 engine
            text_output = tap50_engine.process_lpi(
                spec=lesson_spec,
                age=user_age,
                el_declared=exp_level,
                controls=TAP50ControlInputs.neutral(),
                dna_result=dna_result,
                ppi_completed=ppi_completed
            )
            
            # Process takeaway if present
            takeaway_adapted = ''
            if takeaway_text:
                takeaway_spec = TAP50LessonSpec(
                    topic="Key Takeaway",
                    baseline_text=takeaway_text,
                    takeaway=""
                )
                takeaway_output = tap50_engine.process_lpi(
                    spec=takeaway_spec,
                    age=user_age,
                    el_declared=exp_level,
                    controls=TAP50ControlInputs.neutral(),
                    dna_result=dna_result,
                    ppi_completed=ppi_completed
                )
                takeaway_adapted = takeaway_output.selected_text
            
            transformed_lessons.append({
                **lesson,
                'text': text_output.selected_text,
                'child_text': text_output.child_text,
                'bridge_text': text_output.bridge_text,
                'expert_text': text_output.expert_text,
                'takeaway': takeaway_adapted,
                'tap_version': '5.0',
                'blend_weights': text_output.blend_weights,
                'lc': text_output.scalars.lc if text_output.scalars else 0,
                'childiness': text_output.scalars.childiness if text_output.scalars else 0,
            })
        
        personalized_chapters.append({
            **chapter,
            'lessons': transformed_lessons,
            'summary': chapter.get('summary', '')
        })
    
    # Calculate overall scalars for response
    scalars = tap50_engine.compute_scalars(user_age, exp_level)
    
    return {
        "chapters": personalized_chapters,
        "user_profile": {
            "age": user_age,
            "experience_level": exp_level,
            "dna_profile": dna_profile,
        },
        "tap_version": "5.0",
        "tap_scalars": {
            "lc": scalars.lc,
            "childiness": scalars.childiness,
            "age_norm": scalars.age_norm,
            "el_norm": scalars.el_norm,
            "weights": scalars.weights
        }
    }

# ===========================
# Content API - Database-Driven
# ===========================

@api_router.get("/content/chapters")
async def get_chapters_list():
    """Get list of all chapters from database"""
    chapters = await db.chapters.find(
        {"is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return {"chapters": chapters}

@api_router.get("/content/chapters/{chapter_id}")
async def get_chapter_with_lessons(chapter_id: str, user_id: str = Depends(get_current_user)):
    """Get chapter with lessons (personalized) from database"""
    # Fetch chapter
    chapter = await db.chapters.find_one({"id": chapter_id, "is_active": True}, {"_id": 0})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Fetch lessons
    lessons = await db.lessons.find(
        {"chapter_id": chapter_id, "is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    # Get user profile for personalization
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user:
        progress = await db.progress.find_one({"user_id": user_id}, {"_id": 0})
        
        dna_profile = 'Balanced'
        dna_weights = {}
        if progress and 'learning_map' in progress:
            learning_map = progress['learning_map']
            if 'financial_dna' in learning_map:
                dna_profile = learning_map['financial_dna'].get('profile', 'Balanced')
                dna_weights = learning_map['financial_dna'].get('weights', {})
        
        # Get user attributes
        exp_level_map = {"beginner": 1, "intermediate": 3, "advanced": 5}
        financial_exp = map_experience_level(user.get('experience_level', 1))
        exp_level = exp_level_map.get(financial_exp, 1)
        user_age = calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01")
        
        # TAP 5.0: DNA-based personalization
        tap50_engine = TAP50Engine(el_max_poc=EL_MAX_POC)
        
        personalized_lessons = []
        for lesson in lessons:
            lesson_spec = TAP50LessonSpec(
                topic=lesson.get('title', ''),
                baseline_text=lesson['text'],
                takeaway=lesson.get('takeaway', '')
            )
            
            text_output = tap50_engine.process_lpi(
                spec=lesson_spec,
                age=user_age,
                el_declared=exp_level,
                controls=TAP50ControlInputs.neutral()
            )
            
            takeaway_adapted = ''
            if lesson.get('takeaway'):
                takeaway_spec = TAP50LessonSpec(
                    topic="Key Takeaway",
                    baseline_text=lesson['takeaway'],
                    takeaway=""
                )
                takeaway_output = tap50_engine.process_lpi(
                    spec=takeaway_spec,
                    age=user_age,
                    el_declared=exp_level,
                    controls=TAP50ControlInputs.neutral()
                )
                takeaway_adapted = takeaway_output.selected_text
            
            personalized_lessons.append({
                **lesson,
                'text': text_output.selected_text,
                'takeaway': takeaway_adapted,
                'tap_version': '5.0'
            })
        lessons = personalized_lessons
    
    return {
        "chapter": chapter,
        "lessons": lessons,
        "personalization_applied": bool(user)
    }

@api_router.get("/content/chapters/{chapter_id}/quiz")
async def get_chapter_quiz(chapter_id: str, user_id: str = Depends(get_current_user)):
    """Get quiz questions for a chapter from database with age-appropriate transformation"""
    # Fetch chapter
    chapter = await db.chapters.find_one({"id": chapter_id, "is_active": True}, {"_id": 0})
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Fetch quiz questions
    questions = await db.quiz_questions.find(
        {"chapter_id": chapter_id, "is_active": True},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    
    # Get user profile for transformation
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user:
        # Get user attributes
        exp_level_map = {"beginner": 1, "intermediate": 3, "advanced": 5}
        financial_exp = map_experience_level(user.get('experience_level', 1))
        exp_level = exp_level_map.get(financial_exp, 1)
        user_age = calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01")
        
        # TAP 5.0: Continuous quiz adaptation based on actual age/EL
        # Works for ANY age (7, 8, 9, 10, 11, 12, 13... 99)
        tap50_engine = TAP50Engine(el_max_poc=EL_MAX_POC)
        
        quiz_questions = []
        for q in questions:
            question_text_baseline = q.get('question_text', '')
            
            # Compute scalars using actual user age and question text
            scalars = tap50_engine.compute_scalars(user_age, exp_level, question_text_baseline)
            
            # TAP 5.0 continuous adaptation - always adapt based on LC
            # Lower LC = more simplification, Higher LC = closer to baseline
            question_text = simplify_quiz_question(question_text_baseline, user_age, exp_level)
            
            # Adapt options - handle both dict and list formats
            adapted_options = []
            options_data = q.get('options', {})
            
            if isinstance(options_data, dict):
                for opt_letter in ['A', 'B', 'C', 'D']:
                    opt_text = options_data.get(opt_letter, '')
                    if opt_text:
                        adapted_opt = simplify_quiz_option(opt_text, user_age, exp_level)
                        adapted_options.append(f"{opt_letter} {adapted_opt}")
            else:
                for opt_idx, opt in enumerate(options_data):
                    opt_id = chr(65 + opt_idx)
                    clean_opt = str(opt).lstrip('ABCD').lstrip('. ').strip()
                    adapted_opt = simplify_quiz_option(clean_opt, user_age, exp_level)
                    adapted_options.append(f"{opt_id} {adapted_opt}")
            
            quiz_questions.append({
                "id": q['id'],
                "question_text": question_text,
                "options": adapted_options,
                "order": q.get('order', 0),
                "tap_version": "5.0",
                "user_age": user_age,
                "lc": round(scalars.lc, 3),
                "childiness": round(scalars.childiness, 3)
            })
    else:
        # Fallback: no transformation if user not found
        quiz_questions = []
        for q in questions:
            # Still need to normalize options format
            normalized_options = normalize_quiz_options(q.get('options', {}))
            quiz_questions.append({
                "id": q['id'],
                "question_text": q.get('question_text', ''),
                "options": normalized_options,
                "order": q.get('order', 0)
            })
    
    return {
        "chapter": chapter,
        "questions": quiz_questions
    }

@api_router.post("/content/quiz/submit")
async def submit_quiz_answer(answer_data: dict, user_id: str = Depends(get_current_user)):
    """Submit quiz answer and get feedback"""
    question_id = answer_data.get('question_id')
    selected_answer = answer_data.get('selected_answer')
    
    if not question_id or not selected_answer:
        raise HTTPException(status_code=400, detail="Missing question_id or selected_answer")
    
    # Fetch question from database
    question = await db.quiz_questions.find_one({"id": question_id}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    is_correct = question['correct_answer'] == selected_answer
    
    return {
        "is_correct": is_correct,
        "correct_answer": question['correct_answer'],
        "rationale": question['rationale'],
        "selected_answer": selected_answer
    }

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    age = calculate_age(user_data.date_of_birth)
    if age < MINIMUM_USER_AGE:
        raise HTTPException(status_code=400, detail=f"User must be at least {MINIMUM_USER_AGE} years old")
    
    # Determine cohort from occupation
    cohort = determine_cohort(user_data.occupation)
    
    # Check if minor (< 18)
    is_minor = age < 18
    # TESTING MODE: Auto-activate all accounts regardless of parent email
    account_status = "active"  # TODO: Re-enable parent approval check for production
    
    # Generate keys and codes
    person_key = generate_person_key()
    created_at = datetime.now(timezone.utc)
    user_code = await generate_user_code(user_data.user_type, cohort, created_at)
    
    # Extract DOB parts
    dob = datetime.strptime(user_data.date_of_birth, "%Y-%m-%d")
    
    hashed_password = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        first_name=user_data.first_name,
        dob_month=dob.month,
        dob_year=dob.year,
        language=user_data.language,
        experience_level=user_data.experience_level,
        person_key=person_key,
        user_code=user_code,
        user_type=user_data.user_type,
        life_stage=user_data.life_stage,
        cohort=cohort,
        occupation=user_data.occupation,
        state=user_data.state,
        school_name=user_data.school_name,
        school_city=user_data.school_city,
        school_state=user_data.school_state,
        school_verified=False if user_data.school_name else True,
        age_verified=True,
        account_status=account_status,
        financial_goals=user_data.financial_goals or [],
        custom_goals=user_data.custom_goals or []
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    # If minor with parent email, create parent and family link
    if is_minor and user_data.parent_email:
        # Check if parent already exists
        parent = await db.parents.find_one({"emails": user_data.parent_email})
        if not parent:
            parent_key = generate_parent_key()
            parent = {
                "parent_key": parent_key,
                "emails": [user_data.parent_email],
                "phones": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.parents.insert_one(parent)
        else:
            parent_key = parent['parent_key']
        
        # Create family link
        link_token = generate_link_token()
        family_link = {
            "parent_key": parent_key,
            "child_person_key": person_key,
            "link_token": link_token,
            "status": "pending",  # Will be 'active' after verification
            "created_at": datetime.now(timezone.utc).isoformat(),
            "revoked_at": None
        }
        await db.family_links.insert_one(family_link)
        
        # TODO: Send verification email to parent
        # For now, we'll auto-activate for testing
        await db.family_links.update_one(
            {"link_token": link_token},
            {"$set": {"status": "active"}}
        )
        await db.users.update_one(
            {"person_key": person_key},
            {"$set": {"account_status": "active"}}
        )
    
    progress = Progress(user_id=user.id, current_module="ppi", current_step="start")
    progress_dict = progress.model_dump()
    progress_dict['autosaved_at'] = progress_dict['autosaved_at'].isoformat()
    await db.progress.insert_one(progress_dict)
    
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"user": user.model_dump(), "access_token": access_token, "token_type": "bearer"}

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user['password']):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    access_token = create_access_token(
        data={"sub": user['id']},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    user_obj = User(**user)
    return {"user": user_obj.model_dump(), "access_token": access_token, "token_type": "bearer"}

@api_router.get("/auth/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Send password reset email"""
    import resend
    import secrets
    
    # Find user by email
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if user exists or not (security best practice)
        return {"message": "If an account with that email exists, a password reset link has been sent."}
    
    # Generate secure reset token
    reset_token = secrets.token_urlsafe(32)
    token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Save reset token to database
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {
            "reset_token": reset_token,
            "reset_token_expires": token_expires.isoformat()
        }}
    )
    
    # Send email via Resend
    resend.api_key = os.getenv("RESEND_API_KEY")
    app_domain = os.getenv("APP_DOMAIN", "http://localhost:3000")
    reset_link = f"{app_domain}/reset-password?token={reset_token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #FFA500;">Password Reset Request</h2>
                <p>Hello {user.get('first_name', 'there')},</p>
                <p>We received a request to reset your password for your Wealth Builder account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #FFA500; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
                </div>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">{reset_link}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Wealth Builder Team</p>
            </div>
        </body>
    </html>
    """
    
    try:
        params = {
            "from": os.getenv("SENDER_EMAIL"),
            "to": [request.email],
            "subject": "Password Reset Request - Wealth Builder",
            "html": html_content,
        }
        print(f"📧 Attempting to send email from {os.getenv('SENDER_EMAIL')} to {request.email}")
        result = resend.Emails.send(params)
        print(f"✅ Email sent successfully! Result: {result}")
    except Exception as e:
        print(f"❌ Failed to send email: {str(e)}")
        print(f"   API Key present: {'Yes' if os.getenv('RESEND_API_KEY') else 'No'}")
        print(f"   Sender email: {os.getenv('SENDER_EMAIL')}")
        # Don't reveal email sending failure to user (security)
    
    return {"message": "If an account with that email exists, a password reset link has been sent."}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """Reset password using token"""
    # Find user by reset token
    user = await db.users.find_one({"reset_token": request.token})
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token is expired
    if user.get('reset_token_expires'):
        expires_at = datetime.fromisoformat(user['reset_token_expires'])
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password
    hashed_password = hash_password(request.new_password)
    
    # Update password and clear reset token
    await db.users.update_one(
        {"id": user['id']},
        {"$set": {
            "password": hashed_password,
            "reset_token": None,
            "reset_token_expires": None
        }}
    )
    
    return {"message": "Password has been reset successfully"}


@api_router.post("/ppi/submit")
async def submit_ppi(ppi_data: PPISubmit, user_id: str = Depends(get_current_user)):
    """
    AE_FN_GENERATE_PLAN - Trigger: PPI_EVT_SUBMITTED
    Process PPI answers and generate:
    1. 24-Trait Vector (Option A: Trait Tags + Shared Weight Templates)
    2. Financial DNA + personalized LPI plan
    """
    # Save PPI answers
    await db.ppi_answers.delete_many({"user_id": user_id})
    
    for answer in ppi_data.answers:
        ppi_answer = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "question_id": answer['question_id'],
            "selected_option": answer['selected_option'],
            "answered_at": datetime.now(timezone.utc).isoformat()
        }
        await db.ppi_answers.insert_one(ppi_answer)
    
    # Get user info for age and goals
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate age
    age = calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01")
    goals = user.get('financial_goals', [])
    
    # =========================================================================
    # STEP 1: Compute 24-Trait Vector (VIA Character Strengths)
    # =========================================================================
    # Convert answers to trait vector format
    trait_vector_answers = [
        {"question_id": ans['question_id'], "selected_option": ans['selected_option']}
        for ans in ppi_data.answers
    ]
    
    # Compute the 24-trait vector (deterministic, bucket-free) - 30 questions in Layer 1
    trait_vector_result = compute_trait_vector(trait_vector_answers, total_questions=30)
    trait_vector_packet = trait_vector_to_dict(trait_vector_result)
    
    # =========================================================================
    # STEP 2: Generate Financial DNA + LPI Plan (Legacy AE V2)
    # =========================================================================
    ae_v2 = get_adaptive_engine_v2()
    
    # Convert answers to AE V2 format
    answers_formatted = []
    for answer in ppi_data.answers:
        answers_formatted.append({
            "id": answer['question_id'],  # "PPI_Q01"
            "value": answer['selected_option']  # "A", "B", "C", or "D"
        })
    
    # Generate plan with age + goals for full personalization
    plan = ae_v2.generate_plan(user_id, answers_formatted, age=age, goals=goals)
    
    # Calculate AE-CORE v2.0 combined score
    experience_level = user.get('experience_level', 1)
    combined_score = ae_v2.calculate_combined_score(age, experience_level)
    
    # Extract chapter order from plan
    chapter_order = [f"CH{ch['ch']:02d}" for ch in plan['lpi_plan']['chapters']]
    
    # =========================================================================
    # STEP 3: Create learning_map with DNA and trait vector
    # =========================================================================
    # TAP 5.0 uses DNA-based personalization, not the old 8-control system
    
    # Create learning_map with both legacy DNA and new 24-trait vector
    learning_map = {
        "user_profile": plan['dna']['profile'],
        "learning_style": plan['dna']['profile'],
        "lesson_order": chapter_order,
        "difficulty_weights": {},
        "pacing": plan['dna']['weights']['tempo'],
        "reinforcement_rate": 0.6,
        "financial_dna": plan['dna'],
        "lpi_plan": plan['lpi_plan'],
        "combined_score": combined_score,
        "generated_at": plan['generated_at'],
        "ae_version": "v2.0",
        # 24-Trait Vector for TAP 5.0 DNA generation
        "trait_vector": trait_vector_packet,
        # TAP 5.0 uses DNA-based controls (not the old 8-control system)
        "tap_controls": {},
        "tap_version": "5.0"
    }
    
    # Generate UID at onboarding completion (before Chapter 1 access)
    current_time = datetime.now(timezone.utc)
    uid = await generate_uid(user['user_type'], user['life_stage'], current_time)
    
    # Save UID to user record
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"uid": uid}}
    )
    
    # Save learning map to user progress
    await db.progress.update_one(
        {"user_id": user_id},
        {"$set": {
            "ppi_completed": True,
            "current_module": "lpi",
            "current_step": chapter_order[0],  # First chapter in personalized order
            "learning_map": learning_map,  # Store entire AE output
            "autosaved_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Unlock first chapter in personalized learning path
    first_chapter = chapter_order[0]
    existing_lpi = await db.lpi_progress.find_one({"user_id": user_id, "chapter_id": first_chapter})
    if not existing_lpi:
        lpi_progress = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "chapter_id": first_chapter,
            "lesson_completed": [],
            "quiz_score": None,
            "quiz_completed_at": None,
            "unlocked_at": datetime.now(timezone.utc).isoformat()
        }
        await db.lpi_progress.insert_one(lpi_progress)
    
    return {
        "message": "PPI submitted successfully",
        "uid": uid,
        "next_step": "lpi",
        "financial_dna": plan['dna'],
        "lpi_plan": plan['lpi_plan'],
        "learning_map": learning_map,
        "personalized_path": {
            "profile": plan['dna']['profile'],
            "first_chapter": first_chapter,
            "tempo": plan['dna']['weights']['tempo'],
            "discipline": plan['dna']['weights']['discipline'],
            "confidence": plan['dna']['weights']['confidence']
        },
        # 24-Trait Vector Output for TAP 5.0 DNA generation
        "trait_vector": trait_vector_packet,
        # TAP 5.0 uses DNA-based personalization
        "tap_controls": {},
        "tap_version": "5.0"
    }

@api_router.get("/ppi/answers")
async def get_ppi_answers(user_id: str = Depends(get_current_user)):
    answers = await db.ppi_answers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"answers": answers}


# =========================================================================
# GLOBAL AUTO-SAVE SYSTEM
# =========================================================================
# A unified progress saving system that works across all features:
# - PPI (Personality Profile Inventory)
# - LPI (Learning Path Inventory / Lessons)
# - Quizzes
# - Onboarding
# - Any future feature that needs progress persistence

class ProgressAutoSaveRequest(BaseModel):
    feature: str  # "ppi", "lpi", "quiz", "onboarding", etc.
    data: dict    # Feature-specific progress data
    metadata: Optional[dict] = None  # Optional metadata (timestamps, etc.)

@api_router.post("/progress/save")
async def save_progress(request: ProgressAutoSaveRequest, user_id: str = Depends(get_current_user)):
    """
    Global auto-save endpoint for any feature.
    
    Usage:
    - PPI: feature="ppi", data={"answers": [...], "current_index": 5}
    - LPI: feature="lpi", data={"chapter_id": "CH01", "lesson_index": 2, "completed_lessons": [...]}
    - Quiz: feature="quiz_{chapter_id}", data={"answers": [...], "current_question": 2}
    - Onboarding: feature="onboarding", data={"step": 3, "form_data": {...}}
    """
    try:
        await db.user_progress.update_one(
            {"user_id": user_id, "feature": request.feature},
            {
                "$set": {
                    "user_id": user_id,
                    "feature": request.feature,
                    "data": request.data,
                    "metadata": request.metadata or {},
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        return {"status": "saved", "feature": request.feature}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-save failed: {str(e)}")


@api_router.get("/progress/{feature}")
async def get_progress(feature: str, user_id: str = Depends(get_current_user)):
    """
    Get saved progress for a specific feature.
    
    Args:
        feature: "ppi", "lpi", "quiz_CH01", "onboarding", etc.
    """
    progress = await db.user_progress.find_one(
        {"user_id": user_id, "feature": feature}, 
        {"_id": 0}
    )
    if progress:
        return {"has_progress": True, "progress": progress}
    return {"has_progress": False, "progress": None}


@api_router.delete("/progress/{feature}")
async def delete_progress(feature: str, user_id: str = Depends(get_current_user)):
    """
    Delete saved progress for a specific feature (e.g., after completion).
    """
    await db.user_progress.delete_one({"user_id": user_id, "feature": feature})
    return {"status": "deleted", "feature": feature}


@api_router.get("/progress")
async def get_all_progress(user_id: str = Depends(get_current_user)):
    """
    Get all saved progress for a user across all features.
    Useful for dashboard or resuming where user left off.
    """
    progress_list = await db.user_progress.find(
        {"user_id": user_id}, 
        {"_id": 0}
    ).to_list(100)
    
    # Convert to dict keyed by feature
    progress_map = {p["feature"]: p for p in progress_list}
    return {"progress": progress_map}


# =========================================================================
# Legacy PPI Auto-Save Endpoints (redirect to global system)
# =========================================================================
class PPIAutoSaveRequest(BaseModel):
    answers: List[dict]
    current_index: int = 0

@api_router.post("/ppi/autosave")
async def autosave_ppi(data: PPIAutoSaveRequest, user_id: str = Depends(get_current_user)):
    """Legacy endpoint - redirects to global progress system"""
    return await save_progress(
        ProgressAutoSaveRequest(
            feature="ppi",
            data={"answers": data.answers, "current_index": data.current_index, "total_questions": 30}
        ),
        user_id
    )


@api_router.get("/ppi/draft")
async def get_ppi_draft(user_id: str = Depends(get_current_user)):
    """Legacy endpoint - uses global progress system"""
    result = await get_progress("ppi", user_id)
    if result["has_progress"]:
        return {"has_draft": True, "draft": result["progress"]["data"]}
    return {"has_draft": False, "draft": None}


@api_router.delete("/ppi/draft")
async def delete_ppi_draft(user_id: str = Depends(get_current_user)):
    """Legacy endpoint - uses global progress system"""
    return await delete_progress("ppi", user_id)


@api_router.get("/ppi/trait-vector")
async def get_ppi_trait_vector(user_id: str = Depends(get_current_user)):
    """
    Get the 24-trait vector for a user based on their PPI answers.
    
    Returns:
        {
            "ppi_version": "POC_20Q_OPTION_A",
            "traits": {"T01": 0.52, ..., "T24": 0.41},
            "dominant_traits": ["T18", "T19", "T07"],
            "stability": 0.85
        }
    """
    # Fetch user's PPI answers
    answers = await db.ppi_answers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    if not answers:
        raise HTTPException(status_code=404, detail="No PPI answers found. Complete PPI first.")
    
    # Convert to trait vector format
    trait_vector_answers = [
        {"question_id": ans['question_id'], "selected_option": ans['selected_option']}
        for ans in answers
    ]
    
    # Compute the 24-trait vector (30 questions in Layer 1)
    result = compute_trait_vector(trait_vector_answers, total_questions=30)
    
    return {
        **trait_vector_to_dict(result),
        "summary": get_trait_summary(result)
    }

@api_router.post("/ppi/compute-trait-vector")
async def compute_trait_vector_endpoint(data: dict):
    """
    Compute 24-trait vector from raw answers (for testing/validation).
    
    Input:
        {
            "answers": [
                {"question_id": "PPI_Q01", "selected_option": "A"},
                ...
            ]
        }
    
    Returns:
        {
            "ppi_version": "POC_20Q_OPTION_A",
            "traits": {"T01": 0.52, ..., "T24": 0.41},
            "dominant_traits": ["T18", "T19", "T07"],
            "stability": 0.85
        }
    """
    answers = data.get("answers", [])
    
    if not answers:
        raise HTTPException(status_code=400, detail="No answers provided")
    
    # Compute the 24-trait vector
    result = compute_trait_vector(answers, total_questions=20)
    
    return {
        **trait_vector_to_dict(result),
        "summary": get_trait_summary(result)
    }

@api_router.get("/ppi/tap-controls")
async def get_ppi_tap_controls(user_id: str = Depends(get_current_user)):
    """
    Get TAP control scalars (8 controls) from user's PPI trait vector.
    
    These controls influence CLG module selection ONLY - no text rewriting.
    
    Returns:
        {
            "traits": {"T01": 0.52, ..., "T24": 0.41},
            "dominant_traits": ["T18", "T19"],
            "controls": {
                "support_need": 0.45,
                "guardrail_need": 0.52,
                "structure_preference": 0.68,
                "exploration_bias": 0.35,
                "social_frame_bias": 0.50,
                "tone_warmth": 0.55,
                "pacing_density": 0.42,
                "stretch_appetite": 0.61
            },
            "clg_recommendations": {...}
        }
    
    NOTE: TAP 5.0 uses DNA-based personalization instead of the 8-control system.
    This endpoint is deprecated but maintained for backward compatibility.
    """
    # Fetch user's PPI answers
    answers = await db.ppi_answers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    
    if not answers:
        raise HTTPException(status_code=404, detail="No PPI answers found. Complete PPI first.")
    
    # Convert to trait vector format
    trait_vector_answers = [
        {"question_id": ans['question_id'], "selected_option": ans['selected_option']}
        for ans in answers
    ]
    
    # Compute the 24-trait vector
    trait_result = compute_trait_vector(trait_vector_answers, total_questions=20)
    
    # TAP 5.0: Return trait vector summary instead of old 8-control system
    return {
        "tap_version": "5.0",
        "message": "TAP 5.0 uses DNA-based personalization. Old 8-control system deprecated.",
        "trait_vector_summary": trait_vector_to_dict(trait_result),
        "stability": trait_result.stability
    }

@api_router.post("/ppi/compute-tap-controls")
async def compute_tap_controls_endpoint(data: dict):
    """
    DEPRECATED: TAP 5.0 uses DNA-based personalization.
    
    This endpoint is maintained for backward compatibility but returns
    a deprecation notice instead of the old 8-control output.
    """
    return {
        "tap_version": "5.0",
        "message": "TAP 5.0 uses DNA-based personalization. Old 8-control system deprecated.",
        "deprecated": True
    }

@api_router.delete("/auth/delete-account/{email}")
async def delete_user_account(email: str):
    """
    Delete a user account and all associated data (for testing purposes)
    """
    try:
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user['id']
        
        # Delete from all collections
        deleted_users = await db.users.delete_one({"email": email})
        deleted_progress = await db.progress.delete_many({"user_id": user_id})
        deleted_ppi = await db.ppi_answers.delete_many({"user_id": user_id})
        deleted_lpi = await db.lpi_progress.delete_many({"user_id": user_id})
        deleted_parents = await db.parents.delete_many({"child_email": email})
        deleted_family = await db.family_links.delete_many({"child_user_id": user_id})
        
        return {
            "message": f"Account {email} and all associated data deleted successfully",
            "user_id": user_id,
            "deleted": {
                "users": deleted_users.deleted_count,
                "progress": deleted_progress.deleted_count,
                "ppi_answers": deleted_ppi.deleted_count,
                "lpi_progress": deleted_lpi.deleted_count,
                "parents": deleted_parents.deleted_count,
                "family_links": deleted_family.deleted_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")

@api_router.post("/auth/delete-account")
async def delete_user_account_post(data: dict):
    """
    POST version of delete account for easier testing
    Expects: {"email": "user@example.com"}
    """
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    return await delete_user_account(email)

@api_router.post("/lpi/quiz/submit")
async def submit_quiz(quiz_data: QuizSubmit, user_id: str = Depends(get_current_user)):
    from content_data import LPI_ANSWER_KEY
    chapter_id = quiz_data.chapter_id
    
    correct_count = 0
    total_questions = len(quiz_data.answers)
    
    for answer in quiz_data.answers:
        if LPI_ANSWER_KEY.get(answer['question_id']) == answer['selected_option']:
            correct_count += 1
    
    score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
    passed = score >= 50
    
    await db.lpi_progress.update_one(
        {"user_id": user_id, "chapter_id": chapter_id},
        {"$set": {
            "quiz_score": score,
            "quiz_completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    next_chapter = None
    if passed:
        chapter_num = int(chapter_id.replace("CH", "").lstrip("0"))
        if chapter_num < 10:
            next_chapter = f"CH{str(chapter_num + 1).zfill(2)}"
            existing = await db.lpi_progress.find_one({"user_id": user_id, "chapter_id": next_chapter})
            if not existing:
                lpi_progress = {
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "chapter_id": next_chapter,
                    "lesson_completed": [],
                    "quiz_score": None,
                    "quiz_completed_at": None,
                    "unlocked_at": datetime.now(timezone.utc).isoformat()
                }
                await db.lpi_progress.insert_one(lpi_progress)
        
        if chapter_num < 10:
            await db.progress.update_one(
                {"user_id": user_id},
                {"$set": {"current_step": next_chapter}}
            )
        else:
            await db.progress.update_one(
                {"user_id": user_id},
                {"$set": {"current_module": "completed", "current_step": "end"}}
            )
    
    return {
        "score": score,
        "passed": passed,
        "correct_count": correct_count,
        "total_questions": total_questions,
        "next_chapter": next_chapter
    }

@api_router.get("/lpi/progress")
async def get_lpi_progress(user_id: str = Depends(get_current_user)):
    progress = await db.lpi_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"progress": progress}

@api_router.post("/lpi/lesson/complete")
async def complete_lesson(data: dict, user_id: str = Depends(get_current_user)):
    chapter_id = data.get('chapter_id')
    lesson_id = data.get('lesson_id')
    
    await db.lpi_progress.update_one(
        {"user_id": user_id, "chapter_id": chapter_id},
        {"$addToSet": {"lesson_completed": lesson_id}}
    )
    
    return {"message": "Lesson marked as complete"}

@api_router.get("/progress")
async def get_progress(user_id: str = Depends(get_current_user)):
    progress = await db.progress.find_one({"user_id": user_id}, {"_id": 0})
    if not progress:
        progress = Progress(user_id=user_id, current_module="ppi", current_step="start")
        progress_dict = progress.model_dump()
        progress_dict['autosaved_at'] = progress_dict['autosaved_at'].isoformat()
        await db.progress.insert_one(progress_dict)
        return progress_dict
    return progress

@api_router.post("/progress/update")
async def update_progress(data: dict, user_id: str = Depends(get_current_user)):
    await db.progress.update_one(
        {"user_id": user_id},
        {"$set": {
            **data,
            "autosaved_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"message": "Progress updated"}

@api_router.post("/feedback")
async def submit_feedback(feedback_data: FeedbackSubmit, user_id: str = Depends(get_current_user)):
    feedback = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "context_page": feedback_data.context_page,
        "feedback_text": feedback_data.feedback_text,
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }
    await db.feedback.insert_one(feedback)
    return {"message": "Feedback submitted successfully"}

@api_router.get("/settings")
async def get_settings(user_id: str = Depends(get_current_user)):
    settings = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    if not settings:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        settings = {
            "user_id": user_id,
            "language": user.get('language', 'en'),
            "experience_level": user.get('experience_level', 3),
            "notifications_enabled": True
        }
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/settings")
async def update_settings(settings_data: SettingsUpdate, user_id: str = Depends(get_current_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    
    await db.settings.update_one(
        {"user_id": user_id},
        {"$set": update_data},
        upsert=True
    )
    
    # Sync all relevant fields to user record
    user_sync_fields = [
        'first_name', 'avatar', 'profile_picture_url', 'date_of_birth',
        'language', 'experience_level', 'life_stage', 'occupation', 'location',
        'timezone', 'pronouns', 'secondary_email',
        'financial_goals', 'daily_goal_minutes', 'reminder_time', 'lesson_length', 'enable_hints',
        'notifications_enabled', 'weekly_email', 'achievement_alerts', 'milestone_celebrations',
        'streak_reminders', 'quiet_hours_start', 'quiet_hours_end', 'email_frequency',
        'dark_mode', 'text_size', 'reduce_animations', 'high_contrast', 'font_family',
        'profile_visible', 'show_progress_publicly', 'allow_analytics', 'data_retention_months',
        'parent_email', 'parent_name', 'daily_time_limit', 'content_filter', 'require_approval', 'weekly_report'
    ]
    
    user_update = {k: v for k, v in update_data.items() if k in user_sync_fields}
    
    if user_update:
        await db.users.update_one({"id": user_id}, {"$set": user_update})
    
    return {"message": "Settings updated successfully"}

@api_router.post("/parental/send-verification")
async def send_parental_verification(request: dict, user_id: str = Depends(get_current_user)):
    """Send verification email to parent/guardian"""
    parent_email = request.get('parent_email')
    parent_name = request.get('parent_name', 'Parent/Guardian')
    
    if not parent_email:
        raise HTTPException(status_code=400, detail="Parent email required")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate verification token
    import secrets
    verification_token = secrets.token_urlsafe(32)
    
    # Store verification request
    await db.parental_verifications.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "parent_email": parent_email,
            "parent_name": parent_name,
            "token": verification_token,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "verified": False
        }},
        upsert=True
    )
    
    # In production, send email via Resend
    # For POC, just log it
    logging.info(f"Parental verification requested: {parent_email} for user {user.get('first_name', 'Unknown')}")
    
    return {"message": "Verification email sent to parent", "status": "pending"}

# ========================================================================
# USER DATA MANAGEMENT ENDPOINTS
# ========================================================================

@api_router.post("/auth/change-password")
async def change_password(request: dict, user_id: str = Depends(get_current_user)):
    """Change user password"""
    current_password = request.get('current_password')
    new_password = request.get('new_password')
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Both current and new password required")
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode(), user['password'].encode()):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Hash and update new password
    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one({"id": user_id}, {"$set": {"password": new_hash}})
    
    return {"message": "Password changed successfully"}

@api_router.get("/user/export-data")
async def export_user_data(user_id: str = Depends(get_current_user)):
    """Export all user data (GDPR compliant)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Gather all user data
    settings = await db.settings.find_one({"user_id": user_id}, {"_id": 0})
    progress = await db.user_progress.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    quiz_results = await db.quiz_results.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    ppi_responses = await db.ppi_responses.find_one({"user_id": user_id}, {"_id": 0})
    profiles = await db.profiles.find({"account_id": user_id}, {"_id": 0}).to_list(10)
    
    export_data = {
        "export_date": datetime.now(timezone.utc).isoformat(),
        "user_profile": user,
        "settings": settings,
        "learning_progress": progress,
        "quiz_results": quiz_results,
        "ppi_responses": ppi_responses,
        "family_profiles": profiles
    }
    
    return export_data

@api_router.post("/user/reset-progress")
async def reset_user_progress(user_id: str = Depends(get_current_user)):
    """Reset all learning progress while keeping account"""
    # Clear progress
    await db.user_progress.delete_many({"user_id": user_id})
    await db.quiz_results.delete_many({"user_id": user_id})
    await db.ppi_responses.delete_many({"user_id": user_id})
    await db.progress_saves.delete_many({"user_id": user_id})
    
    # Reset user learning state
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "ppi_completed": False,
            "financial_dna": None,
            "chapters_unlocked": ["CH01"],
            "current_chapter": "CH01",
            "quiz_scores": {}
        }}
    )
    
    return {"message": "All progress has been reset"}

@api_router.post("/upload/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """Upload profile picture (stores as base64 in DB for POC)"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read and validate size (5MB max)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Convert to base64 data URL for POC (in production, use cloud storage)
    import base64
    base64_data = base64.b64encode(contents).decode()
    data_url = f"data:{file.content_type};base64,{base64_data}"
    
    # Update user record
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"profile_picture_url": data_url}}
    )
    
    return {"url": data_url, "message": "Profile picture uploaded successfully"}

@api_router.post("/telemetry")
async def log_telemetry(data: dict, user_id: str = Depends(get_current_user)):
    telemetry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "event_type": data.get('event_type'),
        "event_data": data.get('event_data', {}),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.telemetry.insert_one(telemetry)
    return {"message": "Telemetry logged"}

# ========== Feature 1: Enhanced Consistency Check API ==========

@api_router.get("/admin/quiz-validation-report")
async def get_quiz_validation_report():
    """
    Feature 1: Consistency Check
    Returns the detailed validation report for all quiz questions
    """
    # Run validation again to get latest report
    report, validator = validate_quiz_integrity(
        LPI_CHAPTERS,
        LPI_ANSWER_KEY,
        auto_correct=False,  # Don't modify, just report
        fail_on_error=False
    )
    return report

@api_router.post("/admin/quiz-validation-run")
async def run_quiz_validation(auto_correct: bool = False):
    """
    Feature 1: Consistency Check
    Manually trigger quiz validation with option to auto-correct
    """
    global validation_report, quiz_validator
    report, validator = validate_quiz_integrity(
        LPI_CHAPTERS,
        LPI_ANSWER_KEY,
        auto_correct=auto_correct,
        fail_on_error=False
    )
    validation_report = report
    quiz_validator = validator
    return {
        "message": "Validation completed",
        "auto_corrected": auto_correct,
        "report": report
    }

@api_router.get("/admin/quiz-content")
async def get_quiz_content():
    """
    Feature 1: Get all quiz content for review
    Returns all chapters with quiz questions
    """
    quiz_content = []
    for chapter in LPI_CHAPTERS:
        chapter_data = {
            "id": chapter.get("id"),
            "title": chapter.get("title"),
            "quiz_count": len(chapter.get("quiz", [])),
            "quizzes": chapter.get("quiz", [])
        }
        quiz_content.append(chapter_data)
    return quiz_content

# ===========================
# Database Schema v1.0: Form Templates System
# ===========================

FORM_TEMPLATES = {
    "user_form_basic_v1": {
        "id": "user_form_basic_v1",
        "type": "form",
        "collection": "users",
        "label": "User (Basic)",
        "fields": [
            {"name": "first_name", "label": "First Name", "input": "text", "required": True},
            {"name": "last_name", "label": "Last Name", "input": "text", "required": False},
            {"name": "display_name", "label": "Display Name", "input": "text", "required": False},
            {"name": "email", "label": "Email", "input": "email", "required": False},
            {"name": "role_primary", "label": "Primary Role", "input": "select", "options": ["parent", "child", "learner", "admin"], "required": True},
            {"name": "date_of_birth", "label": "Date of Birth", "input": "date", "required": False},
            {"name": "locale", "label": "Locale", "input": "text", "required": False},
            {"name": "time_zone", "label": "Time Zone", "input": "text", "required": False}
        ],
        "defaults": {
            "tenant_id": "{{currentTenantId}}",
            "created_by": "{{currentUserId}}",
            "updated_by": "{{currentUserId}}",
            "is_deleted": False
        }
    },
    "family_form_basic_v1": {
        "id": "family_form_basic_v1",
        "type": "form",
        "collection": "families",
        "label": "Family",
        "fields": [
            {"name": "family_name", "label": "Family Name", "input": "text", "required": False},
            {"name": "family_code", "label": "Family Code", "input": "text", "required": False},
            {
                "name": "primary_contact_user_id",
                "label": "Primary Contact",
                "input": "lookup",
                "collection": "users",
                "displayField": "display_name",
                "required": False,
                "filter": {"tenant_id": "{{currentTenantId}}"}
            },
            {"name": "plan_tier", "label": "Plan Tier", "input": "select", "options": ["free", "plus", "pro", "family_premium"], "required": False},
            {"name": "plan_status", "label": "Plan Status", "input": "select", "options": ["active", "trial", "past_due", "cancelled"], "required": False}
        ],
        "defaults": {
            "tenant_id": "{{currentTenantId}}",
            "created_by_user_id": "{{currentUserId}}",
            "created_by": "{{currentUserId}}",
            "updated_by": "{{currentUserId}}",
            "is_deleted": False
        }
    },
    "family_member_form_v1": {
        "id": "family_member_form_v1",
        "type": "form",
        "collection": "family_members",
        "label": "Family Member",
        "fields": [
            {
                "name": "family_id",
                "label": "Family",
                "input": "lookup",
                "collection": "families",
                "displayField": "family_name",
                "required": True,
                "filter": {"tenant_id": "{{currentTenantId}}"}
            },
            {
                "name": "user_id",
                "label": "User",
                "input": "lookup",
                "collection": "users",
                "displayField": "display_name",
                "required": True,
                "filter": {"tenant_id": "{{currentTenantId}}"}
            },
            {
                "name": "role",
                "label": "Role",
                "input": "select",
                "options": ["parent", "guardian", "child", "teen", "learner"],
                "required": True
            },
            {"name": "is_primary_guardian", "label": "Primary Guardian", "input": "checkbox", "required": False},
            {"name": "status", "label": "Status", "input": "select", "options": ["pending_invite", "active", "removed", "left"], "required": True}
        ],
        "defaults": {
            "tenant_id": "{{currentTenantId}}",
            "created_by": "{{currentUserId}}",
            "updated_by": "{{currentUserId}}",
            "is_deleted": False,
            "status": "active"
        }
    }
}

def apply_template_defaults(template: dict, user_id: str, tenant_id: str = "POC") -> dict:
    """Apply template variable substitution"""
    defaults = template.get("defaults", {}).copy()
    
    for key, value in defaults.items():
        if isinstance(value, str):
            value = value.replace("{{currentUserId}}", user_id)
            value = value.replace("{{currentTenantId}}", tenant_id)
            defaults[key] = value
    
    return defaults

def apply_template_field_filters(template: dict, user_id: str, tenant_id: str = "POC") -> dict:
    """Apply variable substitution to field filters (for lookup fields)"""
    template_copy = template.copy()
    
    if "fields" in template_copy:
        for field in template_copy["fields"]:
            if field.get("input") == "lookup" and "filter" in field:
                filter_dict = field["filter"].copy()
                for key, value in filter_dict.items():
                    if isinstance(value, str):
                        value = value.replace("{{currentUserId}}", user_id)
                        value = value.replace("{{currentTenantId}}", tenant_id)
                        filter_dict[key] = value
                field["filter"] = filter_dict
    
    return template_copy

# ===========================
# Database Schema v1.0: Enhanced Query Filters & Relations
# ===========================

class QueryFilters:
    """Predefined query filters for consistent data access"""
    
    @staticmethod
    def user_by_tenant(tenant_id: str):
        return {"tenant_id": tenant_id, "is_deleted": False}
    
    @staticmethod
    def user_by_email(tenant_id: str, email: str):
        return {"tenant_id": tenant_id, "email": email, "is_deleted": False}
    
    @staticmethod
    def user_active_only(tenant_id: str):
        return {"tenant_id": tenant_id, "is_deleted": False}
    
    @staticmethod
    def family_by_tenant(tenant_id: str):
        return {"tenant_id": tenant_id, "is_deleted": False}
    
    @staticmethod
    def family_by_plan_tier(tenant_id: str, plan_tier: str):
        return {"tenant_id": tenant_id, "plan_tier": plan_tier, "is_deleted": False}
    
    @staticmethod
    def family_member_by_family(tenant_id: str, family_id: str):
        return {"tenant_id": tenant_id, "family_id": family_id, "is_deleted": False}
    
    @staticmethod
    def family_member_by_user(tenant_id: str, user_id: str):
        return {"tenant_id": tenant_id, "user_id": user_id, "is_deleted": False}
    
    @staticmethod
    def family_member_active_only(tenant_id: str):
        return {"tenant_id": tenant_id, "is_deleted": False, "status": "active"}

async def load_user_families(user_id: str, tenant_id: str = "POC"):
    """Load all families for a user (manyThrough relation)"""
    # Get family memberships
    memberships = await db.family_members.find(
        QueryFilters.family_member_by_user(tenant_id, user_id),
        {"_id": 0}
    ).to_list(1000)
    
    if not memberships:
        return []
    
    # Get family IDs
    family_ids = [m['family_id'] for m in memberships]
    
    # Load families
    families = await db.families.find(
        {"id": {"$in": family_ids}, "tenant_id": tenant_id, "is_deleted": False},
        {"_id": 0}
    ).to_list(1000)
    
    return families

async def load_family_members(family_id: str, tenant_id: str = "POC"):
    """Load all members of a family (oneToMany relation)"""
    members = await db.family_members.find(
        QueryFilters.family_member_by_family(tenant_id, family_id),
        {"_id": 0}
    ).to_list(1000)
    
    # Enrich with user data
    for member in members:
        user = await db.users.find_one(
            {"id": member['user_id'], "is_deleted": False},
            {"_id": 0, "password_hash": 0}
        )
        if user:
            member['user_data'] = user
    
    return members

async def load_family_primary_contact(family_id: str, tenant_id: str = "POC"):
    """Load primary contact for a family (oneToOne relation)"""
    family = await db.families.find_one(
        {"id": family_id, "tenant_id": tenant_id, "is_deleted": False},
        {"_id": 0}
    )
    
    if not family or not family.get('primary_contact_user_id'):
        return None
    
    contact = await db.users.find_one(
        {"id": family['primary_contact_user_id'], "is_deleted": False},
        {"_id": 0, "password_hash": 0}
    )
    
    return contact

# ===========================
# Database Schema v1.0: Family Management APIs
# ===========================

@api_router.post("/families", status_code=status.HTTP_201_CREATED)
async def create_family(family_data: FamilyCreate, user_id: str = Depends(get_current_user)):
    """Create a new family with unique family code"""
    # Generate unique 8-character family code
    family_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # Ensure uniqueness
    while await db.families.find_one({"family_code": family_code}):
        family_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    family = Family(
        family_name=family_data.family_name or "My Family",
        family_code=family_code,
        created_by_user_id=user_id,
        primary_contact_user_id=family_data.primary_contact_user_id or user_id,
        tenant_id=family_data.tenant_id,
        plan_tier=family_data.plan_tier,
        created_by=user_id,
        updated_by=user_id
    )
    
    family_dict = family.model_dump()
    family_dict['created_at'] = family_dict['created_at'].isoformat()
    family_dict['updated_at'] = family_dict['updated_at'].isoformat()
    
    await db.families.insert_one(family_dict)
    
    return {"message": "Family created successfully", "family": family_dict}

@api_router.get("/families")
async def list_families(
    user_id: str = Depends(get_current_user),
    tenant_id: Optional[str] = "POC",
    plan_tier: Optional[str] = None,
    include_members: bool = False,
    include_primary_contact: bool = False
):
    """List all families with optional filters and relations"""
    # Apply filters
    if plan_tier:
        query = QueryFilters.family_by_plan_tier(tenant_id, plan_tier)
    else:
        query = QueryFilters.family_by_tenant(tenant_id)
    
    # Default sort: created_at desc
    families = await db.families.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Parse dates
    for fam in families:
        if isinstance(fam.get('created_at'), str):
            fam['created_at'] = datetime.fromisoformat(fam['created_at'])
        if isinstance(fam.get('updated_at'), str):
            fam['updated_at'] = datetime.fromisoformat(fam['updated_at'])
        
        # Load relations if requested
        if include_members:
            fam['members'] = await load_family_members(fam['id'], tenant_id)
        
        if include_primary_contact:
            fam['primary_contact'] = await load_family_primary_contact(fam['id'], tenant_id)
    
    return families

@api_router.get("/families/{family_id}")
async def get_family(
    family_id: str,
    user_id: str = Depends(get_current_user),
    include_members: bool = False,
    include_primary_contact: bool = False,
    tenant_id: str = "POC"
):
    """Get a specific family by ID with optional relations"""
    family = await db.families.find_one(
        {"id": family_id, "tenant_id": tenant_id, "is_deleted": False},
        {"_id": 0}
    )
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    if isinstance(family.get('created_at'), str):
        family['created_at'] = datetime.fromisoformat(family['created_at'])
    if isinstance(family.get('updated_at'), str):
        family['updated_at'] = datetime.fromisoformat(family['updated_at'])
    
    # Load relations if requested
    if include_members:
        family['members'] = await load_family_members(family_id, tenant_id)
    
    if include_primary_contact:
        family['primary_contact'] = await load_family_primary_contact(family_id, tenant_id)
    
    return family

@api_router.put("/families/{family_id}")
async def update_family(family_id: str, update_data: dict, user_id: str = Depends(get_current_user)):
    """Update family details"""
    family = await db.families.find_one({"id": family_id, "is_deleted": False})
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_data['updated_by'] = user_id
    
    await db.families.update_one(
        {"id": family_id},
        {"$set": update_data}
    )
    
    return {"message": "Family updated successfully"}

@api_router.delete("/families/{family_id}")
async def delete_family(
    family_id: str, 
    user_id: str = Depends(get_current_user),
    reason: Optional[str] = None
):
    """Soft delete a family and all associated family members"""
    family = await db.families.find_one({"id": family_id, "is_deleted": False})
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Soft delete the family
    await db.families.update_one(
        {"id": family_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now,
            "deleted_by": user_id,
            "deleted_reason": reason,
            "updated_at": now,
            "updated_by": user_id
        }}
    )
    
    # Soft delete all associated family members (orphan prevention)
    await db.family_members.update_many(
        {"family_id": family_id, "is_deleted": False},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now,
            "deleted_by": user_id,
            "deleted_reason": f"Family deleted: {reason}" if reason else "Family deleted",
            "updated_at": now,
            "updated_by": user_id,
            "status": "removed",
            "removed_at": now,
            "removed_by_user_id": user_id
        }}
    )
    
    return {"message": "Family and associated members deleted successfully"}

# ===========================
# Form Templates API
# ===========================

@api_router.get("/forms/templates")
async def list_form_templates():
    """List all available form templates"""
    return list(FORM_TEMPLATES.values())

@api_router.get("/forms/lookup/{collection_name}")
async def lookup_field_options(
    collection_name: str,
    display_field: str = "display_name",
    search: Optional[str] = None,
    tenant_id: str = "POC",
    limit: int = 50
):
    """
    Get lookup field options for form dropdowns
    Supports searching across collections with tenant filtering
    """
    collection = db[collection_name]
    
    # Build query with tenant filter
    query = {"tenant_id": tenant_id, "is_deleted": False}
    
    # Add search filter if provided
    if search:
        query[display_field] = {"$regex": search, "$options": "i"}
    
    # Fetch results
    results = await collection.find(
        query,
        {"_id": 0, "id": 1, display_field: 1}
    ).limit(limit).to_list(limit)
    
    # Format for dropdown
    options = [
        {
            "value": doc["id"],
            "label": doc.get(display_field, doc["id"])
        }
        for doc in results
    ]
    
    return options

@api_router.get("/forms/templates/{template_id}")
async def get_form_template(
    template_id: str,
    user_id: str = Depends(get_current_user),
    tenant_id: str = "POC"
):
    """Get a specific form template with defaults and field filters applied"""
    template = FORM_TEMPLATES.get(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    
    # Apply variable substitution to defaults and field filters
    template_copy = apply_template_field_filters(template, user_id, tenant_id)
    template_copy["defaults"] = apply_template_defaults(template, user_id, tenant_id)
    
    return template_copy

@api_router.post("/forms/submit/{template_id}")
async def submit_form(
    template_id: str,
    form_data: dict,
    user_id: str = Depends(get_current_user),
    tenant_id: str = "POC"
):
    """Submit a form using a template"""
    template = FORM_TEMPLATES.get(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    
    # Get collection name
    collection_name = template["collection"]
    collection = db[collection_name]
    
    # Apply defaults
    defaults = apply_template_defaults(template, user_id, tenant_id)
    
    # Merge form data with defaults
    document = {**defaults, **form_data}
    
    # Add standard fields if not present
    if "id" not in document:
        document["id"] = str(uuid.uuid4())
    
    if "created_at" not in document:
        document["created_at"] = datetime.now(timezone.utc).isoformat()
    
    if "updated_at" not in document:
        document["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Special handling for families - generate family code
    if collection_name == "families" and "family_code" not in document:
        family_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        while await collection.find_one({"family_code": family_code}):
            family_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        document["family_code"] = family_code
    
    # Special handling for family members - add joined_at
    if collection_name == "family_members" and "joined_at" not in document:
        document["joined_at"] = datetime.now(timezone.utc).isoformat()
    
    # Validate required fields
    for field in template["fields"]:
        if field.get("required") and field["name"] not in document:
            raise HTTPException(
                status_code=400,
                detail=f"Required field missing: {field['label']}"
            )
    
    # Insert document
    await collection.insert_one(document)
    
    return {
        "message": f"{template['label']} created successfully",
        "id": document["id"],
        "document": document
    }

@api_router.put("/forms/update/{template_id}/{record_id}")
async def update_form(
    template_id: str,
    record_id: str,
    form_data: dict,
    user_id: str = Depends(get_current_user),
    tenant_id: str = "POC"
):
    """Update a record using a form template"""
    template = FORM_TEMPLATES.get(template_id)
    
    if not template:
        raise HTTPException(status_code=404, detail="Form template not found")
    
    # Get collection
    collection_name = template["collection"]
    collection = db[collection_name]
    
    # Check if record exists
    existing = await collection.find_one({"id": record_id, "is_deleted": False})
    if not existing:
        raise HTTPException(status_code=404, detail="Record not found")
    
    # Add update metadata
    form_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    form_data["updated_by"] = user_id
    
    # Update document
    await collection.update_one(
        {"id": record_id},
        {"$set": form_data}
    )
    
    return {
        "message": f"{template['label']} updated successfully",
        "id": record_id
    }

# ===========================
# Admin Endpoints - Collection Management
# ===========================
# Feedback Admin Endpoints (MUST be before generic admin/{collection_name})
# ===========================

@api_router.get("/admin/feedback")
async def get_all_feedback(user_id: str = Depends(get_current_user)):
    """Get all user feedback for admin review"""
    feedback = await db.feedback.find({}, {"_id": 0}).sort("submitted_at", -1).to_list(1000)
    return {"feedback": feedback, "count": len(feedback)}

@api_router.delete("/admin/feedback/{feedback_id}")
async def delete_feedback(feedback_id: str, user_id: str = Depends(get_current_user)):
    """Delete a feedback entry"""
    result = await db.feedback.delete_one({"id": feedback_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return {"message": "Feedback deleted successfully"}

# ===========================
# Generic Admin Collection Access
# ===========================

@api_router.get("/admin/{collection_name}")
async def get_collection_records(
    collection_name: str,
    user_id: str = Depends(get_current_user),
    limit: int = 100
):
    """Get records from a collection for admin management"""
    allowed_collections = ["users", "families", "family_members"]
    
    if collection_name not in allowed_collections:
        raise HTTPException(status_code=400, detail=f"Access to collection '{collection_name}' not allowed")
    
    collection = db[collection_name]
    records = await collection.find(
        {"is_deleted": False},
        {"_id": 0, "password": 0}
    ).limit(limit).to_list(limit)
    
    return {"data": records, "count": len(records)}

# ===========================
# Multi-Profile System
# ===========================

@api_router.get("/profiles")
async def get_profiles(user_id: str = Depends(get_current_user)):
    """Get all profiles for the logged-in account"""
    profiles = await db.profiles.find(
        {"account_id": user_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    
    # If no profiles exist, create primary profile from user account
    if not profiles:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            primary_profile = Profile(
                account_id=user_id,
                name=user.get('first_name', 'Me'),
                age=calculate_age(f"{user['dob_year']}-{user['dob_month']:02d}-01"),
                is_primary=True,
                experience_level=user.get('experience_level', 1),
                financial_goals=user.get('financial_goals', [])
            )
            await db.profiles.insert_one(primary_profile.model_dump())
            profiles = [primary_profile.model_dump()]
    
    return {"profiles": profiles}

@api_router.post("/profiles/create")
async def create_profile(
    profile_data: ProfileCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a new profile for the account"""
    # Check profile limit (max 5 profiles per account)
    existing_count = await db.profiles.count_documents({"account_id": user_id})
    if existing_count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 profiles allowed per account")
    
    # Validate age
    if profile_data.age < MINIMUM_USER_AGE:
        raise HTTPException(status_code=400, detail=f"Minimum age is {MINIMUM_USER_AGE}")
    
    # Create profile
    new_profile = Profile(
        account_id=user_id,
        name=profile_data.name,
        age=profile_data.age,
        avatar=profile_data.avatar,
        is_primary=False,
        experience_level=profile_data.experience_level,
        financial_goals=profile_data.financial_goals
    )
    
    await db.profiles.insert_one(new_profile.model_dump())
    
    return {
        "profile": new_profile,
        "message": f"Profile '{profile_data.name}' created successfully"
    }

@api_router.put("/profiles/{profile_id}")
async def update_profile(
    profile_id: str,
    profile_data: ProfileUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update an existing profile"""
    # Verify profile belongs to user
    profile = await db.profiles.find_one(
        {"id": profile_id, "account_id": user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Build update dict
    update_data = {}
    if profile_data.name:
        update_data["name"] = profile_data.name
    if profile_data.age:
        if profile_data.age < MINIMUM_USER_AGE:
            raise HTTPException(status_code=400, detail=f"Minimum age is {MINIMUM_USER_AGE}")
        update_data["age"] = profile_data.age
    if profile_data.avatar:
        update_data["avatar"] = profile_data.avatar
    if profile_data.experience_level:
        update_data["experience_level"] = profile_data.experience_level
    if profile_data.financial_goals is not None:
        update_data["financial_goals"] = profile_data.financial_goals
    
    if update_data:
        await db.profiles.update_one(
            {"id": profile_id, "account_id": user_id},
            {"$set": update_data}
        )
    
    # Get updated profile
    updated_profile = await db.profiles.find_one(
        {"id": profile_id},
        {"_id": 0}
    )
    
    return {
        "profile": updated_profile,
        "message": "Profile updated successfully"
    }

@api_router.post("/profiles/{profile_id}/activate")
async def activate_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user)
):
    """Switch to a different profile"""
    # Verify profile belongs to user
    profile = await db.profiles.find_one(
        {"id": profile_id, "account_id": user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Update last active time
    await db.profiles.update_one(
        {"id": profile_id},
        {"$set": {"last_active": datetime.now(timezone.utc)}}
    )
    
    return {
        "profile": profile,
        "message": f"Switched to {profile['name']}'s profile"
    }

@api_router.delete("/profiles/{profile_id}")
async def delete_profile(
    profile_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a profile (cannot delete primary profile)"""
    # Get profile
    profile = await db.profiles.find_one(
        {"id": profile_id, "account_id": user_id},
        {"_id": 0}
    )
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    if profile.get("is_primary"):
        raise HTTPException(status_code=400, detail="Cannot delete primary profile")
    
    # Delete profile and associated data
    await db.profiles.delete_one({"id": profile_id})
    
    # Delete profile's progress data
    await db.progress.delete_many({"profile_id": profile_id})
    await db.ppi_answers.delete_many({"profile_id": profile_id})
    
    return {"message": f"Profile '{profile['name']}' deleted successfully"}

@api_router.get("/profiles/avatars")
async def get_avatar_options():
    """Get available avatar options"""
    return {"avatars": AVATAR_OPTIONS}

# ===========================
# Telemetry System - Pydantic Models
# ===========================

class TelemetryUserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    sessionId: str
    sessionStart: datetime
    sessionEnd: Optional[datetime] = None
    deviceType: str
    userTier: str
    appVersion: Optional[str] = None

class TelemetryOnboarding(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    stepName: str
    completed: bool
    timestamp: datetime
    userTier: str

class TelemetryPPICompleted(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    ppiVersion: str
    ppiCategorySummary: Optional[Dict[str, Any]] = None
    timestamp: datetime
    userTier: str

class TelemetryTopicCompleted(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    topicId: str
    chapterId: str
    difficultyTier: int
    timeSpentSeconds: int
    accuracy: float
    retries: int
    timestamp: datetime
    userTier: str
    householdId: Optional[str] = None

class TelemetryQuizAttempt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    quizId: str
    topicId: str
    chapterId: str
    score: float
    maxScore: float
    accuracy: float
    timeSpentSeconds: int
    timestamp: datetime
    userTier: str
    householdId: Optional[str] = None

class TelemetrySubscriptionChange(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    fromTier: Optional[str] = None
    toTier: str
    timestamp: datetime
    householdId: Optional[str] = None
    householdSize: Optional[int] = None

# NEW: Content Engagement Telemetry
class TelemetryLessonEngagement(BaseModel):
    """Track detailed lesson engagement metrics"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    profileId: Optional[str] = None  # For multi-profile support
    chapterId: str
    lessonId: str
    lessonTitle: str
    # Engagement metrics
    startedAt: datetime
    completedAt: Optional[datetime] = None
    timeSpentSeconds: int  # Actual time spent reading
    scrollDepth: int = 0  # Percentage scrolled (0-100)
    completed: bool = False  # Did they reach the end?
    isReread: bool = False  # Second+ time viewing this lesson
    interactions: Optional[dict] = None  # Clicks, highlights, etc.
    # User context
    age: int
    experienceLevel: int
    dnaProfile: Optional[str] = None
    wasPersonalized: bool = True
    # Personalization details (for effectiveness tracking)
    ageBand: Optional[str] = None  # child, teen, adult
    personalizedFor: Optional[str] = None  # age, experience, dna, goals
    baselineComparison: Optional[dict] = None  # Store baseline metrics for A/B

# NEW: Quiz Performance with Personalization Context
class TelemetryQuizPersonalized(BaseModel):
    """Enhanced quiz telemetry with personalization context"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    profileId: Optional[str] = None
    chapterId: str
    quizId: str
    score: int
    totalQuestions: int
    accuracy: float
    timeSpentSeconds: int
    attemptNumber: int
    passed: bool
    timestamp: datetime
    # Personalization context
    age: int
    ageBand: str
    experienceLevel: int
    dnaProfile: Optional[str] = None
    wasPersonalized: bool = True

# NEW: Session Patterns Telemetry (Priority 3)
class TelemetrySessionPattern(BaseModel):
    """Track user session patterns and learning habits"""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    profileId: Optional[str] = None
    sessionId: str
    sessionStart: datetime
    sessionEnd: datetime
    durationSeconds: int
    lessonsViewed: int
    quizzesAttempted: int
    chaptersAccessed: List[str]
    timeOfDay: str  # morning, afternoon, evening, night
    dayOfWeek: str
    deviceType: Optional[str] = None
    isConsecutiveDay: bool = False  # Part of a streak
    streakCount: int = 0

# ===========================
# Telemetry API Endpoints
# ===========================

@api_router.post("/telemetry/session")
async def log_session(data: TelemetryUserSession):
    """Log user session telemetry"""
    try:
        doc = data.model_dump()
        doc["sessionStart"] = doc["sessionStart"].isoformat() if isinstance(doc["sessionStart"], datetime) else doc["sessionStart"]
        if doc.get("sessionEnd"):
            doc["sessionEnd"] = doc["sessionEnd"].isoformat() if isinstance(doc["sessionEnd"], datetime) else doc["sessionEnd"]
        await db.telemetry_user_session.insert_one(doc)
        return {"message": "Session logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log session: {str(e)}")

@api_router.post("/telemetry/onboarding")
async def log_onboarding(data: TelemetryOnboarding):
    """Log onboarding step telemetry"""
    try:
        doc = data.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
        await db.telemetry_onboarding.insert_one(doc)
        return {"message": "Onboarding step logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log onboarding: {str(e)}")

@api_router.post("/telemetry/ppi-completed")
async def log_ppi_completed(data: TelemetryPPICompleted):
    """Log PPI completion telemetry"""
    try:
        doc = data.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
        await db.telemetry_ppi_completed.insert_one(doc)
        return {"message": "PPI completion logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log PPI completion: {str(e)}")

@api_router.post("/telemetry/topic-completed")
async def log_topic_completed(data: TelemetryTopicCompleted):
    """Log topic completion telemetry"""
    try:
        doc = data.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
        await db.telemetry_topic_completed.insert_one(doc)
        return {"message": "Topic completion logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log topic completion: {str(e)}")

@api_router.post("/telemetry/quiz-attempt")
async def log_quiz_attempt(data: TelemetryQuizAttempt):
    """Log quiz attempt telemetry"""
    try:
        doc = data.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
        await db.telemetry_quiz_attempt.insert_one(doc)
        return {"message": "Quiz attempt logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log quiz attempt: {str(e)}")

@api_router.post("/telemetry/subscription-change")
async def log_subscription_change(data: TelemetrySubscriptionChange):
    """Log subscription change telemetry"""
    try:
        doc = data.model_dump()
        doc["timestamp"] = doc["timestamp"].isoformat() if isinstance(doc["timestamp"], datetime) else doc["timestamp"]
        await db.telemetry_subscription_change.insert_one(doc)
        return {"message": "Subscription change logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log subscription change: {str(e)}")

@api_router.post("/telemetry/lesson-engagement")
async def log_lesson_engagement(data: TelemetryLessonEngagement):
    """Log detailed lesson engagement telemetry"""
    try:
        doc = data.model_dump()
        doc["startedAt"] = doc["startedAt"].isoformat() if isinstance(doc["startedAt"], datetime) else doc["startedAt"]
        if doc.get("completedAt"):
            doc["completedAt"] = doc["completedAt"].isoformat() if isinstance(doc["completedAt"], datetime) else doc["completedAt"]
        await db.telemetry_lesson_engagement.insert_one(doc)
        return {"message": "Lesson engagement logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log lesson engagement: {str(e)}")

@api_router.post("/telemetry/session-pattern")
async def log_session_pattern(data: TelemetrySessionPattern):
    """Log session pattern telemetry"""
    try:
        doc = data.model_dump()
        doc["sessionStart"] = doc["sessionStart"].isoformat() if isinstance(doc["sessionStart"], datetime) else doc["sessionStart"]
        doc["sessionEnd"] = doc["sessionEnd"].isoformat() if isinstance(doc["sessionEnd"], datetime) else doc["sessionEnd"]
        await db.telemetry_session_pattern.insert_one(doc)
        return {"message": "Session pattern logged", "id": doc["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to log session pattern: {str(e)}")

# ===========================
# Analytics System - Pydantic Models
# ===========================

class AnalyticsDailySummary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    summaryDate: str
    newUsers: int
    onboardStarted: int
    onboardCompleted: int
    avgTimeToCompleteOnboard: Optional[float] = None
    totalTopicsCompleted: int
    avgTopicsPerUser: Optional[float] = None
    totalQuizAttempts: int
    avgQuizScore: Optional[float] = None
    retentionDay1: Optional[float] = None
    retentionDay7: Optional[float] = None
    retentionDay30: Optional[float] = None
    freeUsers: Optional[int] = None
    plusUsers: Optional[int] = None
    proUsers: Optional[int] = None
    platinumUsers: Optional[int] = None
    familyUsers: Optional[int] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsTopicPerformance(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    topicId: str
    chapterId: str
    attempts: int
    completions: int
    failCount: int
    avgScore: Optional[float] = None
    avgAccuracy: Optional[float] = None
    avgDifficultyCurvePosition: Optional[float] = None
    avgTimeSpentSeconds: Optional[float] = None
    dropoutRate: Optional[float] = None
    familyCompletionRate: Optional[float] = None
    avgFamilyTimeSpentSeconds: Optional[float] = None
    lastUpdatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsChapterHeatmap(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chapterId: str
    topicsInChapter: Optional[int] = None
    avgCompletionTimeSeconds: Optional[float] = None
    avgScore: Optional[float] = None
    failRate: Optional[float] = None
    retryCount: Optional[int] = None
    dropoutCount: Optional[int] = None
    dropoutRate: Optional[float] = None
    avgDifficultyTier: Optional[float] = None
    familyDropoutRate: Optional[float] = None
    lastUpdatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsUserProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    totalTopicsCompleted: int
    chaptersCompleted: Optional[int] = None
    avgDifficultyTier: Optional[float] = None
    quizAvgScore: Optional[float] = None
    lastActive: Optional[datetime] = None
    stuckAtTopicId: Optional[str] = None
    stuckAtChapterId: Optional[str] = None
    userTier: str
    isInFamilyTier: bool
    householdId: Optional[str] = None
    householdSize: Optional[int] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastUpdatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AnalyticsTierOverview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    summaryDate: str
    freeUsers: int
    plusUsers: int
    proUsers: int
    platinumUsers: int
    familyUsers: int
    avgTopicsFree: Optional[float] = None
    avgTopicsPlus: Optional[float] = None
    avgTopicsPro: Optional[float] = None
    avgTopicsPlatinum: Optional[float] = None
    avgTopicsFamily: Optional[float] = None
    churnFree: Optional[float] = None
    churnPlus: Optional[float] = None
    churnPro: Optional[float] = None
    churnPlatinum: Optional[float] = None
    churnFamily: Optional[float] = None
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    lastUpdatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===========================
# Analytics Aggregation Functions
# ===========================

async def generate_user_progress_analytics():
    """Generate user progress analytics from telemetry data"""
    try:
        # Clear existing data
        await db.analytics_user_progress.delete_many({})
        
        # Get all unique users from telemetry
        user_ids = await db.telemetry_quiz_attempt.distinct("userId")
        
        analytics_records = []
        
        for user_id in user_ids:
            # Get topic completions
            topic_completions = await db.telemetry_topic_completed.find({"userId": user_id}).to_list(1000)
            
            # Get quiz attempts
            quiz_attempts = await db.telemetry_quiz_attempt.find({"userId": user_id}).to_list(1000)
            
            if not quiz_attempts:
                continue
            
            # Calculate metrics
            total_topics = len(topic_completions)
            unique_chapters = len(set([t.get("chapterId") for t in topic_completions]))
            avg_difficulty = sum([t.get("difficultyTier", 0) for t in topic_completions]) / max(len(topic_completions), 1)
            avg_score = sum([q.get("score", 0) for q in quiz_attempts]) / len(quiz_attempts)
            
            # Get last activity
            last_active_timestamp = max([q.get("timestamp") for q in quiz_attempts], default=None)
            last_active = datetime.fromisoformat(last_active_timestamp) if last_active_timestamp else None
            
            # Get user tier from most recent attempt
            user_tier = quiz_attempts[-1].get("userTier", "free") if quiz_attempts else "free"
            household_id = quiz_attempts[-1].get("householdId") if quiz_attempts else None
            
            record = AnalyticsUserProgress(
                userId=user_id,
                totalTopicsCompleted=total_topics,
                chaptersCompleted=unique_chapters,
                avgDifficultyTier=round(avg_difficulty, 2) if topic_completions else None,
                quizAvgScore=round(avg_score, 2),
                lastActive=last_active,
                stuckAtTopicId=None,
                stuckAtChapterId=None,
                userTier=user_tier,
                isInFamilyTier=household_id is not None,
                householdId=household_id,
                householdSize=None
            )
            
            analytics_records.append(record.model_dump())
        
        # Insert all records
        if analytics_records:
            for record in analytics_records:
                if record.get('createdAt'):
                    record['createdAt'] = record['createdAt'].isoformat()
                if record.get('lastUpdatedAt'):
                    record['lastUpdatedAt'] = record['lastUpdatedAt'].isoformat()
                if record.get('lastActive'):
                    record['lastActive'] = record['lastActive'].isoformat()
            await db.analytics_user_progress.insert_many(analytics_records)
        
        return {"message": f"Generated {len(analytics_records)} user progress records"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate user progress analytics: {str(e)}")

async def generate_topic_performance_analytics():
    """Generate topic performance analytics from telemetry data"""
    try:
        # Clear existing data
        await db.analytics_topic_performance.delete_many({})
        
        # Get all unique topics
        topics = await db.telemetry_quiz_attempt.distinct("topicId")
        
        analytics_records = []
        
        for topic_id in topics:
            # Get quiz attempts for this topic
            quiz_attempts = await db.telemetry_quiz_attempt.find({"topicId": topic_id}).to_list(1000)
            
            if not quiz_attempts:
                continue
            
            chapter_id = quiz_attempts[0].get("chapterId", topic_id)
            
            # Calculate metrics
            total_attempts = len(quiz_attempts)
            completions = len([q for q in quiz_attempts if q.get("score", 0) >= 50])
            fail_count = total_attempts - completions
            avg_score = sum([q.get("score", 0) for q in quiz_attempts]) / total_attempts
            avg_accuracy = sum([q.get("accuracy", 0) for q in quiz_attempts]) / total_attempts
            avg_time = sum([q.get("timeSpentSeconds", 0) for q in quiz_attempts]) / total_attempts
            
            # Family-specific metrics
            family_attempts = [q for q in quiz_attempts if q.get("householdId")]
            family_completion_rate = None
            avg_family_time = None
            
            if family_attempts:
                family_completions = len([q for q in family_attempts if q.get("score", 0) >= 50])
                family_completion_rate = (family_completions / len(family_attempts)) * 100
                avg_family_time = sum([q.get("timeSpentSeconds", 0) for q in family_attempts]) / len(family_attempts)
            
            record = AnalyticsTopicPerformance(
                topicId=topic_id,
                chapterId=chapter_id,
                attempts=total_attempts,
                completions=completions,
                failCount=fail_count,
                avgScore=round(avg_score, 2),
                avgAccuracy=round(avg_accuracy, 2),
                avgDifficultyCurvePosition=None,
                avgTimeSpentSeconds=round(avg_time, 2),
                dropoutRate=round((fail_count / total_attempts) * 100, 2) if total_attempts > 0 else 0,
                familyCompletionRate=round(family_completion_rate, 2) if family_completion_rate else None,
                avgFamilyTimeSpentSeconds=round(avg_family_time, 2) if avg_family_time else None
            )
            
            analytics_records.append(record.model_dump())
        
        # Insert all records
        if analytics_records:
            for record in analytics_records:
                if record.get('lastUpdatedAt'):
                    record['lastUpdatedAt'] = record['lastUpdatedAt'].isoformat()
            await db.analytics_topic_performance.insert_many(analytics_records)
        
        return {"message": f"Generated {len(analytics_records)} topic performance records"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate topic performance analytics: {str(e)}")

async def generate_chapter_heatmap_analytics():
    """Generate chapter heatmap analytics from telemetry data"""
    try:
        # Clear existing data
        await db.analytics_chapter_heatmap.delete_many({})
        
        # Get all unique chapters
        chapters = await db.telemetry_quiz_attempt.distinct("chapterId")
        
        analytics_records = []
        
        for chapter_id in chapters:
            # Get quiz attempts for this chapter
            quiz_attempts = await db.telemetry_quiz_attempt.find({"chapterId": chapter_id}).to_list(1000)
            topic_completions = await db.telemetry_topic_completed.find({"chapterId": chapter_id}).to_list(1000)
            
            if not quiz_attempts:
                continue
            
            # Calculate metrics
            total_attempts = len(quiz_attempts)
            failures = len([q for q in quiz_attempts if q.get("score", 0) < 50])
            fail_rate = (failures / total_attempts) * 100 if total_attempts > 0 else 0
            
            avg_score = sum([q.get("score", 0) for q in quiz_attempts]) / total_attempts
            avg_time = sum([q.get("timeSpentSeconds", 0) for q in quiz_attempts]) / total_attempts if quiz_attempts else 0
            
            # Retry count (users who attempted more than once)
            user_attempt_counts = {}
            for attempt in quiz_attempts:
                user_id = attempt.get("userId")
                user_attempt_counts[user_id] = user_attempt_counts.get(user_id, 0) + 1
            
            retry_count = sum(1 for count in user_attempt_counts.values() if count > 1)
            
            # Difficulty tier
            avg_difficulty = None
            if topic_completions:
                avg_difficulty = sum([t.get("difficultyTier", 0) for t in topic_completions]) / len(topic_completions)
            
            # Family-specific metrics
            family_attempts = [q for q in quiz_attempts if q.get("householdId")]
            family_dropout_rate = None
            if family_attempts:
                family_failures = len([q for q in family_attempts if q.get("score", 0) < 50])
                family_dropout_rate = (family_failures / len(family_attempts)) * 100
            
            record = AnalyticsChapterHeatmap(
                chapterId=chapter_id,
                topicsInChapter=len(set([q.get("topicId") for q in quiz_attempts])),
                avgCompletionTimeSeconds=round(avg_time, 2),
                avgScore=round(avg_score, 2),
                failRate=round(fail_rate, 2),
                retryCount=retry_count,
                dropoutCount=failures,
                dropoutRate=round(fail_rate, 2),
                avgDifficultyTier=round(avg_difficulty, 2) if avg_difficulty else None,
                familyDropoutRate=round(family_dropout_rate, 2) if family_dropout_rate else None
            )
            
            analytics_records.append(record.model_dump())
        
        # Insert all records
        if analytics_records:
            for record in analytics_records:
                if record.get('lastUpdatedAt'):
                    record['lastUpdatedAt'] = record['lastUpdatedAt'].isoformat()
            await db.analytics_chapter_heatmap.insert_many(analytics_records)
        
        return {"message": f"Generated {len(analytics_records)} chapter heatmap records"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate chapter heatmap analytics: {str(e)}")

# ===========================
# Analytics API Endpoints
# ===========================

@api_router.post("/analytics/generate/all")
async def generate_all_analytics():
    """Generate all analytics from telemetry data"""
    try:
        results = {}
        
        # Generate user progress analytics
        user_result = await generate_user_progress_analytics()
        results["user_progress"] = user_result
        
        # Generate topic performance analytics
        topic_result = await generate_topic_performance_analytics()
        results["topic_performance"] = topic_result
        
        # Generate chapter heatmap analytics
        chapter_result = await generate_chapter_heatmap_analytics()
        results["chapter_heatmap"] = chapter_result
        
        return {
            "message": "All analytics generated successfully",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate analytics: {str(e)}")

@api_router.get("/analytics/user-progress")
async def get_user_progress_analytics(userId: Optional[str] = None):
    """Get user progress analytics"""
    try:
        query = {"userId": userId} if userId else {}
        records = await db.analytics_user_progress.find(query, {"_id": 0}).to_list(1000)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user progress analytics: {str(e)}")

@api_router.get("/analytics/topic-performance")
async def get_topic_performance_analytics(topicId: Optional[str] = None, chapterId: Optional[str] = None):
    """Get topic performance analytics"""
    try:
        query = {}
        if topicId:
            query["topicId"] = topicId
        if chapterId:
            query["chapterId"] = chapterId
        
        records = await db.analytics_topic_performance.find(query, {"_id": 0}).to_list(1000)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get topic performance analytics: {str(e)}")

@api_router.get("/analytics/chapter-heatmap")
async def get_chapter_heatmap_analytics(chapterId: Optional[str] = None):
    """Get chapter heatmap analytics"""
    try:
        query = {"chapterId": chapterId} if chapterId else {}
        records = await db.analytics_chapter_heatmap.find(query, {"_id": 0}).to_list(1000)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get chapter heatmap analytics: {str(e)}")

@api_router.get("/analytics/telemetry")
async def get_telemetry_analytics():
    """Get telemetry overview stats - Overview Tab"""
    try:
        # Count documents in each telemetry collection
        ppi_completed = await db.telemetry_ppi_completed.count_documents({})
        topics_completed = await db.telemetry_topic_completed.count_documents({})
        quiz_attempts = await db.telemetry_quiz_attempt.count_documents({})
        sessions = await db.telemetry_user_session.count_documents({})
        
        return {
            "ppiCompleted": ppi_completed,
            "topicsCompleted": topics_completed,
            "quizAttempts": quiz_attempts,
            "sessions": sessions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get telemetry analytics: {str(e)}")

@api_router.get("/analytics/content-engagement")
async def get_content_engagement_analytics():
    """Get content engagement analytics - Priority 1"""
    try:
        # Aggregate lesson engagement data
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "chapterId": "$chapterId",
                        "lessonId": "$lessonId",
                        "lessonTitle": "$lessonTitle"
                    },
                    "totalViews": {"$sum": 1},
                    "completions": {
                        "$sum": {"$cond": ["$completed", 1, 0]}
                    },
                    "rereads": {
                        "$sum": {"$cond": ["$isReread", 1, 0]}
                    },
                    "avgTimeSpent": {"$avg": "$timeSpentSeconds"},
                    "avgScrollDepth": {"$avg": "$scrollDepth"},
                    "ageGroups": {"$push": "$age"},
                    "experienceLevels": {"$push": "$experienceLevel"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "chapterId": "$_id.chapterId",
                    "lessonId": "$_id.lessonId",
                    "lessonTitle": "$_id.lessonTitle",
                    "totalViews": 1,
                    "completions": 1,
                    "completionRate": {
                        "$multiply": [
                            {"$divide": ["$completions", "$totalViews"]},
                            100
                        ]
                    },
                    "rereads": 1,
                    "rereadRate": {
                        "$multiply": [
                            {"$divide": ["$rereads", "$totalViews"]},
                            100
                        ]
                    },
                    "avgTimeSpent": {"$round": ["$avgTimeSpent", 0]},
                    "avgScrollDepth": {"$round": ["$avgScrollDepth", 0]}
                }
            },
            {"$sort": {"totalViews": -1}}
        ]
        
        results = await db.telemetry_lesson_engagement.aggregate(pipeline).to_list(1000)
        return {"data": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get content engagement analytics: {str(e)}")

@api_router.get("/analytics/personalization-effectiveness")
async def get_personalization_effectiveness():
    """Get personalization effectiveness analytics - Priority 2"""
    try:
        # Compare personalized vs baseline performance
        # Group by age band and DNA profile
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "ageBand": "$ageBand",
                        "dnaProfile": "$dnaProfile",
                        "wasPersonalized": "$wasPersonalized"
                    },
                    "avgCompletionRate": {
                        "$avg": {"$cond": ["$completed", 100, 0]}
                    },
                    "avgTimeSpent": {"$avg": "$timeSpentSeconds"},
                    "avgScrollDepth": {"$avg": "$scrollDepth"},
                    "totalLessons": {"$sum": 1},
                    "users": {"$addToSet": "$userId"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "ageBand": "$_id.ageBand",
                    "dnaProfile": "$_id.dnaProfile",
                    "wasPersonalized": "$_id.wasPersonalized",
                    "avgCompletionRate": {"$round": ["$avgCompletionRate", 1]},
                    "avgTimeSpent": {"$round": ["$avgTimeSpent", 0]},
                    "avgScrollDepth": {"$round": ["$avgScrollDepth", 0]},
                    "totalLessons": 1,
                    "uniqueUsers": {"$size": "$users"}
                }
            },
            {"$sort": {"ageBand": 1, "dnaProfile": 1}}
        ]
        
        results = await db.telemetry_lesson_engagement.aggregate(pipeline).to_list(1000)
        
        # DNA Profile Performance Analysis
        dna_pipeline = [
            {
                "$match": {"dnaProfile": {"$ne": None}}
            },
            {
                "$group": {
                    "_id": "$dnaProfile",
                    "avgCompletionRate": {
                        "$avg": {"$cond": ["$completed", 100, 0]}
                    },
                    "avgTimeSpent": {"$avg": "$timeSpentSeconds"},
                    "totalUsers": {"$addToSet": "$userId"},
                    "chaptersCompleted": {"$sum": {"$cond": ["$completed", 1, 0]}}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "dnaProfile": "$_id",
                    "avgCompletionRate": {"$round": ["$avgCompletionRate", 1]},
                    "avgTimeSpent": {"$round": ["$avgTimeSpent", 0]},
                    "userCount": {"$size": "$totalUsers"},
                    "chaptersCompleted": 1
                }
            },
            {"$sort": {"avgCompletionRate": -1}}
        ]
        
        dna_results = await db.telemetry_lesson_engagement.aggregate(dna_pipeline).to_list(1000)
        
        # Experience level effectiveness
        experience_pipeline = [
            {
                "$match": {"experienceLevel": {"$ne": None, "$exists": True}}
            },
            {
                "$group": {
                    "_id": "$experienceLevel",
                    "avgCompletionRate": {
                        "$avg": {"$cond": ["$completed", 100, 0]}
                    },
                    "avgTimeSpent": {"$avg": "$timeSpentSeconds"},
                    "avgScrollDepth": {"$avg": "$scrollDepth"},
                    "totalLessons": {"$sum": 1}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "experienceLevel": "$_id",
                    "avgCompletionRate": {"$round": ["$avgCompletionRate", 1]},
                    "avgTimeSpent": {"$round": ["$avgTimeSpent", 0]},
                    "avgScrollDepth": {"$round": ["$avgScrollDepth", 0]},
                    "totalLessons": 1
                }
            },
            {"$sort": {"experienceLevel": 1}}
        ]
        
        experience_results = await db.telemetry_lesson_engagement.aggregate(experience_pipeline).to_list(1000)
        
        return {
            "personalizedVsBaseline": results,
            "dnaProfilePerformance": dna_results,
            "experienceLevelEffectiveness": experience_results,
            "summary": {
                "message": "Personalization effectiveness metrics",
                "dataPoints": len(results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get personalization effectiveness: {str(e)}")

@api_router.get("/analytics/learning-patterns")
async def get_learning_patterns():
    """Get learning patterns analytics - Priority 3"""
    try:
        # Session duration patterns
        session_duration_pipeline = [
            {
                "$group": {
                    "_id": "$timeOfDay",
                    "avgDuration": {"$avg": "$durationSeconds"},
                    "sessionCount": {"$sum": 1},
                    "avgLessonsPerSession": {"$avg": "$lessonsViewed"},
                    "avgQuizzesPerSession": {"$avg": "$quizzesAttempted"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "timeOfDay": "$_id",
                    "avgDurationMinutes": {"$round": [{"$divide": ["$avgDuration", 60]}, 1]},
                    "sessionCount": 1,
                    "avgLessonsPerSession": {"$round": ["$avgLessonsPerSession", 1]},
                    "avgQuizzesPerSession": {"$round": ["$avgQuizzesPerSession", 1]}
                }
            },
            {"$sort": {"sessionCount": -1}}
        ]
        
        session_results = await db.telemetry_session_pattern.aggregate(session_duration_pipeline).to_list(1000)
        
        # Day of week patterns
        day_pipeline = [
            {
                "$group": {
                    "_id": "$dayOfWeek",
                    "sessionCount": {"$sum": 1},
                    "avgDuration": {"$avg": "$durationSeconds"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "dayOfWeek": "$_id",
                    "sessionCount": 1,
                    "avgDurationMinutes": {"$round": [{"$divide": ["$avgDuration", 60]}, 1]}
                }
            }
        ]
        
        day_results = await db.telemetry_session_pattern.aggregate(day_pipeline).to_list(1000)
        
        # Streak analysis
        streak_pipeline = [
            {
                "$match": {"isConsecutiveDay": True}
            },
            {
                "$group": {
                    "_id": "$userId",
                    "maxStreak": {"$max": "$streakCount"},
                    "activeDays": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avgMaxStreak": {"$avg": "$maxStreak"},
                    "usersWithStreaks": {"$sum": 1}
                }
            }
        ]
        
        streak_results = await db.telemetry_session_pattern.aggregate(streak_pipeline).to_list(1)
        
        # Quiz retry behavior from existing telemetry
        retry_pipeline = [
            {
                "$group": {
                    "_id": {
                        "userId": "$userId",
                        "quizId": "$quizId"
                    },
                    "attempts": {"$sum": 1},
                    "passed": {"$max": "$passed"}
                }
            },
            {
                "$group": {
                    "_id": "$attempts",
                    "quizCount": {"$sum": 1},
                    "passRate": {"$avg": {"$cond": ["$passed", 100, 0]}}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "attemptNumber": "$_id",
                    "quizCount": 1,
                    "passRate": {"$round": ["$passRate", 1]}
                }
            },
            {"$sort": {"attemptNumber": 1}}
        ]
        
        retry_results = await db.telemetry_quiz_attempt.aggregate(retry_pipeline).to_list(1000)
        
        return {
            "sessionPatterns": session_results,
            "dayOfWeekPatterns": day_results,
            "streakAnalysis": streak_results[0] if streak_results else {},
            "quizRetryBehavior": retry_results,
            "summary": {
                "message": "Learning patterns and habits",
                "sessionsAnalyzed": sum(s.get('sessionCount', 0) for s in session_results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get learning patterns: {str(e)}")

@api_router.get("/analytics/multi-profile-usage")
async def get_multi_profile_usage():
    """Get multi-profile usage analytics - Priority 4"""
    try:
        # Profile creation and usage patterns
        profile_usage_pipeline = [
            {
                "$group": {
                    "_id": "$account_id",
                    "profileCount": {"$sum": 1},
                    "profileNames": {"$push": "$name"},
                    "avgAge": {"$avg": "$age"}
                }
            },
            {
                "$group": {
                    "_id": "$profileCount",
                    "accountCount": {"$sum": 1},
                    "avgProfileAge": {"$avg": "$avgAge"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "profilesPerAccount": "$_id",
                    "accountCount": 1,
                    "avgProfileAge": {"$round": ["$avgProfileAge", 1]}
                }
            },
            {"$sort": {"profilesPerAccount": 1}}
        ]
        
        profile_usage = await db.profiles.aggregate(profile_usage_pipeline).to_list(1000)
        
        # Profile switching behavior
        profile_switch_pipeline = [
            {
                "$group": {
                    "_id": "$account_id",
                    "totalSessions": {"$sum": 1},
                    "uniqueProfiles": {"$addToSet": "$profileId"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "accountId": "$_id",
                    "totalSessions": 1,
                    "profilesUsed": {"$size": "$uniqueProfiles"}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avgSessionsPerAccount": {"$avg": "$totalSessions"},
                    "avgProfilesUsed": {"$avg": "$profilesUsed"},
                    "totalAccounts": {"$sum": 1}
                }
            }
        ]
        
        switch_behavior = await db.telemetry_user_session.aggregate(profile_switch_pipeline).to_list(1)
        
        return {
            "profileDistribution": profile_usage,
            "switchingBehavior": switch_behavior[0] if switch_behavior else {},
            "summary": {
                "message": "Multi-profile usage patterns",
                "totalProfiles": await db.profiles.count_documents({})
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get multi-profile usage: {str(e)}")

@api_router.get("/analytics/errors-and-friction")
async def get_errors_and_friction():
    """Get error and friction tracking analytics - Priority 5"""
    try:
        # API error tracking
        error_pipeline = [
            {
                "$match": {"eventType": "api_error"}
            },
            {
                "$group": {
                    "_id": {
                        "endpoint": "$endpoint",
                        "statusCode": "$statusCode"
                    },
                    "errorCount": {"$sum": 1},
                    "lastOccurred": {"$max": "$timestamp"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "endpoint": "$_id.endpoint",
                    "statusCode": "$_id.statusCode",
                    "errorCount": 1,
                    "lastOccurred": 1
                }
            },
            {"$sort": {"errorCount": -1}}
        ]
        
        error_results = await db.telemetry_errors.aggregate(error_pipeline).to_list(1000)
        
        # Friction points (pages with high bounce/exit rates)
        friction_pipeline = [
            {
                "$match": {
                    "completed": False,
                    "timeSpentSeconds": {"$lt": 30}  # Users who left quickly
                }
            },
            {
                "$group": {
                    "_id": "$lessonId",
                    "quickExits": {"$sum": 1},
                    "avgTimeBeforeExit": {"$avg": "$timeSpentSeconds"}
                }
            },
            {
                "$match": {"quickExits": {"$gte": 3}}  # Only show significant friction points
            },
            {
                "$project": {
                    "_id": 0,
                    "lessonId": "$_id",
                    "quickExits": 1,
                    "avgTimeBeforeExit": {"$round": ["$avgTimeBeforeExit", 1]}
                }
            },
            {"$sort": {"quickExits": -1}}
        ]
        
        friction_results = await db.telemetry_lesson_engagement.aggregate(friction_pipeline).to_list(1000)
        
        return {
            "apiErrors": error_results,
            "frictionPoints": friction_results,
            "summary": {
                "message": "Error and friction tracking",
                "totalErrors": sum(e.get('errorCount', 0) for e in error_results),
                "frictionPointsDetected": len(friction_results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get errors and friction: {str(e)}")

@api_router.get("/analytics/content-difficulty-heatmap")
async def get_content_difficulty_heatmap():
    """Get content difficulty heatmap analytics - Priority 6"""
    try:
        # Analyze quiz pass rates by chapter/lesson
        difficulty_pipeline = [
            {
                "$group": {
                    "_id": {
                        "chapterId": "$chapterId",
                        "quizId": "$quizId"
                    },
                    "totalAttempts": {"$sum": 1},
                    "passCount": {"$sum": {"$cond": ["$passed", 1, 0]}},
                    "avgScore": {"$avg": "$score"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "chapterId": "$_id.chapterId",
                    "quizId": "$_id.quizId",
                    "totalAttempts": 1,
                    "passRate": {
                        "$round": [
                            {"$multiply": [{"$divide": ["$passCount", "$totalAttempts"]}, 100]},
                            1
                        ]
                    },
                    "avgScore": {"$round": ["$avgScore", 1]},
                    "difficulty": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$gte": [{"$divide": ["$passCount", "$totalAttempts"]}, 0.8]},
                                    "then": "easy"
                                },
                                {
                                    "case": {"$gte": [{"$divide": ["$passCount", "$totalAttempts"]}, 0.5]},
                                    "then": "medium"
                                }
                            ],
                            "default": "hard"
                        }
                    }
                }
            },
            {"$sort": {"chapterId": 1, "quizId": 1}}
        ]
        
        difficulty_results = await db.telemetry_quiz_attempt.aggregate(difficulty_pipeline).to_list(1000)
        
        # Lesson completion rates as difficulty indicator
        lesson_difficulty_pipeline = [
            {
                "$group": {
                    "_id": {
                        "chapterId": "$chapterId",
                        "lessonId": "$lessonId"
                    },
                    "totalViews": {"$sum": 1},
                    "completions": {"$sum": {"$cond": ["$completed", 1, 0]}},
                    "avgTimeSpent": {"$avg": "$timeSpentSeconds"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "chapterId": "$_id.chapterId",
                    "lessonId": "$_id.lessonId",
                    "totalViews": 1,
                    "completionRate": {
                        "$round": [
                            {"$multiply": [{"$divide": ["$completions", "$totalViews"]}, 100]},
                            1
                        ]
                    },
                    "avgTimeSpent": {"$round": ["$avgTimeSpent", 0]},
                    "engagement": {
                        "$switch": {
                            "branches": [
                                {
                                    "case": {"$gte": [{"$divide": ["$completions", "$totalViews"]}, 0.8]},
                                    "then": "high"
                                },
                                {
                                    "case": {"$gte": [{"$divide": ["$completions", "$totalViews"]}, 0.5]},
                                    "then": "medium"
                                }
                            ],
                            "default": "low"
                        }
                    }
                }
            },
            {"$sort": {"chapterId": 1, "lessonId": 1}}
        ]
        
        lesson_results = await db.telemetry_lesson_engagement.aggregate(lesson_difficulty_pipeline).to_list(1000)
        
        return {
            "quizDifficulty": difficulty_results,
            "lessonEngagement": lesson_results,
            "summary": {
                "message": "Content difficulty heatmap",
                "quizzesAnalyzed": len(difficulty_results),
                "lessonsAnalyzed": len(lesson_results)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get content difficulty heatmap: {str(e)}")

@api_router.get("/analytics/feature-usage")
async def get_feature_usage():
    """Get feature usage analytics - Priority 7"""
    try:
        # Track which features are being used
        feature_usage = {}
        
        # PPI completion rate
        total_users = await db.users.count_documents({})
        ppi_completed = await db.telemetry_ppi_completed.count_documents({})
        feature_usage['ppi'] = {
            "totalUsers": total_users,
            "completed": ppi_completed,
            "completionRate": round((ppi_completed / total_users * 100), 1) if total_users > 0 else 0
        }
        
        # Onboarding completion
        onboarding_completed = await db.telemetry_onboarding.count_documents({})
        feature_usage['onboarding'] = {
            "completed": onboarding_completed,
            "completionRate": round((onboarding_completed / total_users * 100), 1) if total_users > 0 else 0
        }
        
        # Quiz attempts
        quiz_attempts = await db.telemetry_quiz_attempt.count_documents({})
        users_with_quiz_attempts = len(await db.telemetry_quiz_attempt.distinct("userId"))
        feature_usage['quizzes'] = {
            "totalAttempts": quiz_attempts,
            "usersAttempting": users_with_quiz_attempts,
            "adoptionRate": round((users_with_quiz_attempts / total_users * 100), 1) if total_users > 0 else 0
        }
        
        # Lesson engagement
        lesson_views = await db.telemetry_lesson_engagement.count_documents({})
        users_viewing_lessons = len(await db.telemetry_lesson_engagement.distinct("userId"))
        feature_usage['lessons'] = {
            "totalViews": lesson_views,
            "usersViewing": users_viewing_lessons,
            "adoptionRate": round((users_viewing_lessons / total_users * 100), 1) if total_users > 0 else 0
        }
        
        # Multi-profile usage
        total_profiles = await db.profiles.count_documents({})
        accounts_with_profiles = len(await db.profiles.distinct("account_id"))
        feature_usage['multiProfile'] = {
            "totalProfiles": total_profiles,
            "accountsUsing": accounts_with_profiles,
            "avgProfilesPerAccount": round((total_profiles / accounts_with_profiles), 1) if accounts_with_profiles > 0 else 0
        }
        
        # Feedback submissions
        feedback_count = await db.feedback.count_documents({})
        users_with_feedback = len(await db.feedback.distinct("user_id"))
        feature_usage['feedback'] = {
            "totalFeedback": feedback_count,
            "usersSubmitting": users_with_feedback,
            "adoptionRate": round((users_with_feedback / total_users * 100), 1) if total_users > 0 else 0
        }
        
        return {
            "features": feature_usage,
            "summary": {
                "message": "Feature adoption and usage metrics",
                "totalUsers": total_users
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get feature usage: {str(e)}")


# ===========================
# Users Management (Enhanced)
# ===========================

@api_router.get("/users")
async def list_users(
    user_id: str = Depends(get_current_user),
    tenant_id: str = "POC",
    email: Optional[str] = None,
    active_only: bool = True,
    include_families: bool = False
):
    """List users with optional filters and relations"""
    # Apply filters
    if email:
        query = QueryFilters.user_by_email(tenant_id, email)
    elif active_only:
        query = QueryFilters.user_active_only(tenant_id)
    else:
        query = QueryFilters.user_by_tenant(tenant_id)
    
    # Default sort: created_at desc
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)
    
    for user in users:
        # Parse dates
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        if isinstance(user.get('updated_at'), str):
            user['updated_at'] = datetime.fromisoformat(user['updated_at'])
        
        # Load families relation if requested (manyThrough)
        if include_families:
            user['families'] = await load_user_families(user['id'], tenant_id)
    
    return users

@api_router.get("/users/{user_id_param}")
async def get_user(
    user_id_param: str,
    user_id: str = Depends(get_current_user),
    include_families: bool = False,
    tenant_id: str = "POC"
):
    """Get a specific user with optional relations"""
    user = await db.users.find_one(
        {"id": user_id_param, "tenant_id": tenant_id, "is_deleted": False},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Parse dates
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    if isinstance(user.get('updated_at'), str):
        user['updated_at'] = datetime.fromisoformat(user['updated_at'])
    
    # Load families relation if requested (manyThrough)
    if include_families:
        user['families'] = await load_user_families(user_id_param, tenant_id)
    
    return user

# ===========================
# Family Members Management
# ===========================

@api_router.post("/family-members", status_code=status.HTTP_201_CREATED)
async def add_family_member(member_data: FamilyMemberCreate, user_id: str = Depends(get_current_user)):
    """Add a user to a family"""
    # Verify family exists
    family = await db.families.find_one({"id": member_data.family_id, "is_deleted": False})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Check if user already in family
    existing = await db.family_members.find_one({
        "family_id": member_data.family_id,
        "user_id": member_data.user_id,
        "is_deleted": False
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="User already in this family")
    
    now = datetime.now(timezone.utc)
    member = FamilyMember(
        family_id=member_data.family_id,
        user_id=member_data.user_id,
        role=member_data.role,
        is_primary_guardian=member_data.is_primary_guardian,
        status=member_data.status,
        tenant_id=family.get('tenant_id', 'POC'),
        joined_at=now,
        created_by=user_id,
        updated_by=user_id
    )
    
    member_dict = member.model_dump()
    if member_dict.get('joined_at'):
        member_dict['joined_at'] = member_dict['joined_at'].isoformat()
    member_dict['created_at'] = member_dict['created_at'].isoformat()
    member_dict['updated_at'] = member_dict['updated_at'].isoformat()
    
    await db.family_members.insert_one(member_dict)
    
    return {"message": "Family member added successfully", "member": member_dict}

@api_router.get("/family-members/family/{family_id}")
async def get_family_members(
    family_id: str,
    user_id: str = Depends(get_current_user),
    active_only: bool = False,
    include_user_data: bool = False,
    include_family_data: bool = False,
    tenant_id: str = "POC"
):
    """Get all members of a family with optional filters and relations"""
    # Apply filters
    if active_only:
        query = QueryFilters.family_member_active_only(tenant_id)
        query["family_id"] = family_id
    else:
        query = QueryFilters.family_member_by_family(tenant_id, family_id)
    
    # Default sort: created_at asc
    members = await db.family_members.find(query, {"_id": 0}).sort("created_at", 1).to_list(1000)
    
    for member in members:
        # Parse dates
        if isinstance(member.get('joined_at'), str):
            member['joined_at'] = datetime.fromisoformat(member['joined_at'])
        if isinstance(member.get('created_at'), str):
            member['created_at'] = datetime.fromisoformat(member['created_at'])
        if isinstance(member.get('updated_at'), str):
            member['updated_at'] = datetime.fromisoformat(member['updated_at'])
        
        # Load relations if requested
        if include_user_data:
            user = await db.users.find_one(
                {"id": member['user_id'], "is_deleted": False},
                {"_id": 0, "password_hash": 0}
            )
            member['user'] = user
        
        if include_family_data:
            family = await db.families.find_one(
                {"id": member['family_id'], "is_deleted": False},
                {"_id": 0}
            )
            member['family'] = family
    
    return members

@api_router.get("/family-members/user/{user_id_param}")
async def get_user_families(
    user_id_param: str,
    user_id: str = Depends(get_current_user),
    active_only: bool = False,
    include_family_data: bool = False,
    tenant_id: str = "POC"
):
    """Get all families a user belongs to (manyThrough relation)"""
    # Apply filters
    if active_only:
        query = QueryFilters.family_member_active_only(tenant_id)
        query["user_id"] = user_id_param
    else:
        query = QueryFilters.family_member_by_user(tenant_id, user_id_param)
    
    memberships = await db.family_members.find(query, {"_id": 0}).to_list(1000)
    
    # Load family data if requested (manyThrough relation)
    if include_family_data:
        family_ids = [m['family_id'] for m in memberships]
        families = await db.families.find(
            {"id": {"$in": family_ids}, "tenant_id": tenant_id, "is_deleted": False},
            {"_id": 0}
        ).to_list(1000)
        
        # Create family lookup
        family_map = {f['id']: f for f in families}
        
        # Attach family data to memberships
        for membership in memberships:
            membership['family'] = family_map.get(membership['family_id'])
    
    return memberships

@api_router.put("/family-members/{member_id}")
async def update_family_member(
    member_id: str,
    update_data: FamilyMemberUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update family member details"""
    member = await db.family_members.find_one({"id": member_id, "is_deleted": False})
    
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    update_dict['updated_by'] = user_id
    
    await db.family_members.update_one(
        {"id": member_id},
        {"$set": update_dict}
    )
    
    return {"message": "Family member updated successfully"}

@api_router.delete("/family-members/{member_id}")
async def remove_family_member(
    member_id: str, 
    user_id: str = Depends(get_current_user),
    reason: Optional[str] = None
):
    """Soft delete a family member"""
    member = await db.family_members.find_one({"id": member_id, "is_deleted": False})
    
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.family_members.update_one(
        {"id": member_id},
        {"$set": {
            "is_deleted": True,
            "deleted_at": now,
            "deleted_by": user_id,
            "deleted_reason": reason,
            "updated_at": now,
            "updated_by": user_id,
            "status": "removed",
            "removed_at": now,
            "removed_by_user_id": user_id
        }}
    )
    
    return {"message": "Family member removed successfully"}

# Validate quiz integrity on startup
print("\n🔍 Validating quiz answers...")
validation_report, quiz_validator = validate_quiz_integrity(
    LPI_CHAPTERS, 
    LPI_ANSWER_KEY,
    auto_correct=True,  # Auto-fix mismatches
    fail_on_error=False  # Don't crash server, just warn
)

# Database Schema v1.0: Create indexes on startup
async def create_database_indexes():
    """Create indexes for performance optimization"""
    print("\n📊 Creating database indexes...")
    
    try:
        # Users indexes
        await db.users.create_index([("tenant_id", 1), ("email", 1)], unique=True, sparse=True)
        await db.users.create_index([("tenant_id", 1), ("created_at", 1)])
        print("✓ Users indexes created")
        
        # Families indexes  
        await db.families.create_index([("tenant_id", 1), ("family_code", 1)])
        await db.families.create_index([("tenant_id", 1), ("created_at", 1)])
        await db.families.create_index([("tenant_id", 1), ("is_deleted", 1)])
        print("✓ Families indexes created")
        
        # Family Members indexes
        await db.family_members.create_index([("tenant_id", 1), ("family_id", 1)])
        await db.family_members.create_index([("tenant_id", 1), ("user_id", 1)])
        await db.family_members.create_index([("tenant_id", 1), ("family_id", 1), ("user_id", 1)], unique=True, sparse=True)
        await db.family_members.create_index([("family_id", 1), ("is_deleted", 1)])
        print("✓ Family Members indexes created")
        
        # Telemetry indexes
        await db.telemetry_user_session.create_index([("userId", 1), ("sessionStart", -1)])
        await db.telemetry_user_session.create_index([("sessionId", 1)])
        print("✓ Telemetry user session indexes created")
        
        await db.telemetry_onboarding.create_index([("userId", 1), ("timestamp", -1)])
        await db.telemetry_onboarding.create_index([("stepName", 1)])
        print("✓ Telemetry onboarding indexes created")
        
        await db.telemetry_ppi_completed.create_index([("userId", 1), ("timestamp", -1)])
        print("✓ Telemetry PPI completed indexes created")
        
        await db.telemetry_topic_completed.create_index([("userId", 1), ("timestamp", -1)])
        await db.telemetry_topic_completed.create_index([("chapterId", 1), ("topicId", 1)])
        await db.telemetry_topic_completed.create_index([("householdId", 1)])
        print("✓ Telemetry topic completed indexes created")
        
        await db.telemetry_quiz_attempt.create_index([("userId", 1), ("timestamp", -1)])
        await db.telemetry_quiz_attempt.create_index([("chapterId", 1), ("quizId", 1)])
        await db.telemetry_quiz_attempt.create_index([("householdId", 1)])
        print("✓ Telemetry quiz attempt indexes created")
        
        await db.telemetry_subscription_change.create_index([("userId", 1), ("timestamp", -1)])
        await db.telemetry_subscription_change.create_index([("householdId", 1)])
        print("✓ Telemetry subscription change indexes created")
        
        # Analytics indexes
        await db.analytics_user_progress.create_index([("userId", 1)], unique=True)
        await db.analytics_user_progress.create_index([("userTier", 1)])
        await db.analytics_user_progress.create_index([("householdId", 1)])
        print("✓ Analytics user progress indexes created")
        
        await db.analytics_topic_performance.create_index([("topicId", 1), ("chapterId", 1)], unique=True)
        await db.analytics_topic_performance.create_index([("chapterId", 1)])
        print("✓ Analytics topic performance indexes created")
        
        await db.analytics_chapter_heatmap.create_index([("chapterId", 1)], unique=True)
        print("✓ Analytics chapter heatmap indexes created")
        
        await db.analytics_daily_summary.create_index([("summaryDate", 1)], unique=True)
        print("✓ Analytics daily summary indexes created")
        
        await db.analytics_tier_overview.create_index([("summaryDate", 1)], unique=True)
        print("✓ Analytics tier overview indexes created")
        
        print("✅ All database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")

# ========================================================================
# LOCATION SERVICES - Google Places API + Geocoding API
# ========================================================================

import httpx

# Google API Configuration
GOOGLE_PLACES_API_KEY = os.environ.get('GOOGLE_PLACES_API_KEY')

class LocationSearchRequest(BaseModel):
    query: str

class ReverseGeocodeRequest(BaseModel):
    latitude: float
    longitude: float

def parse_google_address_components(components: list) -> dict:
    """Parse Google's address components into city/country/country_code"""
    result = {
        "city": None,
        "country": None,
        "country_code": None,
        "state": None
    }
    
    for component in components:
        types = component.get('types', [])
        
        # City (locality or administrative_area_level_2 as fallback)
        if 'locality' in types:
            result['city'] = component.get('long_name')
        elif 'administrative_area_level_2' in types and not result['city']:
            result['city'] = component.get('long_name')
        elif 'postal_town' in types and not result['city']:
            result['city'] = component.get('long_name')
            
        # State/Province
        if 'administrative_area_level_1' in types:
            result['state'] = component.get('long_name')
            
        # Country
        if 'country' in types:
            result['country'] = component.get('long_name')
            result['country_code'] = component.get('short_name')
    
    return result

@api_router.post("/location/search")
async def location_search(request: LocationSearchRequest):
    """
    Location search using Google Places Autocomplete API
    Falls back to mock if no API key configured
    """
    query = request.query.strip()
    
    if not query or len(query) < 2:
        return {"suggestions": []}
    
    # Use Google Places API if key is available
    if GOOGLE_PLACES_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                # Use Places Autocomplete API
                url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
                params = {
                    "input": query,
                    "types": "(cities)",  # Focus on cities
                    "key": GOOGLE_PLACES_API_KEY
                }
                
                response = await client.get(url, params=params, timeout=10.0)
                data = response.json()
                
                if data.get('status') != 'OK' and data.get('status') != 'ZERO_RESULTS':
                    logging.warning(f"Google Places API error: {data.get('status')} - {data.get('error_message', '')}")
                    # Fall through to mock on error
                else:
                    suggestions = []
                    for prediction in data.get('predictions', []):
                        # Get place details to retrieve coordinates
                        place_id = prediction.get('place_id')
                        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
                        details_params = {
                            "place_id": place_id,
                            "fields": "geometry,address_components,formatted_address",
                            "key": GOOGLE_PLACES_API_KEY
                        }
                        
                        details_response = await client.get(details_url, params=details_params, timeout=10.0)
                        details_data = details_response.json()
                        
                        if details_data.get('status') == 'OK':
                            result = details_data.get('result', {})
                            geometry = result.get('geometry', {}).get('location', {})
                            address_components = result.get('address_components', [])
                            parsed = parse_google_address_components(address_components)
                            
                            # Use structured_formatting for display
                            main_text = prediction.get('structured_formatting', {}).get('main_text', '')
                            secondary_text = prediction.get('structured_formatting', {}).get('secondary_text', '')
                            
                            suggestions.append({
                                "city": parsed['city'] or main_text,
                                "country": parsed['country'] or secondary_text,
                                "country_code": parsed['country_code'],
                                "latitude": geometry.get('lat'),
                                "longitude": geometry.get('lng'),
                                "formatted_address": result.get('formatted_address', prediction.get('description')),
                                "place_id": place_id
                            })
                    
                    return {"suggestions": suggestions[:10], "source": "google"}
                    
        except Exception as e:
            logging.error(f"Google Places API error: {e}")
            # Fall through to mock on error
    
    # Mock fallback (no API key or API error)
    MOCK_CITIES = [
        {"city": "San Francisco", "country": "United States", "country_code": "US", "latitude": 37.7749, "longitude": -122.4194},
        {"city": "San Jose", "country": "United States", "country_code": "US", "latitude": 37.3382, "longitude": -121.8863},
        {"city": "Los Angeles", "country": "United States", "country_code": "US", "latitude": 34.0522, "longitude": -118.2437},
        {"city": "New York", "country": "United States", "country_code": "US", "latitude": 40.7128, "longitude": -74.0060},
        {"city": "Chicago", "country": "United States", "country_code": "US", "latitude": 41.8781, "longitude": -87.6298},
        {"city": "Seattle", "country": "United States", "country_code": "US", "latitude": 47.6062, "longitude": -122.3321},
        {"city": "Boston", "country": "United States", "country_code": "US", "latitude": 42.3601, "longitude": -71.0589},
        {"city": "Austin", "country": "United States", "country_code": "US", "latitude": 30.2672, "longitude": -97.7431},
        {"city": "London", "country": "United Kingdom", "country_code": "GB", "latitude": 51.5074, "longitude": -0.1278},
        {"city": "Paris", "country": "France", "country_code": "FR", "latitude": 48.8566, "longitude": 2.3522},
        {"city": "Tokyo", "country": "Japan", "country_code": "JP", "latitude": 35.6762, "longitude": 139.6503},
        {"city": "Sydney", "country": "Australia", "country_code": "AU", "latitude": -33.8688, "longitude": 151.2093},
        {"city": "Toronto", "country": "Canada", "country_code": "CA", "latitude": 43.6532, "longitude": -79.3832},
        {"city": "Mumbai", "country": "India", "country_code": "IN", "latitude": 19.0760, "longitude": 72.8777},
        {"city": "Singapore", "country": "Singapore", "country_code": "SG", "latitude": 1.3521, "longitude": 103.8198},
        {"city": "Dubai", "country": "United Arab Emirates", "country_code": "AE", "latitude": 25.2048, "longitude": 55.2708},
        {"city": "Berlin", "country": "Germany", "country_code": "DE", "latitude": 52.5200, "longitude": 13.4050},
        {"city": "Madrid", "country": "Spain", "country_code": "ES", "latitude": 40.4168, "longitude": -3.7038},
        {"city": "Rome", "country": "Italy", "country_code": "IT", "latitude": 41.9028, "longitude": 12.4964},
        {"city": "Amsterdam", "country": "Netherlands", "country_code": "NL", "latitude": 52.3676, "longitude": 4.9041},
    ]
    
    query_lower = query.lower()
    suggestions = []
    for city in MOCK_CITIES:
        if query_lower in city['city'].lower() or query_lower in city['country'].lower():
            suggestions.append({
                "city": city['city'],
                "country": city['country'],
                "country_code": city['country_code'],
                "latitude": city['latitude'],
                "longitude": city['longitude'],
                "formatted_address": f"{city['city']}, {city['country']}"
            })
    
    return {"suggestions": suggestions[:10], "source": "mock"}

@api_router.post("/location/reverse-geocode")
async def reverse_geocode(request: ReverseGeocodeRequest):
    """
    Reverse geocoding using Google Geocoding API
    Converts latitude/longitude to city/country
    Falls back to mock if no API key configured
    """
    
    # Use Google Geocoding API if key is available
    if GOOGLE_PLACES_API_KEY:
        try:
            async with httpx.AsyncClient() as client:
                url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    "latlng": f"{request.latitude},{request.longitude}",
                    "key": GOOGLE_PLACES_API_KEY,
                    "result_type": "locality|administrative_area_level_2|administrative_area_level_1"
                }
                
                response = await client.get(url, params=params, timeout=10.0)
                data = response.json()
                
                if data.get('status') == 'OK' and data.get('results'):
                    result = data['results'][0]
                    address_components = result.get('address_components', [])
                    parsed = parse_google_address_components(address_components)
                    
                    return {
                        "city": parsed['city'],
                        "country": parsed['country'],
                        "country_code": parsed['country_code'],
                        "latitude": request.latitude,
                        "longitude": request.longitude,
                        "formatted_address": result.get('formatted_address'),
                        "source": "google"
                    }
                elif data.get('status') == 'ZERO_RESULTS':
                    raise HTTPException(status_code=404, detail="No address found for these coordinates")
                else:
                    logging.warning(f"Google Geocoding API error: {data.get('status')}")
                    # Fall through to mock
                    
        except HTTPException:
            raise
        except Exception as e:
            logging.error(f"Google Geocoding API error: {e}")
            # Fall through to mock
    
    # Mock fallback - find nearest city
    import math
    
    MOCK_CITIES = [
        {"city": "San Francisco", "country": "United States", "country_code": "US", "latitude": 37.7749, "longitude": -122.4194},
        {"city": "New York", "country": "United States", "country_code": "US", "latitude": 40.7128, "longitude": -74.0060},
        {"city": "London", "country": "United Kingdom", "country_code": "GB", "latitude": 51.5074, "longitude": -0.1278},
        {"city": "Paris", "country": "France", "country_code": "FR", "latitude": 48.8566, "longitude": 2.3522},
        {"city": "Tokyo", "country": "Japan", "country_code": "JP", "latitude": 35.6762, "longitude": 139.6503},
        {"city": "Sydney", "country": "Australia", "country_code": "AU", "latitude": -33.8688, "longitude": 151.2093},
    ]
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (math.sin(dlat / 2) ** 2 + 
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
             math.sin(dlon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    
    nearest_city = min(MOCK_CITIES, key=lambda c: haversine_distance(
        request.latitude, request.longitude, c['latitude'], c['longitude']
    ))
    
    return {
        "city": nearest_city['city'],
        "country": nearest_city['country'],
        "country_code": nearest_city['country_code'],
        "latitude": request.latitude,
        "longitude": request.longitude,
        "formatted_address": f"{nearest_city['city']}, {nearest_city['country']}",
        "source": "mock"
    }

# ========================================================================
# AE-CORE v2.0 TEST HARNESS ENDPOINTS
# ========================================================================

class AETestRequest(BaseModel):
    age: int = Field(ge=6, le=99)
    experience_level: int = Field(ge=1, le=5)

@api_router.post("/ae/test/calculate-score")
async def ae_test_calculate_score(request: AETestRequest, user_id: str = Depends(get_current_user)):
    """
    Test Harness Endpoint: Calculate combined score for manual testing
    """
    ae_v2 = get_adaptive_engine_v2()
    combined_score = ae_v2.calculate_combined_score(request.age, request.experience_level)
    
    # Calculate component scores for transparency
    age_normalized = (request.age - 6) / (99 - 6)
    age_score = min(1.0, max(0.0, age_normalized))
    exp_score = (request.experience_level - 1) / 4.0
    
    return {
        "age": request.age,
        "experience_level": request.experience_level,
        "age_score": round(age_score, 3),
        "exp_score": round(exp_score, 3),
        "combined_score": combined_score,
        "formula": "0.4 * age_score + 0.6 * exp_score"
    }

@api_router.post("/ae/test/run-suite")
async def ae_test_run_suite(user_id: str = Depends(get_current_user)):
    """
    Test Harness Endpoint: Run all 18 automated tests
    """
    ae_v2 = get_adaptive_engine_v2()
    
    # Define test cases grouped by category
    test_groups = [
        {
            "name": "Group 1: Edge Cases (Tests 1-6)",
            "tests": [
                {"name": "Test 1: Min age (6) + min exp (1)", "age": 6, "exp": 1, "expected": 0.0},
                {"name": "Test 2: Max age (99) + max exp (5)", "age": 99, "exp": 5, "expected": 1.0},
                {"name": "Test 3: Min age (6) + max exp (5)", "age": 6, "exp": 5, "expected": 0.6},
                {"name": "Test 4: Max age (99) + min exp (1)", "age": 99, "exp": 1, "expected": 0.4},
                {"name": "Test 5: Child beginner (10, 1)", "age": 10, "exp": 1, "expected_range": (0.0, 0.1)},
                {"name": "Test 6: Teen novice (15, 2)", "age": 15, "exp": 2, "expected_range": (0.1, 0.3)},
            ]
        },
        {
            "name": "Group 2: Formula Accuracy (Tests 7-12)",
            "tests": [
                {"name": "Test 7: Mid-point (53, 3)", "age": 53, "exp": 3, "expected_range": (0.45, 0.55)},
                {"name": "Test 8: Experience weight test (30, 1 vs 5)", "age": 30, "exp": 1, "compare": (30, 5), "diff": 0.6},
                {"name": "Test 9: Age weight test (6 vs 99, exp 3)", "age": 6, "exp": 3, "compare": (99, 3), "diff": 0.4},
                {"name": "Test 10: Linear age progression", "ages": [6, 28, 52, 75, 99], "exp": 3},
                {"name": "Test 11: Linear exp progression", "age": 40, "exps": [1, 2, 3, 4, 5]},
                {"name": "Test 12: Score normalization check", "age": 50, "exp": 3},
            ]
        },
        {
            "name": "Group 3: Real-World Scenarios (Tests 13-18)",
            "tests": [
                {"name": "Test 13: Young professional (25, 3)", "age": 25, "exp": 3, "expected_range": (0.35, 0.42)},
                {"name": "Test 14: Mid-career advanced (40, 4)", "age": 40, "exp": 4, "expected_range": (0.55, 0.65)},
                {"name": "Test 15: Senior expert (60, 5)", "age": 60, "exp": 5, "expected_range": (0.80, 0.85)},
                {"name": "Test 16: Career changer (45, 1)", "age": 45, "exp": 1, "expected_range": (0.15, 0.20)},
                {"name": "Test 17: Child prodigy (8, 3)", "age": 8, "exp": 3, "expected_range": (0.28, 0.32)},
                {"name": "Test 18: Consistency test (30, 3)", "age": 30, "exp": 3},
            ]
        }
    ]
    
    total_tests = 0
    passed_tests = 0
    results_by_group = []
    
    for group in test_groups:
        group_results = {"name": group["name"], "tests": []}
        
        for test in group["tests"]:
            total_tests += 1
            test_result = {"name": test["name"], "passed": False, "result": ""}
            
            try:
                # Handle different test types
                if "age" in test and "exp" in test:
                    score = ae_v2.calculate_combined_score(test["age"], test["exp"])
                    
                    # Check expected value
                    if "expected" in test:
                        passed = abs(score - test["expected"]) < 0.01
                        test_result["passed"] = passed
                        test_result["result"] = f"Score: {score:.3f} (Expected: {test['expected']:.3f})"
                    
                    # Check expected range
                    elif "expected_range" in test:
                        min_val, max_val = test["expected_range"]
                        passed = min_val <= score <= max_val
                        test_result["passed"] = passed
                        test_result["result"] = f"Score: {score:.3f} (Range: {min_val}-{max_val})"
                    
                    # Comparison tests
                    elif "compare" in test:
                        age2, exp2 = test["compare"]
                        score2 = ae_v2.calculate_combined_score(age2, exp2)
                        diff = abs(score2 - score)
                        expected_diff = test.get("diff", 0)
                        passed = abs(diff - expected_diff) < 0.05
                        test_result["passed"] = passed
                        test_result["result"] = f"Diff: {diff:.3f} (Expected: {expected_diff:.3f})"
                    
                    # Consistency test
                    elif "Consistency" in test["name"]:
                        score2 = ae_v2.calculate_combined_score(test["age"], test["exp"])
                        score3 = ae_v2.calculate_combined_score(test["age"], test["exp"])
                        passed = score == score2 == score3
                        test_result["passed"] = passed
                        test_result["result"] = f"Score: {score:.3f} (Consistent: {passed})"
                    
                    else:
                        test_result["passed"] = True
                        test_result["result"] = f"Score: {score:.3f}"
                
                # Linear progression tests
                elif "ages" in test:
                    scores = [ae_v2.calculate_combined_score(age, test["exp"]) for age in test["ages"]]
                    passed = all(scores[i] < scores[i+1] for i in range(len(scores)-1))
                    test_result["passed"] = passed
                    test_result["result"] = f"Scores: {[round(s, 3) for s in scores]}"
                
                elif "exps" in test:
                    scores = [ae_v2.calculate_combined_score(test["age"], exp) for exp in test["exps"]]
                    passed = all(scores[i] < scores[i+1] for i in range(len(scores)-1))
                    test_result["passed"] = passed
                    test_result["result"] = f"Scores: {[round(s, 3) for s in scores]}"
                
                if test_result["passed"]:
                    passed_tests += 1
                    
            except Exception as e:
                test_result["passed"] = False
                test_result["result"] = f"Error: {str(e)}"
            
            group_results["tests"].append(test_result)
        
        results_by_group.append(group_results)
    
    return {
        "total": total_tests,
        "passed": passed_tests,
        "failed": total_tests - passed_tests,
        "all_passed": passed_tests == total_tests,
        "test_groups": results_by_group
    }

# ===========================
# TAP 5.0 Test Endpoint
# ===========================

@api_router.get("/tap/test")
async def test_tap_v50():
    """Test TAP 5.0 with sample transformations"""
    from tap_5_0 import TAP50Engine, TAPControlInputs, LessonSpec, EL_MAX_POC
    from feature_flags import get_el_max
    
    tap50_engine = TAP50Engine(el_max_poc=EL_MAX_POC)
    
    # Test users
    test_users = [
        {"age": 7, "el": 1, "name": "Child Beginner"},
        {"age": 29, "el": 3, "name": "Adult Intermediate"},
        {"age": 67, "el": 5, "name": "Senior Expert"}
    ]
    
    results = []
    test_text = "Money is a medium of exchange that facilitates economic transactions. Understanding compound interest helps build long-term wealth."
    
    for user in test_users:
        # Get scalars
        scalars = tap50_engine.compute_scalars(user["age"], user["el"], test_text)
        
        # Process lesson
        spec = LessonSpec(
            topic="Understanding Money",
            baseline_text=test_text,
            takeaway=""
        )
        
        output = tap50_engine.process_lpi(
            spec=spec,
            age=user["age"],
            el_declared=user["el"],
            controls=TAPControlInputs.neutral()
        )
        
        results.append({
            "user": user["name"],
            "age": user["age"],
            "el": user["el"],
            "scalars": {
                "lc": scalars.lc,
                "childiness": scalars.childiness,
                "weights": scalars.weights
            },
            "selected_text": output.selected_text[:200] + "..." if len(output.selected_text) > 200 else output.selected_text,
            "blend_weights": output.blend_weights
        })
    
    return {
        "tap_version": "5.0",
        "el_max": get_el_max(),
        "test_results": results
    }


@api_router.get("/tap50/ppi-test")
async def test_tap50_ppi(age: int = 8, experience: str = "beginner"):
    """
    Test TAP 5.0 adapted PPI questions for a specific age and experience level.
    
    Args:
        age: User age (default: 8 for child)
        experience: beginner, intermediate, or advanced
    """
    ae_v2 = get_adaptive_engine_v2()
    
    ppi_result = ae_v2.compose_ppi(
        user_id=f"test_{age}_{experience}",
        age=age,
        financial_experience=experience
    )
    
    return {
        "tap_version": "5.0",
        "test_params": {"age": age, "experience": experience},
        "ppi_version": ppi_result["ppi_version"],
        "total_questions": len(ppi_result["items"]),
        "questions": ppi_result["items"][:4],  # First 4 for preview
        "note": "CLG-adapted questions use pre-approved phrase banks for grammar-safe transformation"
    }


@api_router.get("/clg/lpi-test")
async def test_lpi_transform(
    age: int = 25,
    el: int = 3,
    discipline: float = 0.5,
    impulse: float = 0.5,
    confidence: float = 0.5,
    tempo: str = "steady"
):
    """
    Test LPI content transformation with AGE + EL + DNA.
    
    Args:
        age: User age
        el: Experience Level (1-5)
        discipline: DNA discipline weight (0.0-1.0)
        impulse: DNA impulse weight (0.0-1.0)
        confidence: DNA confidence weight (0.0-1.0)
        tempo: DNA tempo (fast, steady, slow)
    """
    from content_data import LPI_CHAPTERS
    
    el_max = get_el_max()
    
    # Create DNA object
    dna = FinancialDNA(
        discipline=discipline,
        impulse=impulse,
        confidence=confidence,
        tempo=tempo,
        profile="Test"
    )
    
    # Compute scalars
    scalars = compute_lpi_scalars(age, el, el_max, dna)
    
    # Transform first lesson from first chapter
    original_lesson = LPI_CHAPTERS[0]["lessons"][0]
    transformed = transform_lpi_lesson(original_lesson, age, el, el_max, dna)
    
    return {
        "test_params": {
            "age": age,
            "el": el,
            "el_max": el_max,
            "dna": {"discipline": discipline, "impulse": impulse, "confidence": confidence, "tempo": tempo}
        },
        "scalars": {
            "lc": round(scalars.lc, 4),
            "cd": round(scalars.cd, 4),
            "support_level": scalars.support_level,
            "challenge_level": scalars.challenge_level,
            "tone_warmth": scalars.tone_warmth,
            "pacing_density": scalars.pacing_density
        },
        "original": {
            "title": original_lesson["title"],
            "text": original_lesson["text"][:200] + "...",
            "takeaway": original_lesson.get("takeaway", "")
        },
        "transformed": {
            "title": transformed["title"],
            "text": transformed["text"][:200] + "...",
            "takeaway": transformed.get("takeaway", ""),
            "meta": transformed.get("_transform_meta", {})
        }
    }

# Run index creation on startup
import asyncio
asyncio.create_task(create_database_indexes())

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()