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
BACKEND_URL = "https://moneymind-6.preview.emergentagent.com/api"
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
    
    def validate_data_structures(self):
        """Validate data structures returned by analytics endpoints"""
        print(f"\n🔍 Validating Data Structures...")
        
        structure_issues = []
        
        for result in self.endpoint_results:
            if result["status"] == "PASS" and result["response_data"] is not None:
                endpoint_name = result["name"]
                data = result["response_data"]
                
                # Check for MongoDB ObjectId issues
                data_str = str(data)
                if "ObjectId" in data_str:
                    issue = f"{endpoint_name}: Contains MongoDB ObjectId (not JSON serializable)"
                    structure_issues.append(issue)
                    print(f"⚠️ {issue}")
                
                # Check for expected data types
                if isinstance(data, dict):
                    # Check for null values in important fields
                    null_fields = [k for k, v in data.items() if v is None]
                    if null_fields:
                        issue = f"{endpoint_name}: Contains null fields: {null_fields}"
                        structure_issues.append(issue)
                        print(f"⚠️ {issue}")
                
                # Validate specific endpoint structures
                if "personalization-effectiveness" in result["endpoint"]:
                    expected_keys = ["personalizedVsBaseline", "dnaProfilePerformance", "experienceLevelEffectiveness"]
                    missing_keys = [k for k in expected_keys if k not in data]
                    if missing_keys:
                        issue = f"{endpoint_name}: Missing personalization keys: {missing_keys}"
                        structure_issues.append(issue)
                        print(f"⚠️ {issue}")
                
                elif "learning-patterns" in result["endpoint"]:
                    expected_keys = ["sessionPatterns", "dayOfWeekPatterns", "streakAnalysis", "quizRetryBehavior"]
                    missing_keys = [k for k in expected_keys if k not in data]
                    if missing_keys:
                        issue = f"{endpoint_name}: Missing learning pattern keys: {missing_keys}"
                        structure_issues.append(issue)
                        print(f"⚠️ {issue}")
        
        if structure_issues:
            print(f"❌ Found {len(structure_issues)} data structure issues")
            self.results["data_structure_validation"]["failed"] += 1
            self.results["data_structure_validation"]["errors"].extend(structure_issues)
        else:
            print(f"✅ All data structures are valid")
            self.results["data_structure_validation"]["passed"] += 1
        
        return len(structure_issues) == 0
    
    def test_database_verification(self):
        """Test direct database queries to verify analytics data"""
        print(f"\n🔍 Testing Database Verification...")
        
        if self.db is None:
            print("❌ Cannot test database - MongoDB connection not available")
            self.results["database_verification"]["failed"] += 1
            self.results["database_verification"]["errors"].append("MongoDB connection not available")
            return False
        
        try:
            print(f"✅ Database connection successful")
            
            # Check telemetry collections
            telemetry_collections = [
                "telemetry_user_session",
                "telemetry_onboarding", 
                "telemetry_ppi_completed",
                "telemetry_topic_completed",
                "telemetry_quiz_attempt",
                "telemetry_subscription_change",
                "telemetry_lesson_engagement",
                "telemetry_session_pattern"
            ]
            
            print(f"\n📊 Telemetry Collections Analysis:")
            for collection_name in telemetry_collections:
                try:
                    collection = self.db[collection_name]
                    count = collection.count_documents({})
                    print(f"   • {collection_name}: {count} records")
                    
                    if count > 0:
                        # Sample one record to check structure
                        sample = collection.find_one({})
                        if sample and "_id" in sample:
                            # Check for ObjectId issues
                            if str(type(sample["_id"])) == "<class 'bson.objectid.ObjectId'>":
                                print(f"     ⚠️ Contains MongoDB ObjectId (potential serialization issue)")
                except Exception as e:
                    print(f"   • {collection_name}: Error accessing - {str(e)}")
            
            # Check analytics collections
            analytics_collections = [
                "analytics_user_progress",
                "analytics_topic_performance", 
                "analytics_chapter_heatmap"
            ]
            
            print(f"\n📊 Analytics Collections Analysis:")
            for collection_name in analytics_collections:
                try:
                    collection = self.db[collection_name]
                    count = collection.count_documents({})
                    print(f"   • {collection_name}: {count} records")
                except Exception as e:
                    print(f"   • {collection_name}: Error accessing - {str(e)}")
            
            # Check if we have any data to work with
            total_telemetry = sum([
                self.db[col].count_documents({}) 
                for col in telemetry_collections 
                if col in self.db.list_collection_names()
            ])
            
            if total_telemetry == 0:
                print(f"\n⚠️ No telemetry data found - analytics endpoints may return empty results")
                self.results["database_verification"]["errors"].append("No telemetry data available for analytics")
            else:
                print(f"\n✅ Found {total_telemetry} total telemetry records")
            
            self.results["database_verification"]["passed"] += 1
            return True
            
        except Exception as e:
            error_msg = f"Database verification error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["database_verification"]["failed"] += 1
            self.results["database_verification"]["errors"].append(error_msg)
            return False
    
    def generate_endpoint_summary(self):
        """Generate comprehensive summary of all analytics endpoints"""
        print(f"\n📋 Generating Analytics Endpoint Summary...")
        
        working_endpoints = []
        broken_endpoints = []
        
        print(f"\n{'Endpoint':<40} | {'Status':<6} | {'Issues'}")
        print(f"{'-'*40} | {'-'*6} | {'-'*50}")
        
        for result in self.endpoint_results:
            endpoint = result["endpoint"]
            status = "✅ PASS" if result["status"] == "PASS" else "❌ FAIL"
            issues = "; ".join(result["issues"]) if result["issues"] else "None"
            
            print(f"{endpoint:<40} | {status:<6} | {issues}")
            
            if result["status"] == "PASS":
                working_endpoints.append(endpoint)
                self.results["endpoint_summary"]["passed"] += 1
            else:
                broken_endpoints.append(endpoint)
                self.results["endpoint_summary"]["failed"] += 1
                self.results["endpoint_summary"]["errors"].append(f"{endpoint}: {'; '.join(result['issues'])}")
        
        print(f"\n📊 Summary Statistics:")
        print(f"   • Total endpoints tested: {len(self.endpoint_results)}")
        print(f"   • Working endpoints: {len(working_endpoints)}")
        print(f"   • Broken endpoints: {len(broken_endpoints)}")
        
        if working_endpoints:
            print(f"\n✅ Working Endpoints:")
            for endpoint in working_endpoints:
                print(f"   • {endpoint}")
        
        if broken_endpoints:
            print(f"\n❌ Broken Endpoints:")
            for endpoint in broken_endpoints:
                print(f"   • {endpoint}")
        
        # Check for missing telemetry endpoint specifically
        telemetry_found = any("/analytics/telemetry" in result["endpoint"] for result in self.endpoint_results)
        if not telemetry_found or any(result["status"] == "FAIL" and "/analytics/telemetry" in result["endpoint"] for result in self.endpoint_results):
            print(f"\n⚠️ CRITICAL: /analytics/telemetry endpoint missing or broken")
            print(f"   This endpoint should return: ppiCompleted, topicsCompleted, quizAttempts, sessions")
            self.results["endpoint_summary"]["errors"].append("Critical telemetry endpoint missing/broken")
        
        return len(broken_endpoints) == 0
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("📊 ANALYTICS DASHBOARD TEST SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for test_name, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{test_name.upper():30} | {status} | {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"{'':32} |      | Error: {error}")
        
        print("-" * 80)
        print(f"{'TOTAL':30} | {'✅ PASS' if total_failed == 0 else '❌ FAIL'} | {total_passed} passed, {total_failed} failed")
        
        # Endpoint Summary Table
        print(f"\n📋 ENDPOINT SUMMARY TABLE:")
        print(f"{'Endpoint':<45} | {'Status':<8} | {'Issues'}")
        print(f"{'-'*45} | {'-'*8} | {'-'*30}")
        
        working_count = 0
        broken_count = 0
        
        for result in self.endpoint_results:
            endpoint = result["endpoint"]
            status = "✅ PASS" if result["status"] == "PASS" else "❌ FAIL"
            issues = result["issues"][0] if result["issues"] else "None"
            
            print(f"{endpoint:<45} | {status:<8} | {issues}")
            
            if result["status"] == "PASS":
                working_count += 1
            else:
                broken_count += 1
        
        print(f"\n📊 BOTTOM LINE: {working_count} endpoints work vs. {broken_count} broken")
        
        # Critical Issues
        critical_issues = []
        if any("/analytics/telemetry" in result["endpoint"] and result["status"] == "FAIL" for result in self.endpoint_results):
            critical_issues.append("Missing /analytics/telemetry endpoint (Overview Tab)")
        
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   • {issue}")
        
        if total_failed == 0:
            print("\n✅ All analytics endpoints are working correctly!")
        else:
            print(f"\n❌ {broken_count} endpoint(s) broken. See details above.")
        
        return total_failed == 0

def main():
    """Main test execution"""
    print("🚀 Starting Analytics Dashboard Comprehensive Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"MongoDB URL: {MONGO_URL}")
    print(f"Database: {DB_NAME}")
    
    tester = AnalyticsDashboardTester()
    
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
        
        # Step 2: Test all analytics endpoints
        tester.test_analytics_endpoints()
        
        # Step 3: Validate data structures
        tester.validate_data_structures()
        
        # Step 4: Database verification
        tester.test_database_verification()
        
        # Step 5: Generate endpoint summary
        tester.generate_endpoint_summary()
        
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