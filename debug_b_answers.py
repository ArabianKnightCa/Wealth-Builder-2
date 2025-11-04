#!/usr/bin/env python3
"""
Debug test to understand what "B" answers produce
"""

import requests
import uuid
from datetime import datetime

BACKEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com/api"

def create_test_user(age, experience_level):
    """Create a test user"""
    email = f"debug_b_test_{age}_{experience_level}_{uuid.uuid4().hex[:6]}@example.com"
    
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

def test_b_answers():
    """Test what B answers produce"""
    print("🔍 Debug: Testing 'B' Answers")
    
    # Test young user
    user_young = create_test_user(15, 1)
    user_adult = create_test_user(25, 3)
    
    if not user_young or not user_adult:
        print("Failed to create test users")
        return
    
    for user in [user_young, user_adult]:
        print(f"\n👤 Testing user: age {user['age']}, experience {user['experience_level']}")
        
        # Get PPI questions
        headers = {"Authorization": f"Bearer {user['token']}"}
        response = requests.get(f"{BACKEND_URL}/content/ppi/personalized", headers=headers, timeout=30)
        
        if response.status_code != 200:
            print(f"Failed to get PPI: {response.status_code}")
            continue
        
        ppi_data = response.json()
        items = ppi_data.get("items", [])
        
        # Test with all "B" answers
        answers_b = []
        for item in items:
            answers_b.append({
                "question_id": item["question_id"],
                "selected_option": "B"
            })
        
        # Submit and get result
        submit_data = {"answers": answers_b}
        response = requests.post(f"{BACKEND_URL}/ppi/submit", json=submit_data, headers=headers, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            dna = result.get("financial_dna", {})
            weights = dna.get("weights", {})
            profile = dna.get("profile")
            dominant_traits = dna.get("dominant_traits", [])
            
            print(f"Profile: {profile}")
            print(f"Weights: {weights}")
            print(f"Dominant traits: {dominant_traits[:5]}")
        else:
            print(f"Failed to submit PPI: {response.status_code}")
        
        # Cleanup
        try:
            delete_data = {"email": user["email"]}
            requests.post(f"{BACKEND_URL}/auth/delete-account", json=delete_data, timeout=30)
        except:
            pass

if __name__ == "__main__":
    test_b_answers()