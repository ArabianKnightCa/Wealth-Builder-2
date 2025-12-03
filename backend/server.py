from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
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
from pathlib import Path
from content_data import PPI_QUESTIONS, LPI_CHAPTERS, LPI_ANSWER_KEY
from ae_engine import get_adaptive_engine
from ae_engine_v2 import get_adaptive_engine_v2
from quiz_validator import validate_quiz_integrity

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-12345')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

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
    user_type: str = "POC"  # POC, B1, B2, B3, COMM
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
    user_code: str  # UID-ENV-COHORT-SEQ-TIMESTAMP
    user_type: str  # POC, B1, B2, B3, COMM
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

class SettingsUpdate(BaseModel):
    language: Optional[str] = None
    experience_level: Optional[int] = None
    notifications_enabled: Optional[bool] = None

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
    except jwt.JWTError:
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

# ===========================
# API Endpoints
# ===========================

@api_router.get("/")
async def root():
    return {"message": "Mizo Wealth Builder API", "version": "3.0"}

@api_router.get("/content/ppi")
async def get_ppi_questions():
    """Legacy endpoint - returns static 20 questions"""
    return {"questions": PPI_QUESTIONS}

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
    financial_experience = user.get('experience_level', 'beginner')
    if isinstance(financial_experience, int):
        # Map numeric to string
        exp_map = {1: 'beginner', 2: 'beginner', 3: 'intermediate', 4: 'advanced', 5: 'advanced'}
        financial_experience = exp_map.get(financial_experience, 'beginner')
    
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
async def get_lpi_chapters():
    return {"chapters": LPI_CHAPTERS}

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    age = calculate_age(user_data.date_of_birth)
    if age < 8:
        raise HTTPException(status_code=400, detail="User must be at least 8 years old")
    
    # Determine cohort from occupation
    cohort = determine_cohort(user_data.occupation)
    
    # Check if minor (< 18)
    is_minor = age < 18
    account_status = "restricted" if (is_minor and not user_data.parent_email) else "active"
    
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

@api_router.post("/ppi/submit")
async def submit_ppi(ppi_data: PPISubmit, user_id: str = Depends(get_current_user)):
    """
    AE_FN_GENERATE_PLAN - Trigger: PPI_EVT_SUBMITTED
    Process PPI answers and generate Financial DNA + personalized LPI plan
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
    
    # Call AE V2 generate_plan
    ae_v2 = get_adaptive_engine_v2()
    
    # Convert answers to AE V2 format
    answers_formatted = []
    for answer in ppi_data.answers:
        answers_formatted.append({
            "id": answer['question_id'],  # "PPI_Q01"
            "value": answer['selected_option']  # "A", "B", "C", or "D"
        })
    
    # Generate plan
    plan = ae_v2.generate_plan(user_id, answers_formatted)
    
    # Extract chapter order from plan
    chapter_order = [f"CH{ch['ch']:02d}" for ch in plan['lpi_plan']['chapters']]
    
    # Create learning_map for backward compatibility with old format
    learning_map = {
        "user_profile": plan['dna']['profile'],
        "learning_style": plan['dna']['profile'],
        "lesson_order": chapter_order,
        "difficulty_weights": {},  # Can be populated if needed
        "pacing": plan['dna']['weights']['tempo'],
        "reinforcement_rate": 0.6,
        "financial_dna": plan['dna'],
        "lpi_plan": plan['lpi_plan'],
        "generated_at": plan['generated_at'],
        "ae_version": "v2.0"
    }
    
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
        }
    }

@api_router.get("/ppi/answers")
async def get_ppi_answers(user_id: str = Depends(get_current_user)):
    answers = await db.ppi_answers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"answers": answers}

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


@api_router.post("/feedback")
async def submit_feedback(data: dict):
    """
    Submit user feedback
    """
    try:
        feedback_doc = {
            "user_id": data.get("user_id"),
            "user_email": data.get("user_email"),
            "feedback": data.get("feedback"),
            "submitted_at": data.get("submitted_at"),
            "created_at": datetime.now(timezone.utc)
        }
        
        await db.feedback.insert_one(feedback_doc)
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

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
    
    if 'language' in update_data or 'experience_level' in update_data:
        user_update = {}
        if 'language' in update_data:
            user_update['language'] = update_data['language']
        if 'experience_level' in update_data:
            user_update['experience_level'] = update_data['experience_level']
        await db.users.update_one({"id": user_id}, {"$set": user_update})
    
    return {"message": "Settings updated successfully"}

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
        
        print("✅ All database indexes created successfully")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")

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