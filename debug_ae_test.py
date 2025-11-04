#!/usr/bin/env python3
"""
Debug test to understand AE scoring issues
"""

import requests
import uuid
from datetime import datetime

BACKEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com/api"

def create_test_user(age, experience_level):
    """Create a test user"""
    email = f"debug_ae_test_{age}_{experience_level}_{uuid.uuid4().hex[:6]}@example.com"
    
    current_year = datetime.now().year
    birth_year = current_year - age
    
    user_data = {
        "email": email,
        "password": "TestPassword123!",
        "first_name": f"DebugUser{age}",
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
            return {
                "email": email,
                "token": data.get("access_token"),
                "age": age,
                "experience_level": experience_level
            }
        else:
            print(f"Failed to create user: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"Exception creating user: {str(e)}")
        return None

def test_scoring():
    """Test the scoring mechanism"""
    print("🔍 Debug: Testing AE Scoring Mechanism")
    
    # Create test user
    user = create_test_user(25, 3)
    if not user:
        print("Failed to create test user")
        return
    
    # Get PPI questions
    headers = {"Authorization": f"Bearer {user['token']}"}
    response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
    
    if response.status_code != 200:
        print(f"Failed to get PPI: {response.status_code}")
        return
    
    ppi_data = response.json()
    items = ppi_data.get("items", [])
    
    print(f"Got {len(items)} PPI questions")
    
    # Test with all "A" answers (should be high discipline)
    answers_a = []
    for item in items:
        answers_a.append({
            "question_id": item["question_id"],
            "selected_option": "A"
        })
    
    # Submit and get result
    submit_data = {"answers": answers_a}
    response = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data, headers=headers, timeout=30)
    
    if response.status_code == 200:
        result = response.json()
        dna = result.get("financial_dna", {})
        weights = dna.get("weights", {})
        profile = dna.get("profile")
        dominant_traits = dna.get("dominant_traits", [])
        
        print(f"\n📊 All 'A' Answers Results:")
        print(f"Profile: {profile}")
        print(f"Weights: {weights}")
        print(f"Dominant traits: {dominant_traits[:5]}")
        
        # Test with all "D" answers
        answers_d = []
        for item in items:
            answers_d.append({
                "question_id": item["question_id"],
                "selected_option": "D"
            })
        
        submit_data_d = {"answers": answers_d}
        response_d = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data_d, headers=headers, timeout=30)
        
        if response_d.status_code == 200:
            result_d = response_d.json()
            dna_d = result_d.get("financial_dna", {})
            weights_d = dna_d.get("weights", {})
            profile_d = dna_d.get("profile")
            dominant_traits_d = dna_d.get("dominant_traits", [])
            
            print(f"\n📊 All 'D' Answers Results:")
            print(f"Profile: {profile_d}")
            print(f"Weights: {weights_d}")
            print(f"Dominant traits: {dominant_traits_d[:5]}")
        
    else:
        print(f"Failed to submit PPI: {response.status_code} - {response.text}")
    
    # Cleanup
    try:
        delete_data = {"email": user["email"]}
        requests.post(f"{BACKEND_URL}/auth/delete-account", json=delete_data, timeout=30)
        print(f"\n🧹 Cleaned up user: {user['email']}")
    except:
        pass

if __name__ == "__main__":
    test_scoring()