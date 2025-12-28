from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64
import hashlib

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class PINSetup(BaseModel):
    pin: str = Field(..., min_length=4, max_length=6)

class PINVerify(BaseModel):
    pin: str

class ThemeUpdate(BaseModel):
    theme: str

class FamilyCreate(BaseModel):
    family_name: str
    family_photo: Optional[str] = None
    family_notes: Optional[str] = ""

class FamilyUpdate(BaseModel):
    family_name: Optional[str] = None
    family_photo: Optional[str] = None
    family_notes: Optional[str] = None
    archived: Optional[bool] = None

class ChildIdentity(BaseModel):
    full_name: str
    nicknames: Optional[List[str]] = []
    profile_photo: Optional[str] = None
    photo_gallery: Optional[List[str]] = []
    birthday: Optional[str] = None
    place_of_birth: Optional[str] = None
    languages: Optional[List[str]] = []
    pronouns: Optional[str] = None
    relationship_notes: Optional[str] = None

class ChildSchool(BaseModel):
    grade: Optional[str] = None
    school_name: Optional[str] = None
    favorite_teachers: Optional[List[str]] = []
    favorite_subject: Optional[str] = None
    least_favorite_subject: Optional[str] = None
    best_school_memory: Optional[str] = None
    school_activities: Optional[List[str]] = []
    learning_style: Optional[str] = None
    learning_supports: Optional[str] = None
    learning_challenges: Optional[str] = None

class ChildFavorites(BaseModel):
    favorite_food: Optional[str] = None
    least_favorite_food: Optional[str] = None
    favorite_snack: Optional[str] = None
    favorite_drink: Optional[str] = None
    favorite_food_to_cook: Optional[str] = None
    favorite_restaurant: Optional[str] = None
    favorite_show: Optional[str] = None
    favorite_movie: Optional[str] = None
    favorite_character: Optional[str] = None
    favorite_book: Optional[str] = None
    favorite_game: Optional[str] = None
    best_song: Optional[str] = None
    favorite_artist: Optional[str] = None
    music_category: Optional[str] = None
    dance_style: Optional[str] = None
    favorite_color: Optional[str] = None
    favorite_colors_to_wear: Optional[List[str]] = []
    favorite_brands: Optional[List[str]] = []
    personal_style: Optional[str] = None
    favorite_animal: Optional[str] = None
    favorite_sport: Optional[str] = None
    favorite_team: Optional[str] = None

class ChildPersonality(BaseModel):
    likes: Optional[List[str]] = []
    dislikes: Optional[List[str]] = []
    strengths: Optional[List[str]] = []
    special_skills: Optional[List[str]] = []
    known_for: Optional[str] = None
    social_style: Optional[str] = None
    phobias: Optional[List[str]] = []
    primary_love_language: Optional[str] = None
    secondary_love_language: Optional[str] = None

class ChildCreate(BaseModel):
    family_id: str
    identity: ChildIdentity
    school: Optional[ChildSchool] = None
    favorites: Optional[ChildFavorites] = None
    personality: Optional[ChildPersonality] = None

class ChildUpdate(BaseModel):
    identity: Optional[ChildIdentity] = None
    school: Optional[ChildSchool] = None
    favorites: Optional[ChildFavorites] = None
    personality: Optional[ChildPersonality] = None

class TimelineEventCreate(BaseModel):
    child_id: str
    title: str
    description: Optional[str] = None
    event_date: str
    event_type: str  # milestone, memory, achievement, photo
    photo: Optional[str] = None
    tags: Optional[List[str]] = []

class TimelineEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[str] = None
    event_type: Optional[str] = None
    photo: Optional[str] = None
    tags: Optional[List[str]] = None

# ============== AUTH ROUTES ==============

@api_router.get("/auth/check")
async def check_pin_exists():
    """Check if a PIN has been set up"""
    settings = await db.settings.find_one({"type": "auth"}, {"_id": 0})
    return {"pin_exists": settings is not None and "pin_hash" in settings}

@api_router.post("/auth/setup")
async def setup_pin(data: PINSetup):
    """Set up initial PIN"""
    existing = await db.settings.find_one({"type": "auth"})
    if existing:
        raise HTTPException(status_code=400, detail="PIN already set up")
    
    pin_hash = hashlib.sha256(data.pin.encode()).hexdigest()
    await db.settings.insert_one({
        "type": "auth",
        "pin_hash": pin_hash,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"success": True, "message": "PIN created successfully"}

@api_router.post("/auth/verify")
async def verify_pin(data: PINVerify):
    """Verify PIN"""
    settings = await db.settings.find_one({"type": "auth"}, {"_id": 0})
    if not settings:
        raise HTTPException(status_code=400, detail="No PIN set up")
    
    pin_hash = hashlib.sha256(data.pin.encode()).hexdigest()
    if pin_hash != settings.get("pin_hash"):
        raise HTTPException(status_code=401, detail="Invalid PIN")
    
    return {"success": True, "message": "PIN verified"}

@api_router.post("/auth/change-pin")
async def change_pin(data: dict):
    """Change PIN (requires old PIN)"""
    old_pin = data.get("old_pin")
    new_pin = data.get("new_pin")
    
    if not old_pin or not new_pin:
        raise HTTPException(status_code=400, detail="Both old and new PIN required")
    
    settings = await db.settings.find_one({"type": "auth"})
    if not settings:
        raise HTTPException(status_code=400, detail="No PIN set up")
    
    old_hash = hashlib.sha256(old_pin.encode()).hexdigest()
    if old_hash != settings.get("pin_hash"):
        raise HTTPException(status_code=401, detail="Invalid current PIN")
    
    new_hash = hashlib.sha256(new_pin.encode()).hexdigest()
    await db.settings.update_one(
        {"type": "auth"},
        {"$set": {"pin_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "PIN changed successfully"}

# ============== THEME ROUTES ==============

@api_router.get("/settings/theme")
async def get_theme():
    """Get current theme"""
    settings = await db.settings.find_one({"type": "theme"}, {"_id": 0})
    return {"theme": settings.get("theme", "theme_1_classic_warmth") if settings else "theme_1_classic_warmth"}

@api_router.post("/settings/theme")
async def set_theme(data: ThemeUpdate):
    """Set theme preference"""
    await db.settings.update_one(
        {"type": "theme"},
        {"$set": {"theme": data.theme, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"success": True, "theme": data.theme}

@api_router.get("/settings/onboarding")
async def get_onboarding_status():
    """Check if user has completed onboarding"""
    settings = await db.settings.find_one({"type": "onboarding"}, {"_id": 0})
    return {"completed": settings.get("completed", False) if settings else False}

@api_router.post("/settings/onboarding")
async def set_onboarding_status(data: dict):
    """Set onboarding completion status"""
    await db.settings.update_one(
        {"type": "onboarding"},
        {"$set": {"completed": data.get("completed", True), "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"success": True, "completed": data.get("completed", True)}

# ============== UI LAYOUT ROUTES ==============

@api_router.get("/settings/ui")
async def get_ui_settings():
    """Get UI layout and color theme settings"""
    settings = await db.settings.find_one({"type": "ui"}, {"_id": 0})
    return {
        "layout": settings.get("layout", "warm_scrapbook") if settings else "warm_scrapbook",
        "colorTheme": settings.get("colorTheme", "warm_cream") if settings else "warm_cream"
    }

@api_router.post("/settings/ui")
async def set_ui_settings(data: dict):
    """Set UI layout and color theme"""
    await db.settings.update_one(
        {"type": "ui"},
        {"$set": {
            "layout": data.get("layout", "warm_scrapbook"),
            "colorTheme": data.get("colorTheme", "warm_cream"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    return {"success": True}

# ============== ACCOUNT ROUTES ==============

@api_router.delete("/account")
async def delete_account():
    """Delete all user data"""
    # Delete all collections
    await db.families.delete_many({})
    await db.children.delete_many({})
    await db.timeline_events.delete_many({})
    await db.settings.delete_many({})
    return {"success": True, "message": "All data deleted"}

# ============== EXPORT ROUTES ==============

@api_router.get("/export/{format}")
async def export_data(format: str):
    """Export all data in specified format"""
    import json
    
    # Gather all data
    families = await db.families.find({}, {"_id": 0}).to_list(1000)
    children = await db.children.find({}, {"_id": 0}).to_list(1000)
    timeline_events = await db.timeline_events.find({}, {"_id": 0}).to_list(5000)
    
    data = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "families": families,
        "children": children,
        "timeline_events": timeline_events
    }
    
    if format == "json":
        from fastapi.responses import Response
        return Response(
            content=json.dumps(data, indent=2, default=str),
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=ourcircle-export.json"}
        )
    elif format == "csv":
        # Simple CSV export of families and children
        import csv
        import io
        
        output = io.StringIO()
        
        # Families
        output.write("=== FAMILIES ===\n")
        if families:
            writer = csv.DictWriter(output, fieldnames=["id", "family_name", "family_notes", "archived", "created_at"])
            writer.writeheader()
            for f in families:
                writer.writerow({k: f.get(k, "") for k in ["id", "family_name", "family_notes", "archived", "created_at"]})
        
        output.write("\n=== CHILDREN ===\n")
        if children:
            writer = csv.DictWriter(output, fieldnames=["id", "family_id", "full_name", "birthday", "created_at"])
            writer.writeheader()
            for c in children:
                writer.writerow({
                    "id": c.get("id", ""),
                    "family_id": c.get("family_id", ""),
                    "full_name": c.get("identity", {}).get("full_name", ""),
                    "birthday": c.get("identity", {}).get("birthday", ""),
                    "created_at": c.get("created_at", "")
                })
        
        from fastapi.responses import Response
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=ourcircle-export.csv"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

# ============== FAMILY ROUTES ==============

@api_router.get("/families")
async def get_families(include_archived: bool = False):
    """Get all families"""
    query = {} if include_archived else {"archived": {"$ne": True}}
    families = await db.families.find(query, {"_id": 0}).to_list(100)
    
    # Get child count for each family
    for family in families:
        child_count = await db.children.count_documents({"family_id": family["id"]})
        family["number_of_children"] = child_count
    
    return {"families": families}

@api_router.get("/families/{family_id}")
async def get_family(family_id: str):
    """Get single family"""
    family = await db.families.find_one({"id": family_id}, {"_id": 0})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    child_count = await db.children.count_documents({"family_id": family_id})
    family["number_of_children"] = child_count
    return family

@api_router.post("/families")
async def create_family(data: FamilyCreate):
    """Create a new family"""
    family_id = str(uuid.uuid4())
    family_doc = {
        "id": family_id,
        "family_name": data.family_name,
        "family_photo": data.family_photo,
        "family_notes": data.family_notes,
        "archived": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.families.insert_one(family_doc)
    del family_doc["_id"]
    family_doc["number_of_children"] = 0
    return family_doc

@api_router.put("/families/{family_id}")
async def update_family(family_id: str, data: FamilyUpdate):
    """Update a family"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.families.update_one({"id": family_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Family not found")
    
    return await get_family(family_id)

@api_router.delete("/families/{family_id}")
async def delete_family(family_id: str):
    """Delete a family and all its children"""
    result = await db.families.delete_one({"id": family_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Family not found")
    
    # Delete all children and their timeline events
    children = await db.children.find({"family_id": family_id}, {"id": 1}).to_list(100)
    for child in children:
        await db.timeline_events.delete_many({"child_id": child["id"]})
    await db.children.delete_many({"family_id": family_id})
    
    return {"success": True, "message": "Family deleted"}

# ============== CHILDREN ROUTES ==============

@api_router.get("/families/{family_id}/children")
async def get_children(family_id: str):
    """Get all children in a family"""
    children = await db.children.find({"family_id": family_id}, {"_id": 0}).to_list(100)
    return {"children": children}

@api_router.get("/children/{child_id}")
async def get_child(child_id: str):
    """Get single child"""
    child = await db.children.find_one({"id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

@api_router.post("/children")
async def create_child(data: ChildCreate):
    """Create a new child"""
    # Verify family exists
    family = await db.families.find_one({"id": data.family_id})
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    child_id = str(uuid.uuid4())
    child_doc = {
        "id": child_id,
        "family_id": data.family_id,
        "identity": data.identity.model_dump(),
        "school": data.school.model_dump() if data.school else {},
        "favorites": data.favorites.model_dump() if data.favorites else {},
        "personality": data.personality.model_dump() if data.personality else {},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.children.insert_one(child_doc)
    del child_doc["_id"]
    return child_doc

@api_router.put("/children/{child_id}")
async def update_child(child_id: str, data: ChildUpdate):
    """Update a child"""
    child = await db.children.find_one({"id": child_id})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    update_data = {}
    if data.identity:
        update_data["identity"] = data.identity.model_dump()
    if data.school:
        update_data["school"] = data.school.model_dump()
    if data.favorites:
        update_data["favorites"] = data.favorites.model_dump()
    if data.personality:
        update_data["personality"] = data.personality.model_dump()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.children.update_one({"id": child_id}, {"$set": update_data})
    return await get_child(child_id)

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str):
    """Delete a child and their timeline events"""
    result = await db.children.delete_one({"id": child_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    
    await db.timeline_events.delete_many({"child_id": child_id})
    return {"success": True, "message": "Child deleted"}

# ============== TIMELINE ROUTES ==============

@api_router.get("/children/{child_id}/timeline")
async def get_timeline(child_id: str):
    """Get timeline events for a child"""
    events = await db.timeline_events.find(
        {"child_id": child_id}, 
        {"_id": 0}
    ).sort("event_date", -1).to_list(500)
    return {"events": events}

@api_router.post("/timeline")
async def create_timeline_event(data: TimelineEventCreate):
    """Create a timeline event"""
    # Verify child exists
    child = await db.children.find_one({"id": data.child_id})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    event_id = str(uuid.uuid4())
    event_doc = {
        "id": event_id,
        "child_id": data.child_id,
        "title": data.title,
        "description": data.description,
        "event_date": data.event_date,
        "event_type": data.event_type,
        "photo": data.photo,
        "tags": data.tags,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.timeline_events.insert_one(event_doc)
    del event_doc["_id"]
    return event_doc

@api_router.put("/timeline/{event_id}")
async def update_timeline_event(event_id: str, data: TimelineEventUpdate):
    """Update a timeline event"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.timeline_events.update_one({"id": event_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event = await db.timeline_events.find_one({"id": event_id}, {"_id": 0})
    return event

@api_router.delete("/timeline/{event_id}")
async def delete_timeline_event(event_id: str):
    """Delete a timeline event"""
    result = await db.timeline_events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"success": True, "message": "Event deleted"}

# ============== UTILITY ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "OurCircle API", "version": "1.0.0"}

# Include router
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
