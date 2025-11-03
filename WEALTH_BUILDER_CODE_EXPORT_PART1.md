# Wealth Builder - Complete Source Code Export
## All Application Code for Documentation & Handoff

**Export Date:** January 11, 2025  
**Version:** POC v3.3  
**Purpose:** Complete code archive for no-code documentation

---

## Table of Contents
1. [Backend Code](#backend-code)
2. [Frontend Code](#frontend-code)
3. [Configuration Files](#configuration-files)
4. [Content Data](#content-data)

---

## BACKEND CODE

### File: `/app/backend/server.py`
**Purpose:** Main FastAPI application with all API endpoints

\`\`\`python
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
from content_data import PPI_QUESTIONS, LPI_CHAPTERS

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
    user_type: str = "POC"
    occupation: str
    school_name: Optional[str] = None
    school_city: Optional[str] = None
    school_state: Optional[str] = None
    parent_email: Optional[EmailStr] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    person_key: str
    user_code: str
    user_type: str
    cohort: str
    email: EmailStr
    first_name: str
    dob_month: int
    dob_year: int
    language: str = "en"
    experience_level: int
    occupation: str
    school_name: Optional[str] = None
    school_city: Optional[str] = None
    school_state: Optional[str] = None
    school_verified: bool = False
    age_verified: bool = True
    account_status: str = "active"
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
    try:
        dob = datetime.strptime(date_of_birth, "%Y-%m-%d")
        today = datetime.now()
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return age
    except:
        return 0

def generate_person_key() -> str:
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=8))
    return f"PK-{random_part}"

def generate_parent_key() -> str:
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=8))
    return f"PPK-{random_part}"

def generate_link_token() -> str:
    chars = string.ascii_uppercase + string.digits
    random_part = ''.join(random.choices(chars, k=6))
    return f"FLK-{random_part}"

def determine_cohort(occupation: str) -> str:
    edu_roles = [
        "Middle / High School Student",
        "College / University Student",
        "Part-Time Worker / Student",
        "Educator / Mentor / Advisor"
    ]
    return "EDU" if occupation in edu_roles else "GEN"

async def generate_user_code(user_type: str, cohort: str, created_at: datetime) -> str:
    count = await db.users.count_documents({"user_type": user_type, "cohort": cohort})
    seq = count + 1
    return f"UID-PST-{cohort}-{seq}"

# ===========================
# API Endpoints
# ===========================

@api_router.get("/")
async def root():
    return {"message": "Wealth Builder API", "version": "3.0"}

@api_router.get("/content/ppi")
async def get_ppi_questions():
    return {"questions": PPI_QUESTIONS}

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
    
    cohort = determine_cohort(user_data.occupation)
    is_minor = age < 18
    account_status = "restricted" if (is_minor and not user_data.parent_email) else "active"
    
    person_key = generate_person_key()
    created_at = datetime.now(timezone.utc)
    user_code = await generate_user_code(user_data.user_type, cohort, created_at)
    
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
        school_name=user_data.school_name,
        school_city=user_data.school_city,
        school_state=user_data.school_state,
        school_verified=False if user_data.school_name else True,
        age_verified=True,
        account_status=account_status
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_password
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    if is_minor and user_data.parent_email:
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
        
        link_token = generate_link_token()
        family_link = {
            "parent_key": parent_key,
            "child_person_key": person_key,
            "link_token": link_token,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "revoked_at": None
        }
        await db.family_links.insert_one(family_link)
        
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
    
    await db.progress.update_one(
        {"user_id": user_id},
        {"$set": {
            "ppi_completed": True,
            "current_module": "lpi",
            "current_step": "CH01",
            "autosaved_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    existing_lpi = await db.lpi_progress.find_one({"user_id": user_id, "chapter_id": "CH01"})
    if not existing_lpi:
        lpi_progress = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "chapter_id": "CH01",
            "lesson_completed": [],
            "quiz_score": None,
            "quiz_completed_at": None,
            "unlocked_at": datetime.now(timezone.utc).isoformat()
        }
        await db.lpi_progress.insert_one(lpi_progress)
    
    return {"message": "PPI submitted successfully", "next_step": "lpi"}

@api_router.get("/ppi/answers")
async def get_ppi_answers(user_id: str = Depends(get_current_user)):
    answers = await db.ppi_answers.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return {"answers": answers}

@api_router.post("/lpi/quiz/submit")
async def submit_quiz(quiz_data: QuizSubmit, user_id: str = Depends(get_current_user)):
    chapter_id = quiz_data.chapter_id
    
    answer_key = {
        "CH01_Q01": "B", "CH01_Q02": "B", "CH01_Q03": "C",
        "CH02_Q01": "B", "CH02_Q02": "B", "CH02_Q03": "B",
        "CH03_Q01": "B", "CH03_Q02": "C", "CH03_Q03": "B",
        "CH04_Q01": "B", "CH04_Q02": "B", "CH04_Q03": "C",
        "CH05_Q01": "A", "CH05_Q02": "B", "CH05_Q03": "B",
        "CH06_Q01": "B", "CH06_Q02": "B", "CH06_Q03": "B",
        "CH07_Q01": "B", "CH07_Q02": "B", "CH07_Q03": "B",
        "CH08_Q01": "B", "CH08_Q02": "B", "CH08_Q03": "C",
        "CH09_Q01": "B", "CH09_Q02": "B", "CH09_Q03": "C",
        "CH10_Q01": "B", "CH10_Q02": "C", "CH10_Q03": "C"
    }
    
    correct_count = 0
    total_questions = len(quiz_data.answers)
    
    for answer in quiz_data.answers:
        if answer_key.get(answer['question_id']) == answer['selected_option']:
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
\`\`\`

---

### File: `/app/backend/requirements.txt`
**Purpose:** Python dependencies

\`\`\`
annotated-types==0.7.0
anyio==4.8.0
bcrypt==4.2.1
certifi==2024.12.14
charset-normalizer==3.4.0
click==8.1.8
dnspython==2.7.0
fastapi==0.115.6
h11==0.14.0
httptools==0.6.4
idna==3.10
motor==3.6.0
pydantic==2.10.5
pydantic-core==2.27.2
PyJWT==2.10.1
pymongo==4.10.1
python-dotenv==1.0.1
PyYAML==6.0.2
requests==2.32.3
sniffio==1.3.1
starlette==0.41.3
typing-extensions==4.12.2
urllib3==2.2.3
uvicorn==0.34.0
uvloop==0.21.0
watchfiles==1.0.4
websockets==14.1
\`\`\`

---

## FRONTEND CODE

### File: `/app/frontend/src/App.js`
**Purpose:** Main React application with routing

\`\`\`javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import PPI from './pages/PPI';
import Dashboard from './pages/Dashboard';
import LPIChapter from './pages/LPIChapter';
import Settings from './pages/Settings';
import Completed from './pages/Completed';
import AdminPanel from './pages/AdminPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = \`\${BACKEND_URL}/api\`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(\`\${API}/auth/me\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-navy-900 to-navy-700">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <Welcome /> : <Navigate to="/dashboard" />} />
        <Route path="/admin" element={<AdminPanel onLogin={handleLogin} />} />
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={user ? <Onboarding user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/ppi" element={user ? <PPI token={token} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/chapter/:chapterId" element={user ? <LPIChapter token={token} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} token={token} /> : <Navigate to="/login" />} />
        <Route path="/completed" element={user ? <Completed token={token} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
\`\`\`

---

### File: `/app/frontend/package.json`
**Purpose:** Frontend dependencies and scripts

\`\`\`json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.7.9",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.1.1",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17"
  }
}
\`\`\`

---

**NOTE:** Due to length constraints, this is Part 1 of the export. 

**The complete export contains:**
- ✅ Backend server code (above)
- ✅ Backend dependencies (above)
- ✅ Frontend App.js (above)
- ✅ Frontend package.json (above)

**Still to include in Part 2:**
- All frontend page components (Welcome, Register, Login, PPI, Dashboard, LPIChapter, Settings, Completed, AdminPanel)
- Content data (PPI questions, LPI chapters)
- CSS files
- Configuration files

**This file has been saved to:** `/app/WEALTH_BUILDER_CODE_EXPORT_PART1.md`

**Would you like me to create Part 2 with all the frontend components and content data?**

---

**END OF PART 1**
