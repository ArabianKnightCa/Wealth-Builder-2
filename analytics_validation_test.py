#!/usr/bin/env python3
"""
Analytics Data Integrity Validation
Validates that analytics collections have no orphan records, missing foreign keys, or double-counted events
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

async def validate_analytics_integrity():
    """Validate analytics data integrity"""
    print("🔍 Starting Analytics Data Integrity Validation\n")
    
    # Connect to MongoDB
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    validation_results = {
        "passed": [],
        "warnings": [],
        "errors": []
    }
    
    # Test 1: Check for orphan user IDs in analytics
    print("1. Checking for orphan user IDs in analytics...")
    analytics_users = await db.analytics_user_progress.distinct("userId")
    telemetry_users = await db.telemetry_quiz_attempt.distinct("userId")
    
    orphan_users = set(analytics_users) - set(telemetry_users)
    if orphan_users:
        validation_results["errors"].append(f"Found {len(orphan_users)} orphan user IDs in analytics: {orphan_users}")
        print(f"   ❌ Found {len(orphan_users)} orphan users")
    else:
        validation_results["passed"].append("No orphan user IDs found")
        print("   ✅ No orphan user IDs")
    
    # Test 2: Check for orphan topic IDs
    print("\n2. Checking for orphan topic IDs in analytics...")
    analytics_topics = await db.analytics_topic_performance.distinct("topicId")
    telemetry_topics = await db.telemetry_quiz_attempt.distinct("topicId")
    
    orphan_topics = set(analytics_topics) - set(telemetry_topics)
    if orphan_topics:
        validation_results["errors"].append(f"Found {len(orphan_topics)} orphan topic IDs: {orphan_topics}")
        print(f"   ❌ Found {len(orphan_topics)} orphan topics")
    else:
        validation_results["passed"].append("No orphan topic IDs found")
        print("   ✅ No orphan topic IDs")
    
    # Test 3: Check for orphan chapter IDs
    print("\n3. Checking for orphan chapter IDs in analytics...")
    analytics_chapters = await db.analytics_chapter_heatmap.distinct("chapterId")
    telemetry_chapters = await db.telemetry_quiz_attempt.distinct("chapterId")
    
    orphan_chapters = set(analytics_chapters) - set(telemetry_chapters)
    if orphan_chapters:
        validation_results["errors"].append(f"Found {len(orphan_chapters)} orphan chapter IDs: {orphan_chapters}")
        print(f"   ❌ Found {len(orphan_chapters)} orphan chapters")
    else:
        validation_results["passed"].append("No orphan chapter IDs found")
        print("   ✅ No orphan chapter IDs")
    
    # Test 4: Verify user progress counts match telemetry
    print("\n4. Verifying user progress counts match telemetry...")
    for user_id in analytics_users:
        # Get analytics count
        analytics_record = await db.analytics_user_progress.find_one({"userId": user_id})
        analytics_topic_count = analytics_record.get("totalTopicsCompleted", 0)
        
        # Get actual telemetry count
        telemetry_count = await db.telemetry_topic_completed.count_documents({"userId": user_id})
        
        if analytics_topic_count != telemetry_count:
            validation_results["errors"].append(
                f"User {user_id} topic count mismatch: analytics={analytics_topic_count}, telemetry={telemetry_count}"
            )
            print(f"   ❌ User {user_id}: mismatch (analytics={analytics_topic_count}, telemetry={telemetry_count})")
        else:
            print(f"   ✅ User {user_id}: counts match ({telemetry_count})")
    
    # Test 5: Verify topic performance metrics
    print("\n5. Verifying topic performance metrics...")
    for topic_id in analytics_topics:
        analytics_record = await db.analytics_topic_performance.find_one({"topicId": topic_id})
        
        # Get actual telemetry counts
        quiz_attempts = await db.telemetry_quiz_attempt.find({"topicId": topic_id}).to_list(1000)
        actual_attempts = len(quiz_attempts)
        actual_completions = len([q for q in quiz_attempts if q.get("score", 0) >= 50])
        
        analytics_attempts = analytics_record.get("attempts", 0)
        analytics_completions = analytics_record.get("completions", 0)
        
        if analytics_attempts != actual_attempts:
            validation_results["errors"].append(
                f"Topic {topic_id} attempt count mismatch: analytics={analytics_attempts}, actual={actual_attempts}"
            )
            print(f"   ❌ Topic {topic_id}: attempt mismatch")
        elif analytics_completions != actual_completions:
            validation_results["errors"].append(
                f"Topic {topic_id} completion count mismatch: analytics={analytics_completions}, actual={actual_completions}"
            )
            print(f"   ❌ Topic {topic_id}: completion mismatch")
        else:
            print(f"   ✅ Topic {topic_id}: metrics match")
    
    # Test 6: Check for duplicate analytics records
    print("\n6. Checking for duplicate analytics records...")
    
    # User progress duplicates
    user_progress_count = await db.analytics_user_progress.count_documents({})
    unique_users = len(await db.analytics_user_progress.distinct("userId"))
    if user_progress_count != unique_users:
        validation_results["errors"].append(f"Duplicate user progress records: {user_progress_count} records, {unique_users} unique users")
        print(f"   ❌ User progress: {user_progress_count - unique_users} duplicates")
    else:
        print("   ✅ User progress: no duplicates")
    
    # Topic performance duplicates
    topic_perf_count = await db.analytics_topic_performance.count_documents({})
    unique_topics = len(await db.analytics_topic_performance.distinct("topicId"))
    if topic_perf_count != unique_topics:
        validation_results["warnings"].append(f"Multiple topic performance records: {topic_perf_count} records, {unique_topics} unique topics (may be intentional)")
        print(f"   ⚠️ Topic performance: {topic_perf_count - unique_topics} duplicates")
    else:
        print("   ✅ Topic performance: no duplicates")
    
    # Chapter heatmap duplicates
    chapter_count = await db.analytics_chapter_heatmap.count_documents({})
    unique_chapters = len(await db.analytics_chapter_heatmap.distinct("chapterId"))
    if chapter_count != unique_chapters:
        validation_results["errors"].append(f"Duplicate chapter heatmap records: {chapter_count} records, {unique_chapters} unique chapters")
        print(f"   ❌ Chapter heatmap: {chapter_count - unique_chapters} duplicates")
    else:
        print("   ✅ Chapter heatmap: no duplicates")
    
    # Test 7: Check for missing required fields
    print("\n7. Checking for missing required fields...")
    
    # Check user progress
    user_progress_docs = await db.analytics_user_progress.find({}).to_list(1000)
    required_user_fields = ["userId", "totalTopicsCompleted", "userTier", "isInFamilyTier"]
    
    for doc in user_progress_docs:
        missing_fields = [f for f in required_user_fields if f not in doc or doc[f] is None]
        if missing_fields:
            validation_results["errors"].append(f"User progress {doc.get('id')} missing fields: {missing_fields}")
            print(f"   ❌ User progress record missing: {missing_fields}")
    
    if not any("User progress" in e for e in validation_results["errors"]):
        print("   ✅ All user progress records have required fields")
    
    # Check topic performance
    topic_perf_docs = await db.analytics_topic_performance.find({}).to_list(1000)
    required_topic_fields = ["topicId", "chapterId", "attempts", "completions", "failCount"]
    
    for doc in topic_perf_docs:
        missing_fields = [f for f in required_topic_fields if f not in doc or doc[f] is None]
        if missing_fields:
            validation_results["errors"].append(f"Topic performance {doc.get('id')} missing fields: {missing_fields}")
            print(f"   ❌ Topic performance record missing: {missing_fields}")
    
    if not any("Topic performance" in e for e in validation_results["errors"]):
        print("   ✅ All topic performance records have required fields")
    
    # Test 8: Validate data types and ranges
    print("\n8. Validating data types and ranges...")
    
    for doc in user_progress_docs:
        # Check numeric fields are non-negative
        if doc.get("totalTopicsCompleted", 0) < 0:
            validation_results["errors"].append(f"User {doc.get('userId')} has negative topic count")
        if doc.get("quizAvgScore") and (doc["quizAvgScore"] < 0 or doc["quizAvgScore"] > 100):
            validation_results["errors"].append(f"User {doc.get('userId')} has invalid avg score: {doc['quizAvgScore']}")
    
    for doc in topic_perf_docs:
        # Check completions <= attempts
        if doc.get("completions", 0) > doc.get("attempts", 0):
            validation_results["errors"].append(
                f"Topic {doc.get('topicId')} has more completions ({doc['completions']}) than attempts ({doc['attempts']})"
            )
            print(f"   ❌ Topic {doc.get('topicId')}: invalid completion/attempt ratio")
    
    if not validation_results["errors"] or not any("invalid" in e for e in validation_results["errors"]):
        print("   ✅ All data types and ranges are valid")
    
    # Summary
    print("\n" + "="*60)
    print("📊 VALIDATION SUMMARY")
    print("="*60)
    print(f"✅ Passed: {len(validation_results['passed'])}")
    print(f"⚠️  Warnings: {len(validation_results['warnings'])}")
    print(f"❌ Errors: {len(validation_results['errors'])}")
    
    if validation_results["errors"]:
        print("\n❌ ERRORS:")
        for error in validation_results["errors"]:
            print(f"  - {error}")
    
    if validation_results["warnings"]:
        print("\n⚠️  WARNINGS:")
        for warning in validation_results["warnings"]:
            print(f"  - {warning}")
    
    if not validation_results["errors"]:
        print("\n✅ ALL VALIDATION CHECKS PASSED")
    else:
        print("\n❌ VALIDATION FAILED - Please review errors above")
    
    client.close()
    return len(validation_results["errors"]) == 0

if __name__ == "__main__":
    import sys
    try:
        success = asyncio.run(validate_analytics_integrity())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Validation script error: {e}")
        sys.exit(1)
