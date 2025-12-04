#!/usr/bin/env python3
"""
FEEDBACK SYSTEM END-TO-END TESTING

**Objective:** Test the complete feedback system to identify issues with feedback submission and viewing.

**Test Focus:**
1. Submit Feedback Test - POST /api/feedback
2. View Feedback Test - GET /api/admin/feedback  
3. Database Check - Direct MongoDB queries
4. Issue Identification - Duplicate endpoints, data structure problems

**Known Issues to Investigate:**
- Two duplicate feedback endpoints in server.py (lines 872 and 992)
- User reports feedback not showing up in feedback viewer dashboard
- Potential data structure mismatch between submission and retrieval
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

class FeedbackSystemTester:
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
    
    def test_ppi_personalization(self, persona_key):
        """Test PPI personalization - age-appropriate questions"""
        persona = PERSONAS[persona_key]
        persona_data = self.persona_data[persona_key]
        
        print(f"\n📋 Testing PPI Personalization for {persona['name']} (Age: {persona['age']})...")
        
        headers = {"Authorization": f"Bearer {persona_data['access_token']}"}
        
        try:
            response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers)
            if response.status_code == 200:
                ppi_data = response.json()
                
                # Store PPI data for later use
                self.persona_data[persona_key]["ppi_questions"] = ppi_data
                
                # Analyze questions
                questions = ppi_data.get("questions", [])
                question_count = len(questions)
                
                print(f"✅ PPI Questions Retrieved: {question_count} questions")
                
                # Check age-appropriate filtering
                age_ranges = []
                sample_questions = []
                
                for i, q in enumerate(questions[:3]):  # Show first 3 questions
                    age_range = f"{q.get('age_min', 'N/A')}-{q.get('age_max', 'N/A')}"
                    age_ranges.append(age_range)
                    sample_questions.append({
                        "id": q.get("id"),
                        "prompt": q.get("prompt", "")[:100] + "..." if len(q.get("prompt", "")) > 100 else q.get("prompt", ""),
                        "age_range": age_range
                    })
                
                print(f"   📝 Sample Questions:")
                for sq in sample_questions:
                    print(f"      • {sq['id']}: {sq['prompt']} (Age: {sq['age_range']})")
                
                # Verify age appropriateness
                user_age = persona["age"]
                age_appropriate = True
                for q in questions:
                    age_min = q.get("age_min", 0)
                    age_max = q.get("age_max", 100)
                    if not (age_min <= user_age <= age_max):
                        age_appropriate = False
                        break
                
                if age_appropriate:
                    print(f"✅ Age Filtering: All questions appropriate for age {user_age}")
                    self.results["ppi_personalization"]["passed"] += 1
                else:
                    error_msg = f"Age filtering failed for {user_age}-year-old"
                    print(f"❌ {error_msg}")
                    self.results["ppi_personalization"]["failed"] += 1
                    self.results["ppi_personalization"]["errors"].append(f"{persona['name']}: {error_msg}")
                
                return True
                
            else:
                error_msg = f"PPI retrieval failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["ppi_personalization"]["failed"] += 1
                self.results["ppi_personalization"]["errors"].append(f"{persona['name']}: {error_msg}")
                return False
                
        except Exception as e:
            error_msg = f"PPI personalization error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["ppi_personalization"]["failed"] += 1
            self.results["ppi_personalization"]["errors"].append(f"{persona['name']}: {error_msg}")
            return False
    
    def submit_ppi_answers(self, persona_key):
        """Submit PPI answers based on persona characteristics"""
        persona = PERSONAS[persona_key]
        persona_data = self.persona_data[persona_key]
        
        print(f"\n🧬 Submitting PPI Answers for {persona['name']}...")
        
        if "ppi_questions" not in persona_data:
            print("❌ No PPI questions available - skipping submission")
            return False
        
        questions = persona_data["ppi_questions"].get("questions", [])
        answers = []
        
        # Generate persona-appropriate answers
        answer_pattern = persona["ppi_answers"]
        
        for i, question in enumerate(questions):
            options = question.get("options", [])
            if not options:
                continue
                
            # Select answer based on persona pattern
            if answer_pattern == "mostly_A_and_D":  # Child: Simple, curious
                selected = "A" if i % 2 == 0 else "D"
            elif answer_pattern == "mostly_A_and_B":  # Teen: Structured, organized
                selected = "A" if i % 2 == 0 else "B"
            elif answer_pattern == "mostly_A_and_C":  # Adult: Ambitious, goal-focused
                selected = "A" if i % 2 == 0 else "C"
            else:
                selected = "A"  # Default
            
            # Ensure selected option exists
            if selected not in [opt.get("id", "") for opt in options]:
                selected = options[0].get("id", "A")
            
            answers.append({
                "question_id": question.get("id"),
                "selected_option": selected
            })
        
        submission_data = {"answers": answers}
        headers = {"Authorization": f"Bearer {persona_data['access_token']}"}
        
        try:
            response = requests.post(f"{BACKEND_URL}/ppi/submit", json=submission_data, headers=headers)
            if response.status_code == 200:
                result = response.json()
                
                # Store Financial DNA profile
                self.persona_data[persona_key]["financial_dna"] = result.get("financial_dna", {})
                self.persona_data[persona_key]["lpi_plan"] = result.get("lpi_plan", {})
                
                dna_profile = result.get("financial_dna", {}).get("profile", "Unknown")
                weights = result.get("financial_dna", {}).get("weights", {})
                
                print(f"✅ PPI Submission successful")
                print(f"   🧬 Generated Financial DNA: {dna_profile}")
                print(f"   📊 Weights: Tempo={weights.get('tempo', 'N/A')}, Discipline={weights.get('discipline', 'N/A')}, Confidence={weights.get('confidence', 'N/A')}")
                
                # Verify expected profile (if specified)
                expected_profile = persona.get("expected_profile")
                if expected_profile and expected_profile.lower() in dna_profile.lower():
                    print(f"✅ Profile matches expectation: {expected_profile}")
                
                self.results["ppi_submission"]["passed"] += 1
                return True
                
            else:
                error_msg = f"PPI submission failed: {response.status_code} - {response.text}"
                print(f"❌ {error_msg}")
                self.results["ppi_submission"]["failed"] += 1
                self.results["ppi_submission"]["errors"].append(f"{persona['name']}: {error_msg}")
                return False
                
        except Exception as e:
            error_msg = f"PPI submission error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["ppi_submission"]["failed"] += 1
            self.results["ppi_submission"]["errors"].append(f"{persona['name']}: {error_msg}")
            return False
    
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
        
        if self.db is None:
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