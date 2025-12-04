"""
Content Management Models
Pydantic models for chapters, lessons, and quiz questions in MongoDB
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import uuid4


class ChapterMetadata(BaseModel):
    """Metadata for chapters"""
    difficulty_level: Optional[int] = 1
    estimated_time_minutes: Optional[int] = 30
    tags: Optional[List[str]] = []
    prerequisites: Optional[List[str]] = []


class Chapter(BaseModel):
    """Chapter model for MongoDB"""
    id: str
    title: str
    order: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    metadata: Optional[ChapterMetadata] = ChapterMetadata()


class Lesson(BaseModel):
    """Lesson model for MongoDB"""
    id: str
    chapter_id: str
    title: str
    order: int
    text: str
    takeaway: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class QuizQuestionMetadata(BaseModel):
    """Metadata for quiz questions"""
    difficulty: Optional[str] = "medium"
    cognitive_level: Optional[str] = "understanding"
    estimated_time_seconds: Optional[int] = 60
    topic_tags: Optional[List[str]] = []


class QuizQuestion(BaseModel):
    """Quiz question model for MongoDB"""
    id: str
    chapter_id: str
    question_text: str
    options: Dict[str, str]  # {"A": "text", "B": "text", ...}
    correct_answer: str  # "A", "B", "C", or "D"
    rationale: str
    order: int
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = Field(default_factory=lambda: datetime.utcnow())
    metadata: Optional[QuizQuestionMetadata] = QuizQuestionMetadata()


# Response models for API
class ChapterWithLessons(BaseModel):
    """Chapter with embedded lessons"""
    chapter: Chapter
    lessons: List[Lesson]


class ChapterWithQuiz(BaseModel):
    """Chapter with quiz questions"""
    chapter: Chapter
    questions: List[QuizQuestion]


class ChapterComplete(BaseModel):
    """Complete chapter data - lessons and quiz"""
    chapter: Chapter
    lessons: List[Lesson]
    questions: List[QuizQuestion]
