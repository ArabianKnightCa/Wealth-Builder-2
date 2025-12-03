#!/usr/bin/env python3
"""
Comprehensive Telemetry System Testing
Tests all 6 telemetry endpoints with various scenarios and data integrity checks
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
BACKEND_URL = "https://wealth-builder-db.preview.emergentagent.com/api"
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test data
TEST_USER_ID = f"test-user-{uuid.uuid4()}"
TEST_SESSION_ID = f"session-{uuid.uuid4()}"
TEST_HOUSEHOLD_ID = f"household-{uuid.uuid4()}"

class TelemetryTester:
    def __init__(self):
        self.results = {
            "session": {"passed": 0, "failed": 0, "errors": []},
            "onboarding": {"passed": 0, "failed": 0, "errors": []},
            "ppi_completed": {"passed": 0, "failed": 0, "errors": []},
            "topic_completed": {"passed": 0, "failed": 0, "errors": []},
            "quiz_attempt": {"passed": 0, "failed": 0, "errors": []},
            "subscription_change": {"passed": 0, "failed": 0, "errors": []}
        }
        self.mongo_client = None
        self.db = None
        
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
        """Clean up test data from all telemetry collections"""
        if self.db is None:
            return
            
        collections = [
            'telemetry_user_session',
            'telemetry_onboarding', 
            'telemetry_ppi_completed',
            'telemetry_topic_completed',
            'telemetry_quiz_attempt',
            'telemetry_subscription_change'
        ]
        
        for coll_name in collections:
            try:
                result = self.db[coll_name].delete_many({"userId": TEST_USER_ID})
                print(f"🧹 Cleaned {result.deleted_count} records from {coll_name}")
            except Exception as e:
                print(f"⚠️ Error cleaning {coll_name}: {e}")
    
    def verify_data_in_mongo(self, collection_name, expected_count=None, filters=None):
        """Verify data was stored correctly in MongoDB"""
        if self.db is None:
            return False
            
        try:
            query = {"userId": TEST_USER_ID}
            if filters:
                query.update(filters)
                
            count = self.db[collection_name].count_documents(query)
            
            if expected_count is not None:
                if count == expected_count:
                    print(f"✅ {collection_name}: Found expected {count} records")
                    return True
                else:
                    print(f"❌ {collection_name}: Expected {expected_count} records, found {count}")
                    return False
            else:
                print(f"ℹ️ {collection_name}: Found {count} records")
                return count > 0
                
        except Exception as e:
            print(f"❌ Error verifying {collection_name}: {e}")
            return False
    
    def test_session_telemetry(self):
        """Test session telemetry endpoint"""
        print("\n🔍 Testing Session Telemetry...")
        
        # Test Case 1: Session with start and end
        test_data = {
            "userId": TEST_USER_ID,
            "sessionId": TEST_SESSION_ID,
            "sessionStart": datetime.now(timezone.utc).isoformat(),
            "sessionEnd": datetime.now(timezone.utc).isoformat(),
            "deviceType": "desktop",
            "userTier": "premium",
            "appVersion": "1.0.0"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/telemetry/session", json=test_data)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Session with end time: {result['message']}")
                self.results["session"]["passed"] += 1
            else:
                print(f"❌ Session with end time failed: {response.status_code} - {response.text}")
                self.results["session"]["failed"] += 1
                self.results["session"]["errors"].append(f"Status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Session with end time error: {e}")
            self.results["session"]["failed"] += 1
            self.results["session"]["errors"].append(str(e))
        
        # Test Case 2: Session with only start (end is null)
        test_data_no_end = {
            "userId": TEST_USER_ID,
            "sessionId": f"session-{uuid.uuid4()}",
            "sessionStart": datetime.now(timezone.utc).isoformat(),
            "deviceType": "mobile",
            "userTier": "free"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/telemetry/session", json=test_data_no_end)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Session without end time: {result['message']}")
                self.results["session"]["passed"] += 1
            else:
                print(f"❌ Session without end time failed: {response.status_code} - {response.text}")
                self.results["session"]["failed"] += 1
                self.results["session"]["errors"].append(f"Status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ Session without end time error: {e}")
            self.results["session"]["failed"] += 1
            self.results["session"]["errors"].append(str(e))
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_user_session', expected_count=2)
    
    def test_onboarding_telemetry(self):
        """Test onboarding telemetry endpoint"""
        print("\n🔍 Testing Onboarding Telemetry...")
        
        onboarding_steps = [
            {"stepName": "welcome", "completed": True},
            {"stepName": "profile_setup", "completed": True},
            {"stepName": "preferences", "completed": False},
            {"stepName": "tutorial", "completed": True}
        ]
        
        for i, step in enumerate(onboarding_steps):
            test_data = {
                "userId": TEST_USER_ID,
                "stepName": step["stepName"],
                "completed": step["completed"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "userTier": "premium"
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/telemetry/onboarding", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Onboarding step {step['stepName']}: {result['message']}")
                    self.results["onboarding"]["passed"] += 1
                else:
                    print(f"❌ Onboarding step {step['stepName']} failed: {response.status_code} - {response.text}")
                    self.results["onboarding"]["failed"] += 1
                    self.results["onboarding"]["errors"].append(f"Step {step['stepName']}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Onboarding step {step['stepName']} error: {e}")
                self.results["onboarding"]["failed"] += 1
                self.results["onboarding"]["errors"].append(f"Step {step['stepName']}: {str(e)}")
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_onboarding', expected_count=4)
    
    def test_ppi_completed_telemetry(self):
        """Test PPI completion telemetry endpoint"""
        print("\n🔍 Testing PPI Completion Telemetry...")
        
        # Test Case 1: PPI with category summary
        test_data_with_summary = {
            "userId": TEST_USER_ID,
            "ppiVersion": "v2.1",
            "ppiCategorySummary": {
                "risk_tolerance": "moderate",
                "investment_experience": "intermediate",
                "time_horizon": "long_term",
                "financial_goals": ["retirement", "education"]
            },
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "userTier": "premium"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/telemetry/ppi-completed", json=test_data_with_summary)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ PPI with category summary: {result['message']}")
                self.results["ppi_completed"]["passed"] += 1
            else:
                print(f"❌ PPI with category summary failed: {response.status_code} - {response.text}")
                self.results["ppi_completed"]["failed"] += 1
                self.results["ppi_completed"]["errors"].append(f"With summary: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ PPI with category summary error: {e}")
            self.results["ppi_completed"]["failed"] += 1
            self.results["ppi_completed"]["errors"].append(f"With summary: {str(e)}")
        
        # Test Case 2: PPI without category summary
        test_data_no_summary = {
            "userId": TEST_USER_ID,
            "ppiVersion": "v2.0",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "userTier": "free"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/telemetry/ppi-completed", json=test_data_no_summary)
            if response.status_code == 200:
                result = response.json()
                print(f"✅ PPI without category summary: {result['message']}")
                self.results["ppi_completed"]["passed"] += 1
            else:
                print(f"❌ PPI without category summary failed: {response.status_code} - {response.text}")
                self.results["ppi_completed"]["failed"] += 1
                self.results["ppi_completed"]["errors"].append(f"Without summary: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"❌ PPI without category summary error: {e}")
            self.results["ppi_completed"]["failed"] += 1
            self.results["ppi_completed"]["errors"].append(f"Without summary: {str(e)}")
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_ppi_completed', expected_count=2)
    
    def test_topic_completed_telemetry(self):
        """Test topic completion telemetry endpoint"""
        print("\n🔍 Testing Topic Completion Telemetry...")
        
        test_scenarios = [
            {
                "topicId": "budgeting_basics",
                "chapterId": "CH01",
                "difficultyTier": 1,
                "timeSpentSeconds": 300,
                "accuracy": 85.5,
                "retries": 0,
                "householdId": TEST_HOUSEHOLD_ID
            },
            {
                "topicId": "investment_fundamentals", 
                "chapterId": "CH02",
                "difficultyTier": 2,
                "timeSpentSeconds": 450,
                "accuracy": 92.0,
                "retries": 1,
                "householdId": None
            },
            {
                "topicId": "advanced_portfolio",
                "chapterId": "CH03", 
                "difficultyTier": 3,
                "timeSpentSeconds": 600,
                "accuracy": 78.3,
                "retries": 3,
                "householdId": TEST_HOUSEHOLD_ID
            }
        ]
        
        for i, scenario in enumerate(test_scenarios):
            test_data = {
                "userId": TEST_USER_ID,
                "topicId": scenario["topicId"],
                "chapterId": scenario["chapterId"],
                "difficultyTier": scenario["difficultyTier"],
                "timeSpentSeconds": scenario["timeSpentSeconds"],
                "accuracy": scenario["accuracy"],
                "retries": scenario["retries"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "userTier": "premium",
                "householdId": scenario["householdId"]
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/telemetry/topic-completed", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Topic {scenario['topicId']}: {result['message']}")
                    self.results["topic_completed"]["passed"] += 1
                else:
                    print(f"❌ Topic {scenario['topicId']} failed: {response.status_code} - {response.text}")
                    self.results["topic_completed"]["failed"] += 1
                    self.results["topic_completed"]["errors"].append(f"Topic {scenario['topicId']}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Topic {scenario['topicId']} error: {e}")
                self.results["topic_completed"]["failed"] += 1
                self.results["topic_completed"]["errors"].append(f"Topic {scenario['topicId']}: {str(e)}")
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_topic_completed', expected_count=3)
    
    def test_quiz_attempt_telemetry(self):
        """Test quiz attempt telemetry endpoint"""
        print("\n🔍 Testing Quiz Attempt Telemetry...")
        
        test_scenarios = [
            {
                "quizId": "quiz_budgeting_01",
                "topicId": "budgeting_basics",
                "chapterId": "CH01",
                "score": 8.5,
                "maxScore": 10.0,
                "accuracy": 85.0,
                "timeSpentSeconds": 180,
                "householdId": TEST_HOUSEHOLD_ID
            },
            {
                "quizId": "quiz_investment_02",
                "topicId": "investment_fundamentals",
                "chapterId": "CH02", 
                "score": 4.2,
                "maxScore": 10.0,
                "accuracy": 42.0,
                "timeSpentSeconds": 240,
                "householdId": None
            },
            {
                "quizId": "quiz_portfolio_03",
                "topicId": "advanced_portfolio",
                "chapterId": "CH03",
                "score": 9.8,
                "maxScore": 10.0,
                "accuracy": 98.0,
                "timeSpentSeconds": 120,
                "householdId": TEST_HOUSEHOLD_ID
            }
        ]
        
        for i, scenario in enumerate(test_scenarios):
            test_data = {
                "userId": TEST_USER_ID,
                "quizId": scenario["quizId"],
                "topicId": scenario["topicId"],
                "chapterId": scenario["chapterId"],
                "score": scenario["score"],
                "maxScore": scenario["maxScore"],
                "accuracy": scenario["accuracy"],
                "timeSpentSeconds": scenario["timeSpentSeconds"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "userTier": "premium",
                "householdId": scenario["householdId"]
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/telemetry/quiz-attempt", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Quiz {scenario['quizId']}: {result['message']}")
                    self.results["quiz_attempt"]["passed"] += 1
                else:
                    print(f"❌ Quiz {scenario['quizId']} failed: {response.status_code} - {response.text}")
                    self.results["quiz_attempt"]["failed"] += 1
                    self.results["quiz_attempt"]["errors"].append(f"Quiz {scenario['quizId']}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Quiz {scenario['quizId']} error: {e}")
                self.results["quiz_attempt"]["failed"] += 1
                self.results["quiz_attempt"]["errors"].append(f"Quiz {scenario['quizId']}: {str(e)}")
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_quiz_attempt', expected_count=3)
    
    def test_subscription_change_telemetry(self):
        """Test subscription change telemetry endpoint"""
        print("\n🔍 Testing Subscription Change Telemetry...")
        
        test_scenarios = [
            {
                "fromTier": None,  # Initial subscription
                "toTier": "free",
                "householdId": None,
                "householdSize": None
            },
            {
                "fromTier": "free",
                "toTier": "premium",
                "householdId": TEST_HOUSEHOLD_ID,
                "householdSize": 4
            },
            {
                "fromTier": "premium",
                "toTier": "family_premium",
                "householdId": TEST_HOUSEHOLD_ID,
                "householdSize": 6
            },
            {
                "fromTier": "family_premium",
                "toTier": "free",  # Downgrade
                "householdId": TEST_HOUSEHOLD_ID,
                "householdSize": 2
            }
        ]
        
        for i, scenario in enumerate(test_scenarios):
            test_data = {
                "userId": TEST_USER_ID,
                "fromTier": scenario["fromTier"],
                "toTier": scenario["toTier"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "householdId": scenario["householdId"],
                "householdSize": scenario["householdSize"]
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/telemetry/subscription-change", json=test_data)
                if response.status_code == 200:
                    result = response.json()
                    change_type = "Initial" if scenario["fromTier"] is None else f"{scenario['fromTier']} → {scenario['toTier']}"
                    print(f"✅ Subscription change ({change_type}): {result['message']}")
                    self.results["subscription_change"]["passed"] += 1
                else:
                    print(f"❌ Subscription change failed: {response.status_code} - {response.text}")
                    self.results["subscription_change"]["failed"] += 1
                    self.results["subscription_change"]["errors"].append(f"Change {i+1}: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"❌ Subscription change error: {e}")
                self.results["subscription_change"]["failed"] += 1
                self.results["subscription_change"]["errors"].append(f"Change {i+1}: {str(e)}")
        
        # Verify data in MongoDB
        self.verify_data_in_mongo('telemetry_subscription_change', expected_count=4)
    
    def test_data_integrity(self):
        """Test data integrity across all collections"""
        print("\n🔍 Testing Data Integrity...")
        
        if not self.db:
            print("❌ Cannot test data integrity - MongoDB connection not available")
            return
        
        collections = [
            'telemetry_user_session',
            'telemetry_onboarding', 
            'telemetry_ppi_completed',
            'telemetry_topic_completed',
            'telemetry_quiz_attempt',
            'telemetry_subscription_change'
        ]
        
        total_records = 0
        integrity_issues = []
        
        for coll_name in collections:
            try:
                records = list(self.db[coll_name].find({"userId": TEST_USER_ID}))
                total_records += len(records)
                
                for record in records:
                    # Check required fields
                    if 'userId' not in record or record['userId'] != TEST_USER_ID:
                        integrity_issues.append(f"{coll_name}: Missing or incorrect userId")
                    
                    if 'id' not in record:
                        integrity_issues.append(f"{coll_name}: Missing id field")
                    
                    # Check timestamp fields
                    timestamp_fields = ['timestamp', 'sessionStart']
                    for field in timestamp_fields:
                        if field in record:
                            try:
                                # Verify it's a valid ISO format timestamp
                                if isinstance(record[field], str):
                                    datetime.fromisoformat(record[field].replace('Z', '+00:00'))
                            except ValueError:
                                integrity_issues.append(f"{coll_name}: Invalid timestamp format in {field}")
                    
                    # Check numeric fields
                    if coll_name == 'telemetry_topic_completed':
                        numeric_fields = ['difficultyTier', 'timeSpentSeconds', 'accuracy', 'retries']
                        for field in numeric_fields:
                            if field in record and not isinstance(record[field], (int, float)):
                                integrity_issues.append(f"{coll_name}: {field} should be numeric")
                    
                    if coll_name == 'telemetry_quiz_attempt':
                        numeric_fields = ['score', 'maxScore', 'accuracy', 'timeSpentSeconds']
                        for field in numeric_fields:
                            if field in record and not isinstance(record[field], (int, float)):
                                integrity_issues.append(f"{coll_name}: {field} should be numeric")
                
                print(f"✅ {coll_name}: {len(records)} records verified")
                
            except Exception as e:
                integrity_issues.append(f"{coll_name}: Error during integrity check - {e}")
        
        print(f"\n📊 Data Integrity Summary:")
        print(f"   Total records checked: {total_records}")
        print(f"   Integrity issues found: {len(integrity_issues)}")
        
        if integrity_issues:
            print("\n❌ Integrity Issues:")
            for issue in integrity_issues:
                print(f"   • {issue}")
        else:
            print("✅ All data integrity checks passed!")
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*60)
        print("📋 TELEMETRY SYSTEM TEST SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        
        for endpoint, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{endpoint.upper():20} | {status} | {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"]:
                    print(f"                     |      | Error: {error}")
        
        print("-" * 60)
        print(f"{'TOTAL':20} | {'✅ PASS' if total_failed == 0 else '❌ FAIL'} | {total_passed} passed, {total_failed} failed")
        
        if total_failed == 0:
            print("\n🎉 All telemetry endpoints are working correctly!")
        else:
            print(f"\n⚠️ {total_failed} test(s) failed. Please review the errors above.")
        
        return total_failed == 0

def main():
    """Main test execution"""
    print("🚀 Starting Telemetry System End-to-End Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test User ID: {TEST_USER_ID}")
    
    tester = TelemetryTester()
    
    # Setup MongoDB connection
    if not tester.setup_mongo_connection():
        print("⚠️ Continuing without MongoDB verification...")
    
    # Clean up any existing test data
    tester.cleanup_test_data()
    
    try:
        # Run all telemetry tests
        tester.test_session_telemetry()
        tester.test_onboarding_telemetry()
        tester.test_ppi_completed_telemetry()
        tester.test_topic_completed_telemetry()
        tester.test_quiz_attempt_telemetry()
        tester.test_subscription_change_telemetry()
        
        # Test data integrity
        tester.test_data_integrity()
        
        # Print summary
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
        return 1
    finally:
        if tester.mongo_client:
            tester.mongo_client.close()

if __name__ == "__main__":
    sys.exit(main())