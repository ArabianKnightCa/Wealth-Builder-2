from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ========== Feature 1: Consistency Check Models ==========

class QuizOption(BaseModel):
    option_id: str
    text: str

class QuizQuestion(BaseModel):
    question_id: str
    question_text: str
    options: List[QuizOption]
    correct_answer: str  # should match one of the option_ids

class QuizContent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: str = "system"
    status: str = "draft"

class QuizContentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    questions: List[QuizQuestion]
    created_by: str = "system"

class ConsistencyError(BaseModel):
    type: str  # "missing_field", "mismatched_options", "invalid_answer_key", "structural_error"
    message: str
    question_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ConsistencyCheckResult(BaseModel):
    quiz_id: str
    is_valid: bool
    errors: List[ConsistencyError]
    warnings: List[ConsistencyError]
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ========== Feature 1: Consistency Check Logic ==========

def perform_consistency_check(quiz: QuizContent) -> ConsistencyCheckResult:
    """
    Performs comprehensive consistency checks on quiz content:
    1. Verifies JSON structure integrity
    2. Ensures answer key alignment
    3. Detects missing fields
    4. Detects mismatched options
    """
    errors = []
    warnings = []
    
    # Check if quiz has questions
    if not quiz.questions or len(quiz.questions) == 0:
        errors.append(ConsistencyError(
            type="missing_field",
            message="Quiz must contain at least one question",
            details={"field": "questions"}
        ))
    
    # Check each question
    for idx, question in enumerate(quiz.questions):
        q_num = idx + 1
        
        # Check question_id
        if not question.question_id or question.question_id.strip() == "":
            errors.append(ConsistencyError(
                type="missing_field",
                message=f"Question {q_num} is missing question_id",
                question_id=question.question_id,
                details={"question_number": q_num}
            ))
        
        # Check question_text
        if not question.question_text or question.question_text.strip() == "":
            errors.append(ConsistencyError(
                type="missing_field",
                message=f"Question {q_num} is missing question_text",
                question_id=question.question_id,
                details={"question_number": q_num}
            ))
        
        # Check options
        if not question.options or len(question.options) < 2:
            errors.append(ConsistencyError(
                type="mismatched_options",
                message=f"Question {q_num} must have at least 2 options",
                question_id=question.question_id,
                details={"question_number": q_num, "option_count": len(question.options) if question.options else 0}
            ))
        else:
            # Check each option
            option_ids = []
            for opt_idx, option in enumerate(question.options):
                if not option.option_id or option.option_id.strip() == "":
                    errors.append(ConsistencyError(
                        type="missing_field",
                        message=f"Question {q_num}, Option {opt_idx + 1} is missing option_id",
                        question_id=question.question_id,
                        details={"question_number": q_num, "option_number": opt_idx + 1}
                    ))
                else:
                    option_ids.append(option.option_id)
                
                if not option.text or option.text.strip() == "":
                    errors.append(ConsistencyError(
                        type="missing_field",
                        message=f"Question {q_num}, Option {opt_idx + 1} is missing text",
                        question_id=question.question_id,
                        details={"question_number": q_num, "option_number": opt_idx + 1}
                    ))
            
            # Check for duplicate option_ids
            if len(option_ids) != len(set(option_ids)):
                errors.append(ConsistencyError(
                    type="mismatched_options",
                    message=f"Question {q_num} has duplicate option_ids",
                    question_id=question.question_id,
                    details={"question_number": q_num}
                ))
            
            # Check correct_answer alignment
            if not question.correct_answer or question.correct_answer.strip() == "":
                errors.append(ConsistencyError(
                    type="invalid_answer_key",
                    message=f"Question {q_num} is missing correct_answer",
                    question_id=question.question_id,
                    details={"question_number": q_num}
                ))
            elif question.correct_answer not in option_ids:
                errors.append(ConsistencyError(
                    type="invalid_answer_key",
                    message=f"Question {q_num} has invalid correct_answer '{question.correct_answer}' - must match one of the option_ids",
                    question_id=question.question_id,
                    details={
                        "question_number": q_num,
                        "correct_answer": question.correct_answer,
                        "available_options": option_ids
                    }
                ))
    
    # Check for duplicate question_ids
    question_ids = [q.question_id for q in quiz.questions if q.question_id]
    if len(question_ids) != len(set(question_ids)):
        errors.append(ConsistencyError(
            type="structural_error",
            message="Quiz contains duplicate question_ids",
            details={"question_ids": question_ids}
        ))
    
    is_valid = len(errors) == 0
    
    return ConsistencyCheckResult(
        quiz_id=quiz.id,
        is_valid=is_valid,
        errors=errors,
        warnings=warnings
    )


# ========== Feature 1: API Endpoints ==========

@api_router.get("/")
async def root():
    return {"message": "Commercial Quiz Management System API"}

@api_router.post("/quizzes", response_model=QuizContent)
async def create_quiz(quiz_input: QuizContentCreate):
    """Create a new quiz"""
    quiz_dict = quiz_input.model_dump()
    quiz_obj = QuizContent(**quiz_dict)
    
    # Convert to dict and serialize datetime
    doc = quiz_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.quizzes.insert_one(doc)
    return quiz_obj

@api_router.get("/quizzes", response_model=List[QuizContent])
async def get_all_quizzes():
    """Get all quizzes"""
    quizzes = await db.quizzes.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for quiz in quizzes:
        if isinstance(quiz['created_at'], str):
            quiz['created_at'] = datetime.fromisoformat(quiz['created_at'])
    
    return quizzes

@api_router.get("/quizzes/{quiz_id}", response_model=QuizContent)
async def get_quiz(quiz_id: str):
    """Get a specific quiz by ID"""
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if isinstance(quiz['created_at'], str):
        quiz['created_at'] = datetime.fromisoformat(quiz['created_at'])
    
    return quiz

@api_router.post("/quizzes/{quiz_id}/check-consistency", response_model=ConsistencyCheckResult)
async def check_quiz_consistency(quiz_id: str):
    """
    Feature 1: Consistency Check
    Verifies JSON structure integrity, answer key alignment, missing fields, and mismatched options
    """
    # Fetch the quiz
    quiz_doc = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz_doc:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Convert to QuizContent object
    if isinstance(quiz_doc['created_at'], str):
        quiz_doc['created_at'] = datetime.fromisoformat(quiz_doc['created_at'])
    
    quiz = QuizContent(**quiz_doc)
    
    # Perform consistency check
    result = perform_consistency_check(quiz)
    
    # Save the check result to audit trail
    result_doc = result.model_dump()
    result_doc['checked_at'] = result_doc['checked_at'].isoformat()
    await db.consistency_checks.insert_one(result_doc)
    
    return result

@api_router.delete("/quizzes/{quiz_id}")
async def delete_quiz(quiz_id: str):
    """Delete a quiz"""
    result = await db.quizzes.delete_one({"id": quiz_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return {"message": "Quiz deleted successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()