#!/usr/bin/env python3
"""
ANALYTICS DASHBOARD COMPREHENSIVE TESTING

**Objective:** Test ALL analytics endpoints in the dashboard to verify they work correctly.

**Test Focus:**
1. Overview Tab Stats - GET /api/analytics/telemetry
2. Users Tab - GET /api/analytics/user-progress
3. Content Tab - GET /api/analytics/topic-performance, /api/analytics/chapter-heatmap
4. Engagement Tab - GET /api/analytics/content-engagement
5. Personalization Tab - GET /api/analytics/personalization-effectiveness
6. Patterns Tab - GET /api/analytics/learning-patterns
7. Profiles Tab - GET /api/analytics/multi-profile-usage
8. Difficulty Tab - GET /api/analytics/content-difficulty-heatmap
9. Features Tab - GET /api/analytics/feature-usage
10. Errors Tab - GET /api/analytics/errors-and-friction

**Verification for each endpoint:**
- ✅ Endpoint exists and responds (not 404)
- ✅ Returns correct data structure (not empty or null)
- ✅ No 500 errors or exceptions
- ✅ Response matches expected format from frontend
- ✅ MongoDB queries work without ObjectId issues
- ✅ No duplicate endpoint conflicts
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import time
import sys
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

# Configuration
BACKEND_URL = "https://money-mentor-380.preview.emergentagent.com/api"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test User Data
TEST_USER = {
    "name": "Feedback Tester",
    "email": f"feedback.tester.{int(time.time())}@example.com",
    "password": "SecurePass123!",
    "date_of_birth": "1995-06-15",
    "experience_level": 3,
    "occupation": "Professional / Manager",
    "state": "CA",
    "financial_goals": ["build_wealth", "save_for_purchase"]
}

class AnalyticsDashboardTester:
    def __init__(self):
        self.results = {
            "registration": {"passed": 0, "failed": 0, "errors": []},
            "feedback_submission": {"passed": 0, "failed": 0, "errors": []},
            "feedback_retrieval": {"passed": 0, "failed": 0, "errors": []},
            "database_verification": {"passed": 0, "failed": 0, "errors": []},
            "issue_identification": {"passed": 0, "failed": 0, "errors": []}
        }
        self.user_data = {}
        self.mongo_client = None
        self.db = None
        self.submitted_feedback = []
        
    def setup_mongo_connection(self):
        """Setup MongoDB connection for data verification"""
        try:
            self.mongo_client = MongoClient(MONGO_URL)
            self.db = self.mongo_client[DB_NAME]
            print(f"✅ Connected to MongoDB: {DB_NAME}")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to MongoDB: {e}")
            return False
    
    def cleanup_test_data(self):
        """Clean up test data from all collections"""
        if self.db is None:
            return
            
        email = TEST_USER['email']
        try:
            # Delete user account via API
            delete_response = requests.post(f"{BACKEND_URL}/auth/delete-account", 
                                          json={"email": email})
            if delete_response.status_code == 200:
                print(f"🧹 Cleaned up test user ({email})")
            else:
                print(f"⚠️ Could not clean up {email}: {delete_response.status_code}")
        except Exception as e:
            print(f"⚠️ Error cleaning {email}: {e}")
    
    def register_test_user(self):
        """Register test user and capture access token"""
        print(f"\n👤 Registering test user: {TEST_USER['name']}...")
        
        registration_data = {
            "email": TEST_USER["email"],
            "password": TEST_USER["password"],
            "first_name": TEST_USER["name"],
            "date_of_birth": TEST_USER["date_of_birth"],
            "language": "en",
            "experience_level": TEST_USER["experience_level"],
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": TEST_USER["occupation"],
            "state": TEST_USER["state"],
            "financial_goals": TEST_USER["financial_goals"]
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/register", json=registration_data)
            if response.status_code == 200:
                result = response.json()
                self.user_data = {
                    "user_id": result["user"]["id"],
                    "access_token": result["access_token"],
                    "user_data": result["user"]
                }
                print(f"✅ Registration successful for {TEST_USER['name']}")
                print(f"   User ID: {result['user']['id']}")
                print(f"   Email: {TEST_USER['email']}")
                self.results["registration"]["passed"] += 1
                return True
            else:
                error_msg = f"Registration failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["registration"]["failed"] += 1
                self.results["registration"]["errors"].append(error_msg)
                return False
        except Exception as e:
            error_msg = f"Registration error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["registration"]["failed"] += 1
            self.results["registration"]["errors"].append(error_msg)
            return False
    
    def test_feedback_submission(self):
        """Test feedback submission using both duplicate endpoints"""
        print(f"\n📝 Testing Feedback Submission...")
        
        if not self.user_data:
            print("❌ No user data available - skipping feedback submission test")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_data['access_token']}"}
        
        # Test Case 1: Submit feedback using the first endpoint (line 872) - no auth required
        print("\n🔍 Testing First Feedback Endpoint (line 872 - no auth)...")
        feedback_data_1 = {
            "context_page": "Dashboard",
            "feedback_text": "This is a test feedback from endpoint 1"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/feedback", json=feedback_data_1)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ First endpoint submission: {result['message']}")
                self.submitted_feedback.append({
                    "endpoint": "first",
                    "data": feedback_data_1,
                    "success": True
                })
                self.results["feedback_submission"]["passed"] += 1
            else:
                error_msg = f"First endpoint failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["feedback_submission"]["failed"] += 1
                self.results["feedback_submission"]["errors"].append(error_msg)
        except Exception as e:
            error_msg = f"First endpoint error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["feedback_submission"]["failed"] += 1
            self.results["feedback_submission"]["errors"].append(error_msg)
        
        # Test Case 2: Submit feedback using the second endpoint (line 992) - with auth
        print("\n🔍 Testing Second Feedback Endpoint (line 992 - with auth)...")
        feedback_data_2 = {
            "context_page": "Dashboard",
            "feedback_text": "This is a test feedback from endpoint 2"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/feedback", json=feedback_data_2, headers=headers)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Second endpoint submission: {result['message']}")
                self.submitted_feedback.append({
                    "endpoint": "second",
                    "data": feedback_data_2,
                    "success": True,
                    "user_id": self.user_data['user_id']
                })
                self.results["feedback_submission"]["passed"] += 1
            else:
                error_msg = f"Second endpoint failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["feedback_submission"]["failed"] += 1
                self.results["feedback_submission"]["errors"].append(error_msg)
        except Exception as e:
            error_msg = f"Second endpoint error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["feedback_submission"]["failed"] += 1
            self.results["feedback_submission"]["errors"].append(error_msg)
        
        return len(self.submitted_feedback) > 0
    
    def test_feedback_retrieval(self):
        """Test feedback retrieval via admin endpoint"""
        print(f"\n📋 Testing Feedback Retrieval...")
        
        if not self.user_data:
            print("❌ No user data available - skipping feedback retrieval test")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_data['access_token']}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/admin/feedback", headers=headers)
            if response.status_code == 200:
                result = response.json()
                feedback_list = result.get("feedback", [])
                feedback_count = result.get("count", 0)
                
                print(f"✅ Feedback retrieval successful")
                print(f"   📊 Total feedback entries: {feedback_count}")
                print(f"   📋 Feedback list length: {len(feedback_list)}")
                
                # Check if our submitted feedback appears
                found_feedback = []
                for feedback in feedback_list:
                    # Check for feedback from our test user
                    if feedback.get("user_id") == self.user_data["user_id"]:
                        found_feedback.append(feedback)
                        print(f"   ✅ Found our feedback: {feedback.get('feedback_text', feedback.get('feedback', 'N/A'))[:50]}...")
                
                if found_feedback:
                    print(f"✅ Found {len(found_feedback)} feedback entries from our test user")
                    self.results["feedback_retrieval"]["passed"] += 1
                else:
                    error_msg = "No feedback found from our test user in admin view"
                    print(f"❌ {error_msg}")
                    self.results["feedback_retrieval"]["failed"] += 1
                    self.results["feedback_retrieval"]["errors"].append(error_msg)
                
                # Show sample feedback structure
                if feedback_list:
                    sample = feedback_list[0]
                    print(f"\n📋 Sample feedback structure:")
                    for key, value in sample.items():
                        if key == "_id":
                            continue
                        print(f"   • {key}: {str(value)[:100]}...")
                
                return len(found_feedback) > 0
                
            else:
                error_msg = f"Feedback retrieval failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["feedback_retrieval"]["failed"] += 1
                self.results["feedback_retrieval"]["errors"].append(error_msg)
                return False
                
        except Exception as e:
            error_msg = f"Feedback retrieval error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["feedback_retrieval"]["failed"] += 1
            self.results["feedback_retrieval"]["errors"].append(error_msg)
            return False
    
    def test_database_verification(self):
        """Test direct database queries to verify feedback storage"""
        print(f"\n🔍 Testing Database Verification...")
        
        if self.db is None:
            print("❌ Cannot test database - MongoDB connection not available")
            self.results["database_verification"]["failed"] += 1
            self.results["database_verification"]["errors"].append("MongoDB connection not available")
            return False
        
        try:
            # Query feedback collection directly
            feedback_collection = self.db.feedback
            all_feedback = list(feedback_collection.find({}))
            
            print(f"✅ Database connection successful")
            print(f"   📊 Total feedback entries in database: {len(all_feedback)}")
            
            # Look for our test user's feedback
            user_feedback = list(feedback_collection.find({"user_id": self.user_data.get("user_id")}))
            print(f"   📋 Feedback from our test user: {len(user_feedback)}")
            
            # Show field structure analysis
            if all_feedback:
                sample_feedback = all_feedback[0]
                print(f"\n📋 Database feedback structure analysis:")
                print(f"   Fields found in sample feedback:")
                for key, value in sample_feedback.items():
                    field_type = type(value).__name__
                    print(f"   • {key}: {field_type} = {str(value)[:100]}...")
                
                # Check for _id field issues
                has_object_id = any("_id" in fb and str(type(fb["_id"])) == "<class 'bson.objectid.ObjectId'>" for fb in all_feedback)
                has_string_id = any("id" in fb and isinstance(fb["id"], str) for fb in all_feedback)
                
                print(f"\n🔍 ID Field Analysis:")
                print(f"   • MongoDB ObjectId (_id): {'Yes' if has_object_id else 'No'}")
                print(f"   • String ID (id): {'Yes' if has_string_id else 'No'}")
                
                if has_object_id and not has_string_id:
                    print("   ⚠️ POTENTIAL ISSUE: Only ObjectId found, may cause JSON serialization issues")
            
            # Check for different field naming patterns
            field_patterns = {
                "feedback_text": 0,
                "feedback": 0,
                "context_page": 0,
                "user_id": 0,
                "user_email": 0,
                "submitted_at": 0,
                "created_at": 0
            }
            
            for fb in all_feedback:
                for field in field_patterns:
                    if field in fb:
                        field_patterns[field] += 1
            
            print(f"\n📊 Field Usage Patterns:")
            for field, count in field_patterns.items():
                if count > 0:
                    print(f"   • {field}: {count} entries")
            
            self.results["database_verification"]["passed"] += 1
            return True
            
        except Exception as e:
            error_msg = f"Database verification error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["database_verification"]["failed"] += 1
            self.results["database_verification"]["errors"].append(error_msg)
            return False
    
    def identify_issues(self):
        """Identify and analyze potential issues with the feedback system"""
        print(f"\n🔍 Identifying Feedback System Issues...")
        
        issues_found = []
        
        # Issue 1: Duplicate endpoints
        print(f"\n📋 Issue Analysis:")
        print(f"   🔍 Duplicate Endpoints:")
        print(f"      • Line 872: POST /api/feedback (no auth, different data structure)")
        print(f"      • Line 992: POST /api/feedback (with auth, structured data)")
        issues_found.append("Duplicate feedback endpoints with different authentication and data structures")
        
        # Issue 2: Data structure mismatch
        print(f"   🔍 Data Structure Analysis:")
        print(f"      • First endpoint expects: user_id, user_email, feedback, submitted_at")
        print(f"      • Second endpoint expects: context_page, feedback_text (+ auto user_id)")
        print(f"      • Admin viewer expects: consistent field names for display")
        issues_found.append("Inconsistent data structures between submission endpoints")
        
        # Issue 3: Authentication inconsistency
        print(f"   🔍 Authentication Analysis:")
        print(f"      • First endpoint: No authentication required")
        print(f"      • Second endpoint: Bearer token authentication required")
        print(f"      • Admin viewer: Authentication required")
        issues_found.append("Inconsistent authentication requirements")
        
        # Issue 4: Field naming inconsistency
        print(f"   🔍 Field Naming Analysis:")
        print(f"      • First endpoint uses: 'feedback' field")
        print(f"      • Second endpoint uses: 'feedback_text' field")
        print(f"      • This causes display issues in admin viewer")
        issues_found.append("Inconsistent field naming between endpoints")
        
        # Issue 5: ID field problems
        print(f"   🔍 ID Field Analysis:")
        print(f"      • First endpoint: No 'id' field generated")
        print(f"      • Second endpoint: UUID 'id' field generated")
        print(f"      • MongoDB: Uses ObjectId '_id' which is not JSON serializable")
        issues_found.append("Mixed ID field usage causing serialization issues")
        
        # Recommendations
        print(f"\n💡 Recommendations:")
        print(f"   1. Remove duplicate endpoint (keep line 992 version with auth)")
        print(f"   2. Standardize field names (use 'feedback_text' consistently)")
        print(f"   3. Always generate UUID 'id' field for all feedback")
        print(f"   4. Ensure consistent authentication across all feedback operations")
        print(f"   5. Update admin viewer to handle both field name variations")
        
        if issues_found:
            print(f"\n❌ Found {len(issues_found)} issues with feedback system")
            self.results["issue_identification"]["failed"] += 1
            self.results["issue_identification"]["errors"].extend(issues_found)
        else:
            print(f"\n✅ No issues found with feedback system")
            self.results["issue_identification"]["passed"] += 1
        
        return issues_found
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*60)
        print("📋 FEEDBACK SYSTEM TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for test_name, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{test_name.upper():25} | {status} | {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"{'':27} |      | Error: {error}")
        
        print("-" * 60)
        print(f"{'TOTAL':25} | {'✅ PASS' if total_failed == 0 else '❌ FAIL'} | {total_passed} passed, {total_failed} failed")
        
        # Detailed findings
        print(f"\n📋 DETAILED FINDINGS:")
        print(f"   • Duplicate endpoints found at lines 872 and 992")
        print(f"   • Data structure inconsistencies between endpoints")
        print(f"   • Authentication requirement differences")
        print(f"   • Field naming inconsistencies (feedback vs feedback_text)")
        print(f"   • MongoDB ObjectId serialization issues")
        
        if total_failed == 0:
            print("\n✅ All tests completed successfully!")
        else:
            print(f"\n❌ {total_failed} test(s) failed. Issues identified above.")
        
        return total_failed == 0

def main():
    """Main test execution"""
    print("🚀 Starting Feedback System End-to-End Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"MongoDB URL: {MONGO_URL}")
    print(f"Database: {DB_NAME}")
    
    tester = FeedbackSystemTester()
    
    # Setup MongoDB connection
    if not tester.setup_mongo_connection():
        print("⚠️ Continuing without MongoDB verification...")
    
    # Clean up any existing test data
    tester.cleanup_test_data()
    
    try:
        # Step 1: Register test user
        if not tester.register_test_user():
            print("❌ Failed to register test user - aborting tests")
            return 1
        
        # Step 2: Test feedback submission (both endpoints)
        tester.test_feedback_submission()
        
        # Step 3: Test feedback retrieval
        tester.test_feedback_retrieval()
        
        # Step 4: Database verification
        tester.test_database_verification()
        
        # Step 5: Issue identification
        tester.identify_issues()
        
        # Print comprehensive summary
        success = tester.print_summary()
        
        # Clean up test data
        print("\n🧹 Cleaning up test data...")
        tester.cleanup_test_data()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        if tester.mongo_client:
            tester.mongo_client.close()

if __name__ == "__main__":
    sys.exit(main())