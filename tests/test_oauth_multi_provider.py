"""
Test Multi-Provider OAuth Endpoints
Tests Google, Apple, Microsoft, Facebook OAuth callback endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOAuthEndpoints:
    """Test OAuth callback endpoints for all 4 providers"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.test_email = f"test_oauth_{uuid.uuid4().hex[:8]}@example.com"
        self.test_name = "Test OAuth User"
        self.test_session_token = f"test_session_{uuid.uuid4().hex}"
    
    # =========================================================================
    # Google OAuth Tests
    # =========================================================================
    def test_google_oauth_callback_creates_new_user(self):
        """Test Google OAuth callback creates new user if not exists"""
        payload = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            "email": f"test_google_{uuid.uuid4().hex[:8]}@example.com",
            "name": "Google Test User",
            "picture": "https://example.com/picture.jpg",
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "user" in data, "Response should contain 'user'"
        assert "access_token" in data, "Response should contain 'access_token'"
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["google_connected"] == True
        assert "id" in user
        assert "person_key" in user
        
        print(f"✅ Google OAuth: New user created with ID {user['id']}")
    
    def test_google_oauth_callback_updates_existing_user(self):
        """Test Google OAuth callback updates existing user"""
        # First create a user
        email = f"test_google_existing_{uuid.uuid4().hex[:8]}@example.com"
        payload1 = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Google User First",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload1)
        assert response1.status_code == 200
        user_id = response1.json()["user"]["id"]
        
        # Now update with new Google ID and picture
        payload2 = {
            "google_id": f"google_new_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Google User Updated",
            "picture": "https://example.com/new_picture.jpg",
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload2)
        
        assert response2.status_code == 200
        data = response2.json()
        
        # Should be same user
        assert data["user"]["id"] == user_id
        assert data["user"]["google_connected"] == True
        
        print(f"✅ Google OAuth: Existing user updated")
    
    # =========================================================================
    # Apple OAuth Tests
    # =========================================================================
    def test_apple_oauth_callback_creates_new_user(self):
        """Test Apple OAuth callback creates new user if not exists"""
        payload = {
            "apple_id": f"apple_{uuid.uuid4().hex[:12]}",
            "email": f"test_apple_{uuid.uuid4().hex[:8]}@example.com",
            "name": "Apple Test User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "apple"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/apple/callback", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["apple_connected"] == True
        
        print(f"✅ Apple OAuth: New user created with ID {user['id']}")
    
    def test_apple_oauth_callback_updates_existing_user(self):
        """Test Apple OAuth callback updates existing user"""
        email = f"test_apple_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        # First create
        payload1 = {
            "apple_id": f"apple_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Apple User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "apple"
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/auth/apple/callback", json=payload1)
        assert response1.status_code == 200
        user_id = response1.json()["user"]["id"]
        
        # Update
        payload2 = {
            "apple_id": f"apple_new_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Apple User Updated",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "apple"
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/auth/apple/callback", json=payload2)
        
        assert response2.status_code == 200
        assert response2.json()["user"]["id"] == user_id
        
        print(f"✅ Apple OAuth: Existing user updated")
    
    # =========================================================================
    # Microsoft OAuth Tests
    # =========================================================================
    def test_microsoft_oauth_callback_creates_new_user(self):
        """Test Microsoft OAuth callback creates new user if not exists"""
        payload = {
            "microsoft_id": f"microsoft_{uuid.uuid4().hex[:12]}",
            "email": f"test_microsoft_{uuid.uuid4().hex[:8]}@example.com",
            "name": "Microsoft Test User",
            "picture": "https://example.com/ms_picture.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "microsoft"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/microsoft/callback", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["microsoft_connected"] == True
        
        print(f"✅ Microsoft OAuth: New user created with ID {user['id']}")
    
    def test_microsoft_oauth_callback_updates_existing_user(self):
        """Test Microsoft OAuth callback updates existing user"""
        email = f"test_ms_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        # First create
        payload1 = {
            "microsoft_id": f"microsoft_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "MS User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "microsoft"
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/auth/microsoft/callback", json=payload1)
        assert response1.status_code == 200
        user_id = response1.json()["user"]["id"]
        
        # Update
        payload2 = {
            "microsoft_id": f"microsoft_new_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "MS User Updated",
            "picture": "https://example.com/new_ms.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "microsoft"
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/auth/microsoft/callback", json=payload2)
        
        assert response2.status_code == 200
        assert response2.json()["user"]["id"] == user_id
        
        print(f"✅ Microsoft OAuth: Existing user updated")
    
    # =========================================================================
    # Facebook OAuth Tests
    # =========================================================================
    def test_facebook_oauth_callback_creates_new_user(self):
        """Test Facebook OAuth callback creates new user if not exists"""
        payload = {
            "facebook_id": f"facebook_{uuid.uuid4().hex[:12]}",
            "email": f"test_facebook_{uuid.uuid4().hex[:8]}@example.com",
            "name": "Facebook Test User",
            "picture": "https://example.com/fb_picture.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "facebook"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/facebook/callback", json=payload)
        
        # Status assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == payload["email"]
        assert user["facebook_connected"] == True
        
        print(f"✅ Facebook OAuth: New user created with ID {user['id']}")
    
    def test_facebook_oauth_callback_updates_existing_user(self):
        """Test Facebook OAuth callback updates existing user"""
        email = f"test_fb_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        # First create
        payload1 = {
            "facebook_id": f"facebook_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "FB User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "facebook"
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/auth/facebook/callback", json=payload1)
        assert response1.status_code == 200
        user_id = response1.json()["user"]["id"]
        
        # Update
        payload2 = {
            "facebook_id": f"facebook_new_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "FB User Updated",
            "picture": "https://example.com/new_fb.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "facebook"
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/auth/facebook/callback", json=payload2)
        
        assert response2.status_code == 200
        assert response2.json()["user"]["id"] == user_id
        
        print(f"✅ Facebook OAuth: Existing user updated")
    
    # =========================================================================
    # JWT Token Validation Tests
    # =========================================================================
    def test_oauth_returns_valid_jwt_token(self):
        """Test that OAuth callback returns a valid JWT token that can be used for API calls"""
        payload = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            "email": f"test_jwt_{uuid.uuid4().hex[:8]}@example.com",
            "name": "JWT Test User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload)
        assert response.status_code == 200
        
        token = response.json()["access_token"]
        assert token is not None
        assert len(token) > 0
        
        # Use token to access protected endpoint
        auth_response = self.session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert auth_response.status_code == 200, f"Token should be valid: {auth_response.text}"
        user_data = auth_response.json()
        assert user_data["email"] == payload["email"]
        
        print(f"✅ JWT Token: Valid and works for protected endpoints")
    
    # =========================================================================
    # Cross-Provider Tests
    # =========================================================================
    def test_user_can_connect_multiple_providers(self):
        """Test that a user can connect multiple OAuth providers"""
        email = f"test_multi_{uuid.uuid4().hex[:8]}@example.com"
        
        # Connect via Google first
        google_payload = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Multi Provider User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response1 = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=google_payload)
        assert response1.status_code == 200
        user_id = response1.json()["user"]["id"]
        assert response1.json()["user"]["google_connected"] == True
        
        # Now connect Apple to same email
        apple_payload = {
            "apple_id": f"apple_{uuid.uuid4().hex[:12]}",
            "email": email,
            "name": "Multi Provider User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "apple"
        }
        
        response2 = self.session.post(f"{BASE_URL}/api/auth/apple/callback", json=apple_payload)
        assert response2.status_code == 200
        
        # Should be same user with both providers connected
        user = response2.json()["user"]
        assert user["id"] == user_id
        assert user["google_connected"] == True
        assert user["apple_connected"] == True
        
        print(f"✅ Multi-Provider: User can connect Google + Apple")
    
    # =========================================================================
    # Error Handling Tests
    # =========================================================================
    def test_oauth_callback_requires_email(self):
        """Test that OAuth callback requires email field"""
        payload = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            # Missing email
            "name": "No Email User",
            "picture": None,
            "session_token": f"session_{uuid.uuid4().hex}"
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload)
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
        
        print(f"✅ Validation: Missing email returns 422")
    
    def test_oauth_callback_requires_session_token(self):
        """Test that OAuth callback requires session_token field"""
        payload = {
            "google_id": f"google_{uuid.uuid4().hex[:12]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "name": "No Token User",
            "picture": None
            # Missing session_token
        }
        
        response = self.session.post(f"{BASE_URL}/api/auth/google/callback", json=payload)
        
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing session_token, got {response.status_code}"
        
        print(f"✅ Validation: Missing session_token returns 422")


class TestHealthAndBasicEndpoints:
    """Basic health check tests"""
    
    def test_api_root_endpoint(self):
        """Test API root endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API Root: {data['message']}")
    
    def test_check_email_endpoint(self):
        """Test email check endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/check-email",
            json={"email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "exists" in data
        assert data["exists"] == False
        print(f"✅ Check Email: Endpoint works correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
