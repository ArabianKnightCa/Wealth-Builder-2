#!/usr/bin/env python3
"""
Extended AE Test - Test different answer patterns to verify personalization
"""

import asyncio
import json
import requests
import uuid
from datetime import datetime

BACKEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com/api"

class ExtendedAETester:
    def __init__(self):
        self.test_results = []
        self.test_users = []
        
    def log_result(self, test_name, success, message, details=None):
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
    
    def create_test_user(self, age, experience_level, label=""):
        email = f"ae_extended_{age}_{experience_level}_{uuid.uuid4().hex[:6]}@example.com"
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
                    "experience_level": experience_level,
                    "label": label
                }
                self.test_users.append(user_info)
                return user_info
            else:
                return None
        except Exception as e:
            return None
    
    def test_different_answer_patterns(self):
        """Test different answer patterns to see if we get different profiles and chapter orders"""
        print("\n🧪 Testing Different Answer Patterns for Personalization")
        
        # Create one user for multiple tests
        user = self.create_test_user(25, 3, "Pattern Test User")
        if not user:
            self.log_result("Pattern Test", False, "Failed to create test user")
            return False
        
        headers = {"Authorization": f"Bearer {user['token']}"}
        
        # Get PPI questions
        ppi_response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
        if ppi_response.status_code != 200:
            self.log_result("Pattern Test", False, "Failed to get PPI questions")
            return False
        
        ppi_data = ppi_response.json()
        items = ppi_data.get("items", [])
        
        # Test Pattern 1: All A answers (high discipline)
        answers_pattern_1 = []
        for item in items:
            answers_pattern_1.append({
                "question_id": item["question_id"],
                "selected_option": "A"
            })
        
        submit_data_1 = {"answers": answers_pattern_1}
        response_1 = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data_1, headers=headers, timeout=30)
        
        if response_1.status_code == 200:
            result_1 = response_1.json()
            dna_1 = result_1.get("financial_dna", {})
            lpi_1 = result_1.get("lpi_plan", {})
            
            self.log_result(
                "Pattern 1 - All A Answers",
                True,
                f"Profile: {dna_1.get('profile')}, Discipline: {dna_1.get('weights', {}).get('discipline')}",
                {
                    "profile": dna_1.get('profile'),
                    "weights": dna_1.get('weights'),
                    "chapter_order": [ch.get('ch') for ch in lpi_1.get('chapters', [])]
                }
            )
        
        # Test Pattern 2: All D answers (low discipline, high impulse)
        answers_pattern_2 = []
        for item in items:
            answers_pattern_2.append({
                "question_id": item["question_id"],
                "selected_option": "D"
            })
        
        submit_data_2 = {"answers": answers_pattern_2}
        response_2 = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data_2, headers=headers, timeout=30)
        
        if response_2.status_code == 200:
            result_2 = response_2.json()
            dna_2 = result_2.get("financial_dna", {})
            lpi_2 = result_2.get("lpi_plan", {})
            
            self.log_result(
                "Pattern 2 - All D Answers",
                True,
                f"Profile: {dna_2.get('profile')}, Discipline: {dna_2.get('weights', {}).get('discipline')}",
                {
                    "profile": dna_2.get('profile'),
                    "weights": dna_2.get('weights'),
                    "chapter_order": [ch.get('ch') for ch in lpi_2.get('chapters', [])]
                }
            )
            
            # Compare the two patterns
            if result_1 and result_2:
                profile_1 = dna_1.get('profile')
                profile_2 = dna_2.get('profile')
                
                chapters_1 = [ch.get('ch') for ch in lpi_1.get('chapters', [])]
                chapters_2 = [ch.get('ch') for ch in lpi_2.get('chapters', [])]
                
                if profile_1 != profile_2:
                    self.log_result(
                        "Pattern Comparison - Profiles",
                        True,
                        f"Different answer patterns produce different profiles: {profile_1} vs {profile_2}"
                    )
                else:
                    self.log_result(
                        "Pattern Comparison - Profiles",
                        False,
                        f"Different answer patterns produce same profile: {profile_1}"
                    )
                
                if chapters_1 != chapters_2:
                    self.log_result(
                        "Pattern Comparison - Chapter Orders",
                        True,
                        f"Different answer patterns produce different chapter orders"
                    )
                else:
                    self.log_result(
                        "Pattern Comparison - Chapter Orders",
                        False,
                        f"Different answer patterns produce same chapter order"
                    )
        
        return True
    
    def cleanup_test_users(self):
        for user in self.test_users:
            try:
                delete_data = {"email": user["email"]}
                requests.post(f"{BACKEND_URL}/auth/delete-account", json=delete_data, timeout=30)
            except:
                pass
    
    async def run_extended_tests(self):
        print("🚀 Starting Extended AE Tests")
        
        success = self.test_different_answer_patterns()
        
        self.cleanup_test_users()
        
        # Summary
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        print(f"\n📊 Extended Test Summary: {passed}/{total}")
        
        return success

async def main():
    tester = ExtendedAETester()
    success = await tester.run_extended_tests()
    
    with open('/app/ae_extended_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())