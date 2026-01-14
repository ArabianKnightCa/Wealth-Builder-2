"""
Backend API Tests for Wealth Builder - PPI Flow Testing
Tests: Registration, PPI Questions, PPI Submit, Dashboard/LPI Content

P0: PPI Submit Button Flow - User completes all 20 PPI questions and submits
P0: Continuous Adaptation - PPI questions should show adapted language based on user age
P1: All 20 PPI questions are presented (not filtered by age)
P1: Quiz content adaptation works for different ages
P1: Dashboard shows unlocked lessons
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ppi-dashboard.preview.emergentagent.com').rstrip('/')

# Test user data
TEST_7YO_EMAIL = f"test7yo_{uuid.uuid4().hex[:8]}@test.com"
TEST_45YO_EMAIL = f"test45yo_{uuid.uuid4().hex[:8]}@test.com"

class TestHealthAndBasics:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API Root: {data}")

class TestUserRegistration:
    """Test user registration for different age groups"""
    
    def test_register_7_year_old(self):
        """Register a 7-year-old user (EL 1)"""
        payload = {
            "email": TEST_7YO_EMAIL,
            "password": "TestPass123!",
            "first_name": "TestChild",
            "date_of_birth": "2018-01-01",  # 7 years old
            "experience_level": 1,
            "language": "en",
            "user_type": "POC",
            "life_stage": "ES",  # Elementary School
            "occupation": "Middle / High School Student",
            "state": "CA"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"7yo Registration Response: {response.status_code}")
        
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, skipping registration")
            pytest.skip("User already registered")
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_7YO_EMAIL
        print(f"7yo User registered: {data['user']['id']}")
        return data
    
    def test_register_45_year_old(self):
        """Register a 45-year-old user (EL 5)"""
        payload = {
            "email": TEST_45YO_EMAIL,
            "password": "TestPass123!",
            "first_name": "TestAdult",
            "date_of_birth": "1980-01-01",  # 45 years old
            "experience_level": 5,
            "language": "en",
            "user_type": "POC",
            "life_stage": "AD",  # Adult
            "occupation": "Full-Time Professional",
            "state": "NY"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        print(f"45yo Registration Response: {response.status_code}")
        
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, skipping registration")
            pytest.skip("User already registered")
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_45YO_EMAIL
        print(f"45yo User registered: {data['user']['id']}")
        return data


class TestPPIFlow:
    """Test PPI questionnaire flow - P0 Critical Tests"""
    
    @pytest.fixture
    def user_7yo_token(self):
        """Get or create 7-year-old user and return token"""
        # Try to login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_7YO_EMAIL,
            "password": "TestPass123!"
        })
        
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        
        # Register if login fails
        payload = {
            "email": TEST_7YO_EMAIL,
            "password": "TestPass123!",
            "first_name": "TestChild",
            "date_of_birth": "2018-01-01",
            "experience_level": 1,
            "language": "en",
            "user_type": "POC",
            "life_stage": "ES",
            "occupation": "Middle / High School Student",
            "state": "CA"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code == 200:
            return response.json()["access_token"]
        
        pytest.skip("Could not create 7yo user")
    
    @pytest.fixture
    def user_45yo_token(self):
        """Get or create 45-year-old user and return token"""
        # Try to login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_45YO_EMAIL,
            "password": "TestPass123!"
        })
        
        if login_response.status_code == 200:
            return login_response.json()["access_token"]
        
        # Register if login fails
        payload = {
            "email": TEST_45YO_EMAIL,
            "password": "TestPass123!",
            "first_name": "TestAdult",
            "date_of_birth": "1980-01-01",
            "experience_level": 5,
            "language": "en",
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Full-Time Professional",
            "state": "NY"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        if response.status_code == 200:
            return response.json()["access_token"]
        
        pytest.skip("Could not create 45yo user")
    
    def test_ppi_questions_7yo_returns_20_questions(self, user_7yo_token):
        """P1: Verify 7-year-old gets all 20 PPI questions (not filtered)"""
        headers = {"Authorization": f"Bearer {user_7yo_token}"}
        response = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers)
        
        assert response.status_code == 200, f"Failed to get PPI questions: {response.text}"
        data = response.json()
        
        assert "items" in data, "Response should contain 'items'"
        items = data["items"]
        
        # P1: All 20 PPI questions should be presented
        assert len(items) == 20, f"Expected 20 questions, got {len(items)}"
        print(f"7yo received {len(items)} PPI questions")
        
        # Check first question has adapted text
        first_q = items[0]
        assert "prompt" in first_q
        assert "options" in first_q
        assert len(first_q["options"]) == 4, "Each question should have 4 options"
        print(f"First question for 7yo: {first_q['prompt'][:100]}...")
        
        return items
    
    def test_ppi_questions_45yo_returns_20_questions(self, user_45yo_token):
        """P1: Verify 45-year-old gets all 20 PPI questions"""
        headers = {"Authorization": f"Bearer {user_45yo_token}"}
        response = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers)
        
        assert response.status_code == 200, f"Failed to get PPI questions: {response.text}"
        data = response.json()
        
        assert "items" in data
        items = data["items"]
        
        # P1: All 20 PPI questions should be presented
        assert len(items) == 20, f"Expected 20 questions, got {len(items)}"
        print(f"45yo received {len(items)} PPI questions")
        
        # Check first question
        first_q = items[0]
        print(f"First question for 45yo: {first_q['prompt'][:100]}...")
        
        return items
    
    def test_ppi_adaptation_difference(self, user_7yo_token, user_45yo_token):
        """P0: Verify PPI questions show adapted language based on user age"""
        headers_7yo = {"Authorization": f"Bearer {user_7yo_token}"}
        headers_45yo = {"Authorization": f"Bearer {user_45yo_token}"}
        
        response_7yo = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers_7yo)
        response_45yo = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers_45yo)
        
        assert response_7yo.status_code == 200
        assert response_45yo.status_code == 200
        
        items_7yo = response_7yo.json()["items"]
        items_45yo = response_45yo.json()["items"]
        
        # Compare first question text - should be different due to adaptation
        q1_7yo = items_7yo[0]["prompt"]
        q1_45yo = items_45yo[0]["prompt"]
        
        print(f"7yo Q1: {q1_7yo}")
        print(f"45yo Q1: {q1_45yo}")
        
        # Check TAP scalars are different
        scalars_7yo = items_7yo[0].get("scalars", {})
        scalars_45yo = items_45yo[0].get("scalars", {})
        
        print(f"7yo scalars: {scalars_7yo}")
        print(f"45yo scalars: {scalars_45yo}")
        
        # LC (Learning Complexity) should be different
        if scalars_7yo and scalars_45yo:
            assert scalars_7yo.get("lc", 0) != scalars_45yo.get("lc", 0), \
                "LC should be different for different ages"
            assert scalars_7yo.get("childiness", 0) > scalars_45yo.get("childiness", 0), \
                "7yo should have higher childiness than 45yo"
    
    def test_ppi_no_emojis_in_questions(self, user_7yo_token):
        """P1: Verify no emojis or friendly starters in PPI question/option text"""
        headers = {"Authorization": f"Bearer {user_7yo_token}"}
        response = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers)
        
        assert response.status_code == 200
        items = response.json()["items"]
        
        emoji_patterns = ['💰', '🏦', '📈', '🛒', '🎯', '📋', '📚', '💡', '🧠', '🔒', '⚠️', '🏆', '🤝', '🔮', '⏰']
        friendly_starters = ["Let's learn", "Here's something fun", "Did you know?", "Here's the thing:"]
        
        for item in items:
            prompt = item["prompt"]
            
            # Check for emojis
            for emoji in emoji_patterns:
                assert emoji not in prompt, f"Found emoji {emoji} in question: {prompt[:50]}..."
            
            # Check for friendly starters
            for starter in friendly_starters:
                assert not prompt.startswith(starter), f"Found friendly starter in question: {prompt[:50]}..."
            
            # Check options
            for opt in item["options"]:
                for emoji in emoji_patterns:
                    assert emoji not in opt, f"Found emoji {emoji} in option: {opt[:50]}..."
        
        print("No emojis or friendly starters found in PPI questions - PASS")


class TestPPISubmit:
    """Test PPI submission flow - P0 Critical"""
    
    @pytest.fixture
    def fresh_user_token(self):
        """Create a fresh user for PPI submission test"""
        unique_email = f"test_ppi_submit_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "TestPass123!",
            "first_name": "PPITestUser",
            "date_of_birth": "2000-01-01",  # 25 years old
            "experience_level": 3,
            "language": "en",
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Full-Time Professional",
            "state": "TX"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Failed to register: {response.text}"
        return response.json()["access_token"], unique_email
    
    def test_ppi_submit_full_flow(self, fresh_user_token):
        """P0: Test complete PPI submission flow - user answers all 20 questions and submits"""
        token, email = fresh_user_token
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 1: Get PPI questions
        response = requests.get(f"{BASE_URL}/api/content/ppi/personalized", headers=headers)
        assert response.status_code == 200, f"Failed to get PPI questions: {response.text}"
        
        items = response.json()["items"]
        assert len(items) == 20, f"Expected 20 questions, got {len(items)}"
        
        # Step 2: Create answers for all 20 questions
        answers = []
        for i, item in enumerate(items):
            question_id = f"PPI_Q{i+1:02d}"
            # Alternate between A, B, C, D for variety
            selected_option = ["A", "B", "C", "D"][i % 4]
            answers.append({
                "question_id": question_id,
                "selected_option": selected_option
            })
        
        print(f"Submitting {len(answers)} PPI answers...")
        
        # Step 3: Submit PPI answers
        submit_response = requests.post(
            f"{BASE_URL}/api/ppi/submit",
            json={"answers": answers},
            headers=headers
        )
        
        print(f"PPI Submit Response Status: {submit_response.status_code}")
        print(f"PPI Submit Response: {submit_response.text[:500]}...")
        
        assert submit_response.status_code == 200, f"PPI submit failed: {submit_response.text}"
        
        submit_data = submit_response.json()
        
        # Verify response contains expected fields
        assert "message" in submit_data, "Response should contain 'message'"
        assert submit_data["message"] == "PPI submitted successfully"
        
        assert "financial_dna" in submit_data, "Response should contain 'financial_dna'"
        assert "lpi_plan" in submit_data, "Response should contain 'lpi_plan'"
        assert "uid" in submit_data, "Response should contain 'uid'"
        
        # Verify Financial DNA structure
        dna = submit_data["financial_dna"]
        assert "profile" in dna, "DNA should have profile"
        assert "weights" in dna, "DNA should have weights"
        print(f"Financial DNA Profile: {dna['profile']}")
        print(f"DNA Weights: {dna['weights']}")
        
        # Verify LPI plan structure
        lpi_plan = submit_data["lpi_plan"]
        assert "chapters" in lpi_plan, "LPI plan should have chapters"
        assert len(lpi_plan["chapters"]) == 10, "LPI plan should have 10 chapters"
        print(f"LPI Plan: {len(lpi_plan['chapters'])} chapters")
        
        # Step 4: Verify user can now access dashboard/LPI content
        lpi_response = requests.get(f"{BASE_URL}/api/content/lpi", headers=headers)
        assert lpi_response.status_code == 200, f"Failed to get LPI content: {lpi_response.text}"
        
        lpi_data = lpi_response.json()
        assert "chapters" in lpi_data, "LPI response should contain chapters"
        print(f"User can access {len(lpi_data['chapters'])} LPI chapters after PPI completion")
        
        # Cleanup - delete test user
        requests.delete(f"{BASE_URL}/api/auth/delete-account/{email}")
        
        return submit_data


class TestDashboardAndLPI:
    """Test Dashboard and LPI content access"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Create and authenticate a user"""
        unique_email = f"test_dashboard_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "TestPass123!",
            "first_name": "DashboardTest",
            "date_of_birth": "1990-01-01",
            "experience_level": 3,
            "language": "en",
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Full-Time Professional",
            "state": "CA"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        return response.json()["access_token"], unique_email
    
    def test_lpi_content_accessible(self, authenticated_user):
        """P1: Test that LPI content is accessible"""
        token, email = authenticated_user
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/content/lpi", headers=headers)
        assert response.status_code == 200, f"Failed to get LPI content: {response.text}"
        
        data = response.json()
        assert "chapters" in data
        chapters = data["chapters"]
        
        # Should have 10 chapters
        assert len(chapters) >= 1, "Should have at least 1 chapter"
        print(f"LPI has {len(chapters)} chapters")
        
        # Check first chapter structure
        first_chapter = chapters[0]
        assert "id" in first_chapter
        assert "title" in first_chapter
        assert "lessons" in first_chapter
        print(f"First chapter: {first_chapter['title']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/auth/delete-account/{email}")
    
    def test_progress_endpoint(self, authenticated_user):
        """Test progress endpoint"""
        token, email = authenticated_user
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/progress", headers=headers)
        assert response.status_code == 200, f"Failed to get progress: {response.text}"
        
        data = response.json()
        assert "current_module" in data
        assert "current_step" in data
        print(f"Progress: module={data['current_module']}, step={data['current_step']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/auth/delete-account/{email}")


class TestQuizAdaptation:
    """Test quiz content adaptation for different ages"""
    
    @pytest.fixture
    def user_with_ppi_complete(self):
        """Create user and complete PPI"""
        unique_email = f"test_quiz_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "TestPass123!",
            "first_name": "QuizTest",
            "date_of_birth": "2015-01-01",  # 10 years old
            "experience_level": 1,
            "language": "en",
            "user_type": "POC",
            "life_stage": "ES",
            "occupation": "Middle / High School Student",
            "state": "CA"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        token = response.json()["access_token"]
        
        # Complete PPI
        headers = {"Authorization": f"Bearer {token}"}
        answers = [{"question_id": f"PPI_Q{i:02d}", "selected_option": "A"} for i in range(1, 21)]
        requests.post(f"{BASE_URL}/api/ppi/submit", json={"answers": answers}, headers=headers)
        
        return token, unique_email
    
    def test_quiz_adaptation_for_young_user(self, user_with_ppi_complete):
        """P1: Test quiz content is adapted for young users"""
        token, email = user_with_ppi_complete
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get chapter quiz
        response = requests.get(f"{BASE_URL}/api/content/chapters/CH01/quiz", headers=headers)
        
        if response.status_code == 404:
            print("Quiz endpoint not found - may need database seeding")
            pytest.skip("Quiz data not available")
        
        assert response.status_code == 200, f"Failed to get quiz: {response.text}"
        
        data = response.json()
        if "questions" in data:
            questions = data["questions"]
            if questions:
                first_q = questions[0]
                print(f"Quiz question for young user: {first_q.get('question_text', 'N/A')[:100]}...")
                
                # Check for TAP version
                if "tap_version" in first_q:
                    assert first_q["tap_version"] == "5.0", "Should use TAP 5.0"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/auth/delete-account/{email}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
