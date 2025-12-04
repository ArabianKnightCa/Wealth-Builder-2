# Quiz Content Database Migration Plan

## Current State
- All quiz content hardcoded in `/app/backend/content_data.py`
- Static Python arrays: `LPI_CHAPTERS` with nested quiz data
- Answers in separate dict: `LPI_ANSWER_KEY`

## Target State - MongoDB Collections

### Collection 1: `chapters`
```json
{
  "id": "CH01",
  "title": "Money Basics: Understanding What Money Is",
  "order": 1,
  "is_active": true,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime",
  "metadata": {
    "difficulty_level": 1,
    "estimated_time_minutes": 30,
    "tags": ["basics", "foundations"]
  }
}
```

### Collection 2: `lessons`
```json
{
  "id": "CH01_L01",
  "chapter_id": "CH01",
  "title": "What Is Money, Really?",
  "order": 1,
  "text": "Lesson content here...",
  "takeaway": "Key takeaway message",
  "is_active": true,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime"
}
```

### Collection 3: `quiz_questions`
```json
{
  "id": "CH01_Q01",
  "chapter_id": "CH01",
  "question_text": "Why does money work better than bartering?",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text"
  },
  "correct_answer": "C",
  "rationale": "Explanation of correct answer",
  "order": 1,
  "is_active": true,
  "created_at": "ISO datetime",
  "updated_at": "ISO datetime",
  "metadata": {
    "difficulty": "medium",
    "cognitive_level": "understanding",
    "estimated_time_seconds": 60
  }
}
```

## Migration Strategy

### Phase 1: Create Collections & Schema
1. Define Pydantic models for validation
2. Create MongoDB collections with indexes
3. Add migration script to populate from `content_data.py`

### Phase 2: Create Content API Endpoints
1. GET `/api/content/chapters` - List all chapters
2. GET `/api/content/chapters/{id}` - Get chapter with lessons
3. GET `/api/content/chapters/{id}/quiz` - Get quiz questions
4. POST `/api/admin/content/*` - CRUD operations for admins

### Phase 3: Update Existing Code
1. Modify `/api/content/lpi` endpoint to use DB
2. Update content transformer to work with DB data
3. Keep backward compatibility during transition

### Phase 4: Content Management API (Future)
- Versioning system
- Draft/Published workflow
- A/B testing support
- Content audit trail

## Benefits
✅ Content editable without code deployments
✅ Support for thousands of chapters
✅ Enable CMS features (versioning, workflow)
✅ Easy bulk operations
✅ Better separation of concerns
✅ Scalable architecture

## Implementation Order
1. Create MongoDB schema (models + collections)
2. Write migration script
3. Execute migration (populate DB from current content_data.py)
4. Create new API endpoints
5. Update existing endpoints to use DB
6. Test thoroughly
7. Mark content_data.py as deprecated (keep for backup)
