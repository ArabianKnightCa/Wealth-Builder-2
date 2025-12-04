#!/usr/bin/env python3
"""
Content Migration Script
Migrates quiz content from content_data.py to MongoDB collections
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from content_data import LPI_CHAPTERS, LPI_ANSWER_KEY
from content_models import Chapter, Lesson, QuizQuestion, ChapterMetadata, QuizQuestionMetadata

# Load environment
load_dotenv(Path(__file__).parent / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]


async def migrate_content():
    """Main migration function"""
    print("="*80)
    print("📦 QUIZ CONTENT DATABASE MIGRATION")
    print("="*80)
    print(f"\nMigrating from content_data.py to MongoDB")
    print(f"Source: {len(LPI_CHAPTERS)} chapters")
    print(f"Database: {os.environ['DB_NAME']}")
    print()
    
    # Collections
    chapters_col = db.chapters
    lessons_col = db.lessons
    quiz_questions_col = db.quiz_questions
    
    # Clear existing data (for clean migration)
    print("🗑️  Clearing existing content...")
    await chapters_col.delete_many({})
    await lessons_col.delete_many({})
    await quiz_questions_col.delete_many({})
    print("   ✓ Collections cleared")
    print()
    
    # Create indexes
    print("📊 Creating indexes...")
    await chapters_col.create_index("id", unique=True)
    await chapters_col.create_index("order")
    await lessons_col.create_index("id", unique=True)
    await lessons_col.create_index("chapter_id")
    await lessons_col.create_index([("chapter_id", 1), ("order", 1)])
    await quiz_questions_col.create_index("id", unique=True)
    await quiz_questions_col.create_index("chapter_id")
    await quiz_questions_col.create_index([("chapter_id", 1), ("order", 1)])
    print("   ✓ Indexes created")
    print()
    
    # Migrate data
    print("🔄 Migrating content...")
    print()
    
    total_lessons = 0
    total_questions = 0
    
    for chapter_index, chapter_data in enumerate(LPI_CHAPTERS, 1):
        chapter_id = chapter_data['id']
        print(f"  [{chapter_index}/{len(LPI_CHAPTERS)}] {chapter_id}: {chapter_data['title']}")
        
        # Create chapter document
        chapter = Chapter(
            id=chapter_id,
            title=chapter_data['title'],
            order=chapter_index,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            metadata=ChapterMetadata(
                difficulty_level=1,
                estimated_time_minutes=30,
                tags=["basics"] if chapter_index <= 3 else ["intermediate"]
            )
        )
        
        await chapters_col.insert_one(chapter.model_dump())
        
        # Migrate lessons
        lessons = chapter_data.get('lessons', [])
        for lesson_index, lesson_data in enumerate(lessons, 1):
            lesson = Lesson(
                id=f"{chapter_id}_L{lesson_index:02d}",
                chapter_id=chapter_id,
                title=lesson_data['title'],
                order=lesson_index,
                text=lesson_data['text'],
                takeaway=lesson_data['takeaway'],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            await lessons_col.insert_one(lesson.model_dump())
            total_lessons += 1
        
        print(f"      ✓ {len(lessons)} lessons migrated")
        
        # Migrate quiz questions
        quiz = chapter_data.get('quiz', [])
        for quiz_index, quiz_item in enumerate(quiz, 1):
            # Get correct answer from answer key
            correct_answer = LPI_ANSWER_KEY.get(quiz_item['id'], quiz_item.get('correct', 'A'))
            
            question = QuizQuestion(
                id=quiz_item['id'],
                chapter_id=chapter_id,
                question_text=quiz_item['text'],
                options=quiz_item['options'],
                correct_answer=correct_answer,
                rationale=quiz_item.get('rationale', 'No rationale provided'),
                order=quiz_index,
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
                metadata=QuizQuestionMetadata(
                    difficulty="medium",
                    cognitive_level="understanding",
                    estimated_time_seconds=60
                )
            )
            await quiz_questions_col.insert_one(question.model_dump())
            total_questions += 1
        
        print(f"      ✓ {len(quiz)} quiz questions migrated")
        print()
    
    print("="*80)
    print("✅ MIGRATION COMPLETE")
    print("="*80)
    print(f"📚 Chapters:        {len(LPI_CHAPTERS)}")
    print(f"📖 Lessons:         {total_lessons}")
    print(f"❓ Quiz Questions:  {total_questions}")
    print()
    print("Content is now in MongoDB and ready for CMS features!")
    print()


async def verify_migration():
    """Verify migration was successful"""
    print("🔍 Verifying migration...")
    print()
    
    chapters_count = await db.chapters.count_documents({})
    lessons_count = await db.lessons.count_documents({})
    questions_count = await db.quiz_questions.count_documents({})
    
    print(f"   Chapters in DB:   {chapters_count}")
    print(f"   Lessons in DB:    {lessons_count}")
    print(f"   Questions in DB:  {questions_count}")
    print()
    
    # Sample query
    sample_chapter = await db.chapters.find_one({"id": "CH01"}, {"_id": 0})
    if sample_chapter:
        print("   Sample chapter CH01:")
        print(f"      Title: {sample_chapter['title']}")
        
        lessons = await db.lessons.find({"chapter_id": "CH01"}, {"_id": 0}).to_list(100)
        print(f"      Lessons: {len(lessons)}")
        
        questions = await db.quiz_questions.find({"chapter_id": "CH01"}, {"_id": 0}).to_list(100)
        print(f"      Quiz Questions: {len(questions)}")
    print()
    print("✅ Verification complete")


if __name__ == "__main__":
    print("\n🚀 Starting content migration to MongoDB...\n")
    asyncio.run(migrate_content())
    asyncio.run(verify_migration())
    print("\n✨ All done!\n")
