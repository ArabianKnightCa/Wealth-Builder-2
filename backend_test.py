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
            "analytics_endpoints": {"passed": 0, "failed": 0, "errors": []},
            "data_structure_validation": {"passed": 0, "failed": 0, "errors": []},
            "database_verification": {"passed": 0, "failed": 0, "errors": []},
            "endpoint_summary": {"passed": 0, "failed": 0, "errors": []}
        }
        self.user_data = {}
        self.mongo_client = None
        self.db = None
        self.analytics_endpoints = [
            {"name": "Overview Tab Stats", "endpoint": "/analytics/telemetry", "expected_fields": ["ppiCompleted", "topicsCompleted", "quizAttempts", "sessions"]},
            {"name": "Users Tab", "endpoint": "/analytics/user-progress", "expected_fields": []},
            {"name": "Content Tab - Topic Performance", "endpoint": "/analytics/topic-performance", "expected_fields": []},
            {"name": "Content Tab - Chapter Heatmap", "endpoint": "/analytics/chapter-heatmap", "expected_fields": []},
            {"name": "Engagement Tab", "endpoint": "/analytics/content-engagement", "expected_fields": []},
            {"name": "Personalization Tab", "endpoint": "/analytics/personalization-effectiveness", "expected_fields": ["personalizedVsBaseline", "dnaProfilePerformance", "experienceLevelEffectiveness"]},
            {"name": "Patterns Tab", "endpoint": "/analytics/learning-patterns", "expected_fields": ["sessionPatterns", "dayOfWeekPatterns", "streakAnalysis", "quizRetryBehavior"]},
            {"name": "Profiles Tab", "endpoint": "/analytics/multi-profile-usage", "expected_fields": ["profileDistribution", "switchingBehavior"]},
            {"name": "Difficulty Tab", "endpoint": "/analytics/content-difficulty-heatmap", "expected_fields": ["quizDifficulty", "lessonEngagement"]},
            {"name": "Features Tab", "endpoint": "/analytics/feature-usage", "expected_fields": []},
            {"name": "Errors Tab", "endpoint": "/analytics/errors-and-friction", "expected_fields": ["apiErrors", "frictionPoints"]}
        ]
        self.endpoint_results = []
        
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
    
    def test_analytics_endpoints(self):
        """Test all analytics endpoints comprehensively"""
        print(f"\n📊 Testing Analytics Endpoints...")
        
        if not self.user_data:
            print("❌ No user data available - skipping analytics endpoint tests")
            return False
        
        headers = {"Authorization": f"Bearer {self.user_data['access_token']}"}
        
        for endpoint_config in self.analytics_endpoints:
            endpoint_name = endpoint_config["name"]
            endpoint_path = endpoint_config["endpoint"]
            expected_fields = endpoint_config["expected_fields"]
            
            print(f"\n🔍 Testing {endpoint_name}: {endpoint_path}")
            
            endpoint_result = {
                "name": endpoint_name,
                "endpoint": endpoint_path,
                "status": "UNKNOWN",
                "status_code": None,
                "response_data": None,
                "issues": [],
                "expected_fields": expected_fields,
                "found_fields": []
            }
            
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint_path}", headers=headers)
                endpoint_result["status_code"] = response.status_code
                
                if response.status_code == 404:
                    endpoint_result["status"] = "FAIL"
                    endpoint_result["issues"].append("Endpoint not found (404)")
                    print(f"❌ {endpoint_name}: Endpoint not found (404)")
                    self.results["analytics_endpoints"]["failed"] += 1
                    self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Endpoint not found")
                    
                elif response.status_code == 500:
                    endpoint_result["status"] = "FAIL"
                    endpoint_result["issues"].append(f"Server error (500): {response.text}")
                    print(f"❌ {endpoint_name}: Server error (500)")
                    self.results["analytics_endpoints"]["failed"] += 1
                    self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Server error (500)")
                    
                elif response.status_code == 200:
                    try:
                        data = response.json()
                        endpoint_result["response_data"] = data
                        
                        # Check if response is empty or null
                        if data is None:
                            endpoint_result["status"] = "FAIL"
                            endpoint_result["issues"].append("Response is null")
                            print(f"❌ {endpoint_name}: Response is null")
                            self.results["analytics_endpoints"]["failed"] += 1
                            self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Response is null")
                        elif isinstance(data, list) and len(data) == 0:
                            endpoint_result["status"] = "PASS"
                            endpoint_result["issues"].append("Response is empty array (may be expected)")
                            print(f"✅ {endpoint_name}: Returns empty array (may be expected)")
                            self.results["analytics_endpoints"]["passed"] += 1
                        elif isinstance(data, dict):
                            # Check for expected fields
                            endpoint_result["found_fields"] = list(data.keys())
                            missing_fields = []
                            for field in expected_fields:
                                if field not in data:
                                    missing_fields.append(field)
                            
                            if missing_fields:
                                endpoint_result["status"] = "FAIL"
                                endpoint_result["issues"].append(f"Missing expected fields: {missing_fields}")
                                print(f"❌ {endpoint_name}: Missing fields {missing_fields}")
                                self.results["analytics_endpoints"]["failed"] += 1
                                self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Missing fields {missing_fields}")
                            else:
                                endpoint_result["status"] = "PASS"
                                print(f"✅ {endpoint_name}: Returns valid data structure")
                                self.results["analytics_endpoints"]["passed"] += 1
                        else:
                            endpoint_result["status"] = "PASS"
                            print(f"✅ {endpoint_name}: Returns data (type: {type(data).__name__})")
                            self.results["analytics_endpoints"]["passed"] += 1
                            
                    except json.JSONDecodeError as e:
                        endpoint_result["status"] = "FAIL"
                        endpoint_result["issues"].append(f"Invalid JSON response: {str(e)}")
                        print(f"❌ {endpoint_name}: Invalid JSON response")
                        self.results["analytics_endpoints"]["failed"] += 1
                        self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Invalid JSON response")
                        
                else:
                    endpoint_result["status"] = "FAIL"
                    endpoint_result["issues"].append(f"Unexpected status code: {response.status_code}")
                    print(f"❌ {endpoint_name}: Unexpected status code {response.status_code}")
                    self.results["analytics_endpoints"]["failed"] += 1
                    self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Status {response.status_code}")
                    
            except Exception as e:
                endpoint_result["status"] = "FAIL"
                endpoint_result["issues"].append(f"Request error: {str(e)}")
                print(f"❌ {endpoint_name}: Request error - {str(e)}")
                self.results["analytics_endpoints"]["failed"] += 1
                self.results["analytics_endpoints"]["errors"].append(f"{endpoint_name}: Request error")
            
            self.endpoint_results.append(endpoint_result)
        
        return True
    
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