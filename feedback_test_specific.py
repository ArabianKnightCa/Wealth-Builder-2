#!/usr/bin/env python3
"""
SPECIFIC FEEDBACK SYSTEM TEST

Test the exact scenario described by the user:
1. Create/login a test user
2. Submit feedback using POST /api/feedback with body: {"context_page":"Dashboard","feedback_text":"This is a test feedback"}
3. Call GET /api/admin/feedback with the same user's token
4. Check if the submitted feedback appears in the response
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import time
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration
BACKEND_URL = "https://adaptive-engine.preview.emergentagent.com/api"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def main():
    print("🚀 Testing Specific Feedback System Issue")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Test user data
    test_user = {
        "email": f"feedback.test.{int(time.time())}@example.com",
        "password": "SecurePass123!",
        "first_name": "Feedback Test User",
        "date_of_birth": "1995-06-15",
        "experience_level": 3,
        "user_type": "POC",
        "life_stage": "AD",
        "occupation": "Professional / Manager",
        "state": "CA",
        "financial_goals": ["build_wealth"]
    }
    
    # Step 1: Register/Login user
    print(f"\n👤 Registering test user...")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/register", json=test_user)
        if response.status_code == 200:
            result = response.json()
            user_id = result["user"]["id"]
            access_token = result["access_token"]
            print(f"✅ User registered successfully")
            print(f"   User ID: {user_id}")
            print(f"   Email: {test_user['email']}")
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return 1
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return 1
    
    # Step 2: Submit feedback using the exact format specified
    print(f"\n📝 Submitting feedback with exact format...")
    feedback_data = {
        "context_page": "Dashboard",
        "feedback_text": "This is a test feedback"
    }
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/feedback", json=feedback_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Feedback submitted: {result['message']}")
        else:
            print(f"❌ Feedback submission failed: {response.status_code} - {response.text}")
            return 1
    except Exception as e:
        print(f"❌ Feedback submission error: {e}")
        return 1
    
    # Step 3: Retrieve feedback using admin endpoint
    print(f"\n📋 Retrieving feedback via admin endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/admin/feedback", headers=headers)
        if response.status_code == 200:
            result = response.json()
            feedback_list = result.get("feedback", [])
            feedback_count = result.get("count", 0)
            
            print(f"✅ Feedback retrieval successful")
            print(f"   📊 Total feedback entries: {feedback_count}")
            print(f"   📋 Feedback list length: {len(feedback_list)}")
            
            # Look for our specific feedback
            found_our_feedback = False
            for feedback in feedback_list:
                if feedback.get("user_id") == user_id:
                    found_our_feedback = True
                    print(f"   ✅ Found our feedback:")
                    print(f"      • User ID: {feedback.get('user_id')}")
                    print(f"      • Context: {feedback.get('context_page', 'N/A')}")
                    print(f"      • Text: {feedback.get('feedback_text', feedback.get('feedback', 'N/A'))}")
                    print(f"      • Submitted: {feedback.get('submitted_at', 'N/A')}")
                    break
            
            if not found_our_feedback:
                print(f"❌ Our feedback not found in admin view!")
                print(f"   Looking for user_id: {user_id}")
                print(f"   Available feedback user_ids: {[fb.get('user_id') for fb in feedback_list[:5]]}")
            
        else:
            print(f"❌ Feedback retrieval failed: {response.status_code} - {response.text}")
            return 1
    except Exception as e:
        print(f"❌ Feedback retrieval error: {e}")
        return 1
    
    # Step 4: Check database directly
    print(f"\n🔍 Checking database directly...")
    try:
        mongo_client = MongoClient(MONGO_URL)
        db = mongo_client[DB_NAME]
        
        # Query feedback collection
        all_feedback = list(db.feedback.find({}))
        user_feedback = list(db.feedback.find({"user_id": user_id}))
        
        print(f"✅ Database connection successful")
        print(f"   📊 Total feedback in DB: {len(all_feedback)}")
        print(f"   📋 Our user's feedback in DB: {len(user_feedback)}")
        
        if user_feedback:
            for fb in user_feedback:
                print(f"   ✅ Found in database:")
                print(f"      • ID: {fb.get('id', 'N/A')}")
                print(f"      • User ID: {fb.get('user_id')}")
                print(f"      • Context: {fb.get('context_page', 'N/A')}")
                print(f"      • Text: {fb.get('feedback_text', fb.get('feedback', 'N/A'))}")
                print(f"      • Submitted: {fb.get('submitted_at', 'N/A')}")
        else:
            print(f"❌ No feedback found in database for our user!")
        
        mongo_client.close()
        
    except Exception as e:
        print(f"❌ Database check error: {e}")
    
    # Step 5: Clean up
    print(f"\n🧹 Cleaning up test user...")
    try:
        response = requests.post(f"{BACKEND_URL}/auth/delete-account", json={"email": test_user["email"]})
        if response.status_code == 200:
            print(f"✅ Test user cleaned up")
        else:
            print(f"⚠️ Could not clean up test user: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")
    
    print(f"\n📋 SUMMARY:")
    print(f"   • User registration: ✅")
    print(f"   • Feedback submission: ✅")
    print(f"   • Admin feedback retrieval: {'✅' if found_our_feedback else '❌'}")
    print(f"   • Database verification: {'✅' if user_feedback else '❌'}")
    
    if found_our_feedback and user_feedback:
        print(f"\n🎉 Feedback system is working correctly!")
        return 0
    else:
        print(f"\n❌ Feedback system has issues - feedback not appearing in admin view!")
        return 1

if __name__ == "__main__":
    exit(main())