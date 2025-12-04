"""
Multi-Profile System Models
Allows one account to have multiple learner profiles (e.g., family members)
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from uuid import uuid4


class Profile(BaseModel):
    """Individual learner profile within an account"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    account_id: str  # Links to the main user account
    name: str
    age: int
    avatar: str = "👤"  # Default avatar emoji
    is_primary: bool = False  # True for the account owner
    experience_level: int = Field(ge=1, le=5, default=1)
    financial_goals: List[str] = []
    ppi_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_active: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProfileCreate(BaseModel):
    """Request model for creating a new profile"""
    name: str
    age: int
    avatar: Optional[str] = "👤"
    experience_level: int = Field(ge=1, le=5, default=1)
    financial_goals: List[str] = []


class ProfileUpdate(BaseModel):
    """Request model for updating profile"""
    name: Optional[str] = None
    age: Optional[int] = None
    avatar: Optional[str] = None
    experience_level: Optional[int] = Field(None, ge=1, le=5)
    financial_goals: Optional[List[str]] = None


class ActiveProfileResponse(BaseModel):
    """Response when switching profiles"""
    profile: Profile
    message: str


# Avatar options for profile selection
AVATAR_OPTIONS = [
    "👦", "👧", "👨", "👩", "🧒", "👶",
    "🦁", "🐻", "🐼", "🐨", "🦊", "🐸",
    "⭐", "🌟", "💫", "🎯", "🎨", "📚"
]
