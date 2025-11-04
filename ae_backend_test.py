#!/usr/bin/env python3
"""
Adaptive Engine (AE) Backend Test Suite
Tests AE Contract v1.1-stable integration for Wealth Builder app

Test Scenarios:
1. Test Personalized PPI Composition (AE_FN_COMPOSE_PPI)
2. Test Financial DNA Generation (AE_FN_GENERATE_PLAN)
3. Verify Chapter Personalization
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
import requests
import uuid

# Configuration
BACKEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com/api"

class AdaptiveEngineTester:
    def __init__(self):
        self.test_results = []
        self.test_users = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {json.dumps(details, indent=2)}")
    
    def create_test_user(self, age, experience_level, user_suffix=""):
        """Create a test user with specific age and experience"""
        email = f"ae_test_user_{age}_{experience_level}_{uuid.uuid4().hex[:6]}{user_suffix}@example.com"
        
        # Calculate birth year from age
        current_year = datetime.now().year
        birth_year = current_year - age
        
        user_data = {
            "email": email,
            "password": "TestPassword123!",
            "first_name": f"TestUser{age}",
            "date_of_birth": f"{birth_year}-06-15",
            "language": "en",
            "experience_level": experience_level,
            "user_type": "POC",
            "occupation": "Software Developer",
            "state": "CA"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                user_info = {
                    "email": email,
                    "password": user_data["password"],
                    "token": data.get("access_token"),
                    "user_data": data.get("user"),
                    "age": age,
                    "experience_level": experience_level
                }
                self.test_users.append(user_info)
                return user_info
            else:
                print(f"Failed to create user {email}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"Exception creating user {email}: {str(e)}")
            return None
    
    def test_personalized_ppi_composition(self):
        """Test AE_FN_COMPOSE_PPI - Personalized PPI question selection"""
        print(f"\n🧪 Testing Personalized PPI Composition (AE_FN_COMPOSE_PPI)")
        
        # Create 3 test users with different profiles
        test_profiles = [
            {"age": 10, "experience": 1, "label": "User A (age 10, beginner)"},
            {"age": 25, "experience": 3, "label": "User B (age 25, intermediate)"},
            {"age": 40, "experience": 5, "label": "User C (age 40, advanced)"}
        ]
        
        user_ppi_results = {}
        
        for profile in test_profiles:
            user = self.create_test_user(profile["age"], profile["experience"])
            if not user:
                self.log_result(
                    f"PPI Composition - Create {profile['label']}", 
                    False, 
                    "Failed to create test user"
                )
                continue
            
            # Test GET /api/content/ppi/personalized
            try:
                headers = {"Authorization": f"Bearer {user['token']}"}
                response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
                
                if response.status_code == 200:
                    ppi_data = response.json()
                    user_ppi_results[profile['label']] = ppi_data
                    
                    # Verify response structure
                    required_fields = ["ppi_version", "items", "user_id", "age", "financial_experience"]
                    missing_fields = [field for field in required_fields if field not in ppi_data]
                    
                    if missing_fields:
                        self.log_result(
                            f"PPI Composition - {profile['label']} Structure", 
                            False, 
                            f"Missing fields: {missing_fields}",
                            {"response": ppi_data}
                        )
                        continue
                    
                    # Verify 20 questions
                    items = ppi_data.get("items", [])
                    if len(items) == 20:
                        self.log_result(
                            f"PPI Composition - {profile['label']} Count", 
                            True, 
                            f"Received exactly 20 PPI questions",
                            {"question_count": len(items)}
                        )
                    else:
                        self.log_result(
                            f"PPI Composition - {profile['label']} Count", 
                            False, 
                            f"Expected 20 questions, got {len(items)}",
                            {"question_count": len(items)}
                        )
                    
                    # Verify age and experience match
                    returned_age = ppi_data.get("age")
                    returned_exp = ppi_data.get("financial_experience")
                    
                    if returned_age == profile["age"]:
                        self.log_result(
                            f"PPI Composition - {profile['label']} Age Match", 
                            True, 
                            f"Age correctly identified as {returned_age}"
                        )
                    else:
                        self.log_result(
                            f"PPI Composition - {profile['label']} Age Match", 
                            False, 
                            f"Age mismatch: expected {profile['age']}, got {returned_age}"
                        )
                    
                    # Verify question structure
                    if items:
                        sample_item = items[0]
                        required_item_fields = ["question_id", "bank_id", "type", "prompt", "options"]
                        missing_item_fields = [field for field in required_item_fields if field not in sample_item]
                        
                        if not missing_item_fields:
                            self.log_result(
                                f"PPI Composition - {profile['label']} Item Structure", 
                                True, 
                                "Question items have correct structure",
                                {"sample_item": sample_item}
                            )
                        else:
                            self.log_result(
                                f"PPI Composition - {profile['label']} Item Structure", 
                                False, 
                                f"Missing item fields: {missing_item_fields}",
                                {"sample_item": sample_item}
                            )
                    
                else:
                    self.log_result(
                        f"PPI Composition - {profile['label']}", 
                        False, 
                        f"API call failed: {response.status_code}",
                        {"response": response.text}
                    )
                    
            except Exception as e:
                self.log_result(
                    f"PPI Composition - {profile['label']}", 
                    False, 
                    f"Exception: {str(e)}"
                )
        
        # Test deterministic behavior - same user should get same questions
        if len(self.test_users) > 0:
            user = self.test_users[0]
            try:
                headers = {"Authorization": f"Bearer {user['token']}"}
                
                # Call twice
                response1 = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
                response2 = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
                
                if response1.status_code == 200 and response2.status_code == 200:
                    data1 = response1.json()
                    data2 = response2.json()
                    
                    # Compare question IDs
                    items1 = [item["question_id"] for item in data1.get("items", [])]
                    items2 = [item["question_id"] for item in data2.get("items", [])]
                    
                    if items1 == items2:
                        self.log_result(
                            "PPI Composition - Deterministic Behavior", 
                            True, 
                            "Same user gets identical questions on repeated calls"
                        )
                    else:
                        self.log_result(
                            "PPI Composition - Deterministic Behavior", 
                            False, 
                            "Same user gets different questions on repeated calls",
                            {"call1_ids": items1, "call2_ids": items2}
                        )
                else:
                    self.log_result(
                        "PPI Composition - Deterministic Behavior", 
                        False, 
                        "Failed to make repeated API calls for deterministic test"
                    )
                    
            except Exception as e:
                self.log_result(
                    "PPI Composition - Deterministic Behavior", 
                    False, 
                    f"Exception: {str(e)}"
                )
        
        return user_ppi_results
    
    def test_financial_dna_generation(self):
        """Test AE_FN_GENERATE_PLAN - Financial DNA and LPI plan generation"""
        print(f"\n🧪 Testing Financial DNA Generation (AE_FN_GENERATE_PLAN)")
        
        if not self.test_users:
            self.log_result(
                "Financial DNA Generation", 
                False, 
                "No test users available for DNA generation test"
            )
            return
        
        user = self.test_users[0]  # Use first test user
        
        # First get personalized PPI questions
        try:
            headers = {"Authorization": f"Bearer {user['token']}"}
            ppi_response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
            
            if ppi_response.status_code != 200:
                self.log_result(
                    "Financial DNA Generation - Get PPI", 
                    False, 
                    f"Failed to get PPI questions: {ppi_response.status_code}"
                )
                return
            
            ppi_data = ppi_response.json()
            items = ppi_data.get("items", [])
            
            if len(items) < 20:
                self.log_result(
                    "Financial DNA Generation - PPI Questions", 
                    False, 
                    f"Insufficient PPI questions: {len(items)}"
                )
                return
            
            # Test Pattern A: All "A" answers (high discipline)
            answers_pattern_a = []
            for item in items:
                answers_pattern_a.append({
                    "question_id": item["question_id"],
                    "selected_option": "A"
                })
            
            # Submit Pattern A answers
            submit_data_a = {"answers": answers_pattern_a}
            response_a = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data_a, headers=headers, timeout=30)
            
            if response_a.status_code == 200:
                dna_result_a = response_a.json()
                
                # Verify response structure
                required_fields = ["message", "financial_dna", "lpi_plan", "learning_map", "personalized_path"]
                missing_fields = [field for field in required_fields if field not in dna_result_a]
                
                if not missing_fields:
                    self.log_result(
                        "Financial DNA Generation - Pattern A Structure", 
                        True, 
                        "Response has all required fields",
                        {"fields": list(dna_result_a.keys())}
                    )
                else:
                    self.log_result(
                        "Financial DNA Generation - Pattern A Structure", 
                        False, 
                        f"Missing fields: {missing_fields}",
                        {"response": dna_result_a}
                    )
                
                # Verify Financial DNA structure
                financial_dna = dna_result_a.get("financial_dna", {})
                dna_required = ["profile", "weights"]
                dna_missing = [field for field in dna_required if field not in financial_dna]
                
                if not dna_missing:
                    weights = financial_dna.get("weights", {})
                    weight_fields = ["discipline", "impulse", "confidence", "tempo"]
                    weight_missing = [field for field in weight_fields if field not in weights]
                    
                    if not weight_missing:
                        # Verify weight ranges (0.0-1.0 for numeric, tempo is string)
                        valid_weights = True
                        for field in ["discipline", "impulse", "confidence"]:
                            value = weights.get(field, -1)
                            if not (0.0 <= value <= 1.0):
                                valid_weights = False
                                break
                        
                        tempo = weights.get("tempo")
                        if tempo not in ["fast", "steady", "slow"]:
                            valid_weights = False
                        
                        if valid_weights:
                            self.log_result(
                                "Financial DNA Generation - Pattern A DNA Weights", 
                                True, 
                                "Financial DNA weights are within valid ranges",
                                {"weights": weights}
                            )
                        else:
                            self.log_result(
                                "Financial DNA Generation - Pattern A DNA Weights", 
                                False, 
                                "Financial DNA weights are outside valid ranges",
                                {"weights": weights}
                            )
                    else:
                        self.log_result(
                            "Financial DNA Generation - Pattern A DNA Weights", 
                            False, 
                            f"Missing weight fields: {weight_missing}",
                            {"weights": weights}
                        )
                else:
                    self.log_result(
                        "Financial DNA Generation - Pattern A DNA Structure", 
                        False, 
                        f"Missing DNA fields: {dna_missing}",
                        {"financial_dna": financial_dna}
                    )
                
                # Verify LPI Plan structure
                lpi_plan = dna_result_a.get("lpi_plan", {})
                lpi_required = ["version", "chapters", "tempo", "profile"]
                lpi_missing = [field for field in lpi_required if field not in lpi_plan]
                
                if not lpi_missing:
                    chapters = lpi_plan.get("chapters", [])
                    if len(chapters) == 10:
                        # Verify chapter structure
                        sample_chapter = chapters[0] if chapters else {}
                        chapter_fields = ["ch", "lessons", "quiz_mode"]
                        chapter_missing = [field for field in chapter_fields if field not in sample_chapter]
                        
                        if not chapter_missing:
                            self.log_result(
                                "Financial DNA Generation - Pattern A LPI Plan", 
                                True, 
                                "LPI plan has correct structure with 10 chapters",
                                {"chapter_count": len(chapters), "sample_chapter": sample_chapter}
                            )
                        else:
                            self.log_result(
                                "Financial DNA Generation - Pattern A LPI Plan", 
                                False, 
                                f"Missing chapter fields: {chapter_missing}",
                                {"sample_chapter": sample_chapter}
                            )
                    else:
                        self.log_result(
                            "Financial DNA Generation - Pattern A LPI Plan", 
                            False, 
                            f"Expected 10 chapters, got {len(chapters)}",
                            {"chapter_count": len(chapters)}
                        )
                else:
                    self.log_result(
                        "Financial DNA Generation - Pattern A LPI Plan", 
                        False, 
                        f"Missing LPI plan fields: {lpi_missing}",
                        {"lpi_plan": lpi_plan}
                    )
                
            else:
                self.log_result(
                    "Financial DNA Generation - Pattern A Submit", 
                    False, 
                    f"PPI submit failed: {response_a.status_code}",
                    {"response": response_a.text}
                )
                return
            
            # Test Pattern B: Mix of answers
            answers_pattern_b = []
            options = ["A", "B", "C", "D"]
            for i, item in enumerate(items):
                # Cycle through options for variety
                selected_option = options[i % 4]
                answers_pattern_b.append({
                    "question_id": item["question_id"],
                    "selected_option": selected_option
                })
            
            # Submit Pattern B answers
            submit_data_b = {"answers": answers_pattern_b}
            response_b = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data_b, headers=headers, timeout=30)
            
            if response_b.status_code == 200:
                dna_result_b = response_b.json()
                
                # Compare DNA results - they should be different
                dna_a = dna_result_a.get("financial_dna", {})
                dna_b = dna_result_b.get("financial_dna", {})
                
                weights_a = dna_a.get("weights", {})
                weights_b = dna_b.get("weights", {})
                
                # Check if at least one weight is different
                weights_different = False
                for field in ["discipline", "impulse", "confidence"]:
                    if weights_a.get(field) != weights_b.get(field):
                        weights_different = True
                        break
                
                if weights_different or weights_a.get("tempo") != weights_b.get("tempo"):
                    self.log_result(
                        "Financial DNA Generation - Pattern Differences", 
                        True, 
                        "Different answer patterns produce different Financial DNA",
                        {"pattern_a_weights": weights_a, "pattern_b_weights": weights_b}
                    )
                else:
                    self.log_result(
                        "Financial DNA Generation - Pattern Differences", 
                        False, 
                        "Different answer patterns produce identical Financial DNA",
                        {"pattern_a_weights": weights_a, "pattern_b_weights": weights_b}
                    )
                
                # Compare chapter orders
                chapters_a = [ch["ch"] for ch in dna_result_a.get("lpi_plan", {}).get("chapters", [])]
                chapters_b = [ch["ch"] for ch in dna_result_b.get("lpi_plan", {}).get("chapters", [])]
                
                if chapters_a != chapters_b:
                    self.log_result(
                        "Financial DNA Generation - Chapter Order Differences", 
                        True, 
                        "Different answer patterns produce different chapter orders",
                        {"pattern_a_order": chapters_a, "pattern_b_order": chapters_b}
                    )
                else:
                    self.log_result(
                        "Financial DNA Generation - Chapter Order Differences", 
                        False, 
                        "Different answer patterns produce identical chapter orders",
                        {"pattern_a_order": chapters_a, "pattern_b_order": chapters_b}
                    )
                
            else:
                self.log_result(
                    "Financial DNA Generation - Pattern B Submit", 
                    False, 
                    f"Pattern B PPI submit failed: {response_b.status_code}",
                    {"response": response_b.text}
                )
            
        except Exception as e:
            self.log_result(
                "Financial DNA Generation", 
                False, 
                f"Exception: {str(e)}"
            )
    
    def test_chapter_personalization(self):
        """Test chapter personalization and progress tracking"""
        print(f"\n🧪 Testing Chapter Personalization")
        
        if not self.test_users:
            self.log_result(
                "Chapter Personalization", 
                False, 
                "No test users available for chapter personalization test"
            )
            return
        
        user = self.test_users[0]  # Use first test user
        
        try:
            headers = {"Authorization": f"Bearer {user['token']}"}
            
            # Check user progress after PPI submission
            progress_response = requests.get(f"{BACKEND_URL}/progress", headers=headers, timeout=30)
            
            if progress_response.status_code == 200:
                progress_data = progress_response.json()
                
                # Verify progress structure
                if "learning_map" in progress_data:
                    learning_map = progress_data["learning_map"]
                    
                    # Verify learning map has required fields
                    required_map_fields = ["user_profile", "lesson_order", "financial_dna", "lpi_plan", "ae_version"]
                    missing_map_fields = [field for field in required_map_fields if field not in learning_map]
                    
                    if not missing_map_fields:
                        self.log_result(
                            "Chapter Personalization - Learning Map Structure", 
                            True, 
                            "Learning map has all required fields",
                            {"learning_map_keys": list(learning_map.keys())}
                        )
                    else:
                        self.log_result(
                            "Chapter Personalization - Learning Map Structure", 
                            False, 
                            f"Missing learning map fields: {missing_map_fields}",
                            {"learning_map": learning_map}
                        )
                    
                    # Verify lesson order is personalized (not sequential 1-10)
                    lesson_order = learning_map.get("lesson_order", [])
                    sequential_order = ["CH01", "CH02", "CH03", "CH04", "CH05", "CH06", "CH07", "CH08", "CH09", "CH10"]
                    
                    if lesson_order != sequential_order:
                        self.log_result(
                            "Chapter Personalization - Non-Sequential Order", 
                            True, 
                            "Chapter order is personalized (not sequential 1-10)",
                            {"personalized_order": lesson_order, "sequential_order": sequential_order}
                        )
                    else:
                        self.log_result(
                            "Chapter Personalization - Non-Sequential Order", 
                            False, 
                            "Chapter order is sequential (not personalized)",
                            {"order": lesson_order}
                        )
                    
                else:
                    self.log_result(
                        "Chapter Personalization - Learning Map Exists", 
                        False, 
                        "Learning map not found in progress data",
                        {"progress_keys": list(progress_data.keys())}
                    )
                
                # Check if first chapter is unlocked
                if lesson_order:
                    first_chapter = lesson_order[0]
                    
                    # Check LPI progress for first chapter
                    lpi_progress_response = requests.get(f"{BACKEND_URL}/lpi/progress", headers=headers, timeout=30)
                    
                    if lpi_progress_response.status_code == 200:
                        lpi_progress_data = lpi_progress_response.json()
                        progress_items = lpi_progress_data.get("progress", [])
                        
                        # Find first chapter in progress
                        first_chapter_progress = None
                        for item in progress_items:
                            if item.get("chapter_id") == first_chapter:
                                first_chapter_progress = item
                                break
                        
                        if first_chapter_progress:
                            if "unlocked_at" in first_chapter_progress:
                                self.log_result(
                                    "Chapter Personalization - First Chapter Unlocked", 
                                    True, 
                                    f"First chapter {first_chapter} is unlocked",
                                    {"first_chapter": first_chapter, "unlocked_at": first_chapter_progress["unlocked_at"]}
                                )
                            else:
                                self.log_result(
                                    "Chapter Personalization - First Chapter Unlocked", 
                                    False, 
                                    f"First chapter {first_chapter} missing unlock timestamp",
                                    {"first_chapter_progress": first_chapter_progress}
                                )
                        else:
                            self.log_result(
                                "Chapter Personalization - First Chapter Unlocked", 
                                False, 
                                f"First chapter {first_chapter} not found in LPI progress",
                                {"available_chapters": [item.get("chapter_id") for item in progress_items]}
                            )
                    else:
                        self.log_result(
                            "Chapter Personalization - LPI Progress Check", 
                            False, 
                            f"Failed to get LPI progress: {lpi_progress_response.status_code}",
                            {"response": lpi_progress_response.text}
                        )
                
            else:
                self.log_result(
                    "Chapter Personalization - Progress Check", 
                    False, 
                    f"Failed to get user progress: {progress_response.status_code}",
                    {"response": progress_response.text}
                )
                
        except Exception as e:
            self.log_result(
                "Chapter Personalization", 
                False, 
                f"Exception: {str(e)}"
            )
    
    def cleanup_test_users(self):
        """Clean up test users after testing"""
        print(f"\n🧹 Cleaning up test users")
        
        for user in self.test_users:
            try:
                delete_data = {"email": user["email"]}
                response = requests.post(f"{BACKEND_URL}/auth/delete-account", json=delete_data, timeout=30)
                
                if response.status_code == 200:
                    print(f"   ✅ Deleted user: {user['email']}")
                else:
                    print(f"   ❌ Failed to delete user: {user['email']} - {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ Exception deleting user {user['email']}: {str(e)}")
    
    async def run_all_tests(self):
        """Run all Adaptive Engine tests"""
        print("🚀 Starting Adaptive Engine (AE) Integration Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing AE Contract v1.1-stable")
        
        # Test 1: Personalized PPI Composition
        user_ppi_results = self.test_personalized_ppi_composition()
        
        # Test 2: Financial DNA Generation (requires users from test 1)
        self.test_financial_dna_generation()
        
        # Test 3: Chapter Personalization (requires DNA generation from test 2)
        self.test_chapter_personalization()
        
        # Cleanup
        self.cleanup_test_users()
        
        # Summary
        print(f"\n📊 Test Summary:")
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"Passed: {passed}/{total}")
        
        if passed < total:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total

async def main():
    """Main test runner"""
    tester = AdaptiveEngineTester()
    success = await tester.run_all_tests()
    
    # Save detailed results
    with open('/app/ae_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/ae_test_results.json")
    
    if success:
        print("\n🎉 All AE integration tests passed!")
        return 0
    else:
        print("\n💥 Some AE integration tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)