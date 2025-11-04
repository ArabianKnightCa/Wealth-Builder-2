#!/usr/bin/env python3
"""
Enhanced Adaptive Engine v2.1 Test Suite
Tests the improved accuracy and 100% success rate for personalized learning paths

Test Scenarios:
1. Context Differentiation - Same answers, different contexts
2. Archetype Variety - Different answer patterns produce different archetypes
3. Chapter Order Personalization - Experience-based chapter ordering
4. Trait Analysis - Specific answers trigger specific traits
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

class EnhancedAETester:
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
        if details and isinstance(details, dict):
            for key, value in details.items():
                print(f"   {key}: {value}")
    
    def create_test_user(self, age, experience_level, user_suffix=""):
        """Create a test user with specific age and experience"""
        email = f"enhanced_ae_test_{age}_{experience_level}_{uuid.uuid4().hex[:6]}{user_suffix}@example.com"
        
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
    
    def get_ppi_questions(self, user):
        """Get personalized PPI questions for a user"""
        try:
            headers = {"Authorization": f"Bearer {user['token']}"}
            response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get PPI for user {user['email']}: {response.status_code}")
                return None
        except Exception as e:
            print(f"Exception getting PPI for user {user['email']}: {str(e)}")
            return None
    
    def submit_ppi_answers(self, user, answers):
        """Submit PPI answers and get Financial DNA"""
        try:
            headers = {"Authorization": f"Bearer {user['token']}"}
            submit_data = {"answers": answers}
            response = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data, headers=headers, timeout=30)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to submit PPI for user {user['email']}: {response.status_code}")
                return None
        except Exception as e:
            print(f"Exception submitting PPI for user {user['email']}: {str(e)}")
            return None
    
    def test_context_differentiation(self):
        """
        Test 1: Context Differentiation
        Create 2 users with SAME answer pattern but different contexts
        """
        print(f"\n🧪 Test 1: Context Differentiation")
        
        # Create User A: age 15, beginner
        user_a = self.create_test_user(15, 1, "_context_a")
        if not user_a:
            self.log_result("Context Differentiation - Create User A", False, "Failed to create User A")
            return False
        
        # Create User B: age 30, intermediate  
        user_b = self.create_test_user(30, 3, "_context_b")
        if not user_b:
            self.log_result("Context Differentiation - Create User B", False, "Failed to create User B")
            return False
        
        # Get PPI questions for both users
        ppi_a = self.get_ppi_questions(user_a)
        ppi_b = self.get_ppi_questions(user_b)
        
        if not ppi_a or not ppi_b:
            self.log_result("Context Differentiation - Get PPI", False, "Failed to get PPI questions")
            return False
        
        # Create identical answer pattern (all "B" answers)
        items_a = ppi_a.get("items", [])
        items_b = ppi_b.get("items", [])
        
        answers_a = []
        for item in items_a:
            answers_a.append({
                "question_id": item["question_id"],
                "selected_option": "B"
            })
        
        answers_b = []
        for item in items_b:
            answers_b.append({
                "question_id": item["question_id"],
                "selected_option": "B"
            })
        
        # Submit identical answers
        result_a = self.submit_ppi_answers(user_a, answers_a)
        result_b = self.submit_ppi_answers(user_b, answers_b)
        
        if not result_a or not result_b:
            self.log_result("Context Differentiation - Submit Answers", False, "Failed to submit PPI answers")
            return False
        
        # Compare results - they should be different due to age/experience context
        dna_a = result_a.get("financial_dna", {})
        dna_b = result_b.get("financial_dna", {})
        
        weights_a = dna_a.get("weights", {})
        weights_b = dna_b.get("weights", {})
        
        # Check if profiles are different
        profile_a = dna_a.get("profile")
        profile_b = dna_b.get("profile")
        
        profiles_different = profile_a != profile_b
        
        # Check if weights are different (due to age/experience modifiers)
        weights_different = False
        for field in ["discipline", "impulse", "confidence"]:
            if abs(weights_a.get(field, 0) - weights_b.get(field, 0)) > 0.05:  # 5% threshold
                weights_different = True
                break
        
        # Check chapter orders
        chapters_a = [ch["ch"] for ch in result_a.get("lpi_plan", {}).get("chapters", [])]
        chapters_b = [ch["ch"] for ch in result_b.get("lpi_plan", {}).get("chapters", [])]
        
        chapters_different = chapters_a != chapters_b
        
        if profiles_different or weights_different or chapters_different:
            self.log_result(
                "Context Differentiation - Different Outcomes", 
                True, 
                "Same answers produce different outcomes with different contexts",
                {
                    "User A (15yr, beginner)": f"Profile: {profile_a}, Weights: {weights_a}",
                    "User B (30yr, intermediate)": f"Profile: {profile_b}, Weights: {weights_b}",
                    "Profiles Different": profiles_different,
                    "Weights Different": weights_different,
                    "Chapter Orders Different": chapters_different
                }
            )
            return True
        else:
            self.log_result(
                "Context Differentiation - Different Outcomes", 
                False, 
                "Same answers produce identical outcomes despite different contexts",
                {
                    "User A": f"Profile: {profile_a}, Weights: {weights_a}",
                    "User B": f"Profile: {profile_b}, Weights: {weights_b}"
                }
            )
            return False
    
    def test_archetype_variety(self):
        """
        Test 2: Archetype Variety
        Test 5 different answer patterns to verify at least 4 different archetypes
        """
        print(f"\n🧪 Test 2: Archetype Variety")
        
        # Create a test user for archetype testing
        user = self.create_test_user(25, 3, "_archetype")
        if not user:
            self.log_result("Archetype Variety - Create User", False, "Failed to create test user")
            return False
        
        # Get PPI questions
        ppi_data = self.get_ppi_questions(user)
        if not ppi_data:
            self.log_result("Archetype Variety - Get PPI", False, "Failed to get PPI questions")
            return False
        
        items = ppi_data.get("items", [])
        if len(items) < 20:
            self.log_result("Archetype Variety - PPI Count", False, f"Insufficient PPI questions: {len(items)}")
            return False
        
        # Test 5 different answer patterns
        test_patterns = [
            {"name": "All A (disciplined)", "pattern": "A"},
            {"name": "All B (balanced/moderate)", "pattern": "B"},
            {"name": "All C (cautious/learning)", "pattern": "C"},
            {"name": "All D (spontaneous/needs support)", "pattern": "D"},
            {"name": "Mixed (50% A, 50% D)", "pattern": "mixed"}
        ]
        
        profiles_found = []
        
        for test_pattern in test_patterns:
            # Create answer pattern
            answers = []
            for i, item in enumerate(items):
                if test_pattern["pattern"] == "mixed":
                    # Alternate between A and D
                    selected_option = "A" if i % 2 == 0 else "D"
                else:
                    selected_option = test_pattern["pattern"]
                
                answers.append({
                    "question_id": item["question_id"],
                    "selected_option": selected_option
                })
            
            # Submit answers
            result = self.submit_ppi_answers(user, answers)
            if result:
                profile = result.get("financial_dna", {}).get("profile")
                profiles_found.append({
                    "pattern": test_pattern["name"],
                    "profile": profile
                })
                
                self.log_result(
                    f"Archetype Variety - {test_pattern['name']}", 
                    True, 
                    f"Generated profile: {profile}"
                )
            else:
                self.log_result(
                    f"Archetype Variety - {test_pattern['name']}", 
                    False, 
                    "Failed to generate profile"
                )
        
        # Count unique profiles
        unique_profiles = set(p["profile"] for p in profiles_found if p["profile"])
        
        if len(unique_profiles) >= 4:
            self.log_result(
                "Archetype Variety - Unique Profiles", 
                True, 
                f"Generated {len(unique_profiles)} different archetypes",
                {
                    "Unique Profiles": list(unique_profiles),
                    "All Results": profiles_found
                }
            )
            return True
        else:
            self.log_result(
                "Archetype Variety - Unique Profiles", 
                False, 
                f"Only generated {len(unique_profiles)} different archetypes (expected 4+)",
                {
                    "Unique Profiles": list(unique_profiles),
                    "All Results": profiles_found
                }
            )
            return False
    
    def test_chapter_order_personalization(self):
        """
        Test 3: Chapter Order Personalization
        Compare chapter orders across 3 users with different experience levels
        """
        print(f"\n🧪 Test 3: Chapter Order Personalization")
        
        # Create 3 users with different experience levels
        users = [
            {"user": self.create_test_user(10, 1, "_beginner"), "label": "Beginner (age 10)"},
            {"user": self.create_test_user(25, 3, "_intermediate"), "label": "Intermediate (age 25)"},
            {"user": self.create_test_user(40, 5, "_advanced"), "label": "Advanced (age 40)"}
        ]
        
        chapter_orders = {}
        
        for user_info in users:
            user = user_info["user"]
            label = user_info["label"]
            
            if not user:
                self.log_result(f"Chapter Order - Create {label}", False, f"Failed to create {label}")
                continue
            
            # Get PPI and submit consistent answers
            ppi_data = self.get_ppi_questions(user)
            if not ppi_data:
                self.log_result(f"Chapter Order - Get PPI {label}", False, f"Failed to get PPI for {label}")
                continue
            
            items = ppi_data.get("items", [])
            
            # Use consistent answer pattern (all B) to focus on experience-based differences
            answers = []
            for item in items:
                answers.append({
                    "question_id": item["question_id"],
                    "selected_option": "B"
                })
            
            result = self.submit_ppi_answers(user, answers)
            if result:
                chapters = [ch["ch"] for ch in result.get("lpi_plan", {}).get("chapters", [])]
                chapter_orders[label] = chapters
                
                # Check specific expectations
                if "Beginner" in label:
                    # Beginners should have Chapter 5 (investing) delayed
                    ch5_position = chapters.index(5) if 5 in chapters else -1
                    if ch5_position >= 6:  # Position 7 or later (0-indexed)
                        self.log_result(
                            f"Chapter Order - {label} Ch5 Delay", 
                            True, 
                            f"Chapter 5 delayed to position {ch5_position + 1} for beginner"
                        )
                    else:
                        self.log_result(
                            f"Chapter Order - {label} Ch5 Delay", 
                            False, 
                            f"Chapter 5 at position {ch5_position + 1}, expected position 7+"
                        )
                
                elif "Advanced" in label:
                    # Advanced should prioritize Ch5 & Ch6 early
                    ch5_position = chapters.index(5) if 5 in chapters else -1
                    ch6_position = chapters.index(6) if 6 in chapters else -1
                    
                    if ch5_position <= 4 and ch6_position <= 5:  # Early positions
                        self.log_result(
                            f"Chapter Order - {label} Ch5&6 Priority", 
                            True, 
                            f"Ch5 at pos {ch5_position + 1}, Ch6 at pos {ch6_position + 1} (prioritized for advanced)"
                        )
                    else:
                        self.log_result(
                            f"Chapter Order - {label} Ch5&6 Priority", 
                            False, 
                            f"Ch5 at pos {ch5_position + 1}, Ch6 at pos {ch6_position + 1} (expected early positions)"
                        )
                
                self.log_result(
                    f"Chapter Order - {label} Generated", 
                    True, 
                    f"Chapter order: {chapters}"
                )
            else:
                self.log_result(f"Chapter Order - {label} Submit", False, f"Failed to submit PPI for {label}")
        
        # Compare all orders to ensure they're different
        orders_list = list(chapter_orders.values())
        if len(orders_list) >= 2:
            all_different = True
            for i in range(len(orders_list)):
                for j in range(i + 1, len(orders_list)):
                    if orders_list[i] == orders_list[j]:
                        all_different = False
                        break
                if not all_different:
                    break
            
            if all_different:
                self.log_result(
                    "Chapter Order - Personalization Verified", 
                    True, 
                    "All experience levels produce different chapter orders",
                    chapter_orders
                )
                return True
            else:
                self.log_result(
                    "Chapter Order - Personalization Verified", 
                    False, 
                    "Some experience levels produce identical chapter orders",
                    chapter_orders
                )
                return False
        else:
            self.log_result(
                "Chapter Order - Insufficient Data", 
                False, 
                f"Only got {len(orders_list)} chapter orders, need at least 2 to compare"
            )
            return False
    
    def test_trait_analysis(self):
        """
        Test 4: Trait Analysis
        Submit specific answers that should trigger specific traits
        """
        print(f"\n🧪 Test 4: Trait Analysis")
        
        # Create test user
        user = self.create_test_user(25, 3, "_traits")
        if not user:
            self.log_result("Trait Analysis - Create User", False, "Failed to create test user")
            return False
        
        # Get PPI questions
        ppi_data = self.get_ppi_questions(user)
        if not ppi_data:
            self.log_result("Trait Analysis - Get PPI", False, "Failed to get PPI questions")
            return False
        
        items = ppi_data.get("items", [])
        
        # Create answers targeting specific traits
        # Looking for questions that should trigger "needs_support" trait
        target_answers = {
            "PPI_Q08": "D",  # Credit card struggle → needs_support
            "PPI_Q12": "D",  # Investing overwhelmed → needs_support  
            "PPI_Q13": "D",  # Setback recovery hard → needs_support
        }
        
        answers = []
        targeted_questions = 0
        
        for item in items:
            q_id = item["question_id"]
            if q_id in target_answers:
                selected_option = target_answers[q_id]
                targeted_questions += 1
            else:
                # Use neutral answers for other questions
                selected_option = "B"
            
            answers.append({
                "question_id": q_id,
                "selected_option": selected_option
            })
        
        if targeted_questions < 3:
            self.log_result(
                "Trait Analysis - Target Questions", 
                False, 
                f"Only found {targeted_questions} target questions, need 3 for trait analysis"
            )
            return False
        
        # Submit answers
        result = self.submit_ppi_answers(user, answers)
        if not result:
            self.log_result("Trait Analysis - Submit Answers", False, "Failed to submit PPI answers")
            return False
        
        # Check if "Guided Learner" profile was triggered (3+ needs_support traits)
        profile = result.get("financial_dna", {}).get("profile")
        dominant_traits = result.get("financial_dna", {}).get("dominant_traits", [])
        
        # Check if needs_support is in dominant traits
        needs_support_count = 0
        for trait, count in dominant_traits:
            if trait == "needs_support":
                needs_support_count = count
                break
        
        if profile == "Guided Learner":
            self.log_result(
                "Trait Analysis - Guided Learner Profile", 
                True, 
                f"Successfully triggered 'Guided Learner' profile with needs_support trait",
                {
                    "Profile": profile,
                    "Needs Support Count": needs_support_count,
                    "Dominant Traits": dominant_traits[:3]
                }
            )
            return True
        else:
            # Check if at least needs_support trait is present
            if needs_support_count >= 2:
                self.log_result(
                    "Trait Analysis - Needs Support Trait", 
                    True, 
                    f"Successfully triggered needs_support trait ({needs_support_count} times), profile: {profile}",
                    {
                        "Profile": profile,
                        "Needs Support Count": needs_support_count,
                        "Dominant Traits": dominant_traits[:3]
                    }
                )
                return True
            else:
                self.log_result(
                    "Trait Analysis - Trait Detection", 
                    False, 
                    f"Failed to trigger expected traits, got profile: {profile}",
                    {
                        "Profile": profile,
                        "Needs Support Count": needs_support_count,
                        "Dominant Traits": dominant_traits[:3],
                        "Targeted Questions": targeted_questions
                    }
                )
                return False
    
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
        """Run all Enhanced AE tests"""
        print("🚀 Starting Enhanced Adaptive Engine v2.1 Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("Testing improved accuracy and 100% success rate")
        
        test_results = []
        
        # Test 1: Context Differentiation
        test_results.append(self.test_context_differentiation())
        
        # Test 2: Archetype Variety
        test_results.append(self.test_archetype_variety())
        
        # Test 3: Chapter Order Personalization
        test_results.append(self.test_chapter_order_personalization())
        
        # Test 4: Trait Analysis
        test_results.append(self.test_trait_analysis())
        
        # Cleanup
        self.cleanup_test_users()
        
        # Calculate success metrics
        passed_tests = sum(1 for result in test_results if result)
        total_tests = len(test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Summary
        print(f"\n📊 Enhanced AE v2.1 Test Summary:")
        print(f"Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests})")
        
        # Detailed results
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"Individual Tests: {passed}/{total} passed")
        
        if passed < total:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        # Target: 100% success rate
        target_met = success_rate == 100.0
        
        if target_met:
            print(f"\n🎉 TARGET ACHIEVED: 100% success rate!")
        else:
            print(f"\n⚠️  Target not met: {success_rate:.1f}% (target: 100%)")
        
        return target_met

async def main():
    """Main test runner"""
    tester = EnhancedAETester()
    success = await tester.run_all_tests()
    
    # Save detailed results
    with open('/app/enhanced_ae_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/enhanced_ae_test_results.json")
    
    if success:
        print("\n🎉 Enhanced AE v2.1 tests completed successfully!")
        return 0
    else:
        print("\n💥 Enhanced AE v2.1 tests failed to meet 100% success target!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)