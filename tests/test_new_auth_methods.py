"""
Test Suite for New Authentication Methods:
- LinkedIn OAuth callback
- Magic Link (passwordless email)
- Passkey (WebAuthn)

Previous OAuth tests passed (iteration_4.json). This tests the new auth methods added.
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://finpath-16.preview.emergentagent.com').rstrip('/')


class TestLinkedInOAuth:
    """LinkedIn OAuth callback endpoint tests"""
    
    def test_linkedin_callback_creates_new_user(self):
        """Test LinkedIn OAuth creates new user if not exists"""
        test_email = f"TEST_linkedin_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/linkedin/callback", json={
            "email": test_email,
            "name": "LinkedIn Test User",
            "picture": "https://example.com/linkedin-pic.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "linkedin",
            "linkedin_id": f"linkedin_{uuid.uuid4().hex[:12]}"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user" in data, "Response should contain user"
        assert "access_token" in data, "Response should contain access_token"
        assert data["token_type"] == "bearer"
        
        # Verify user data
        user = data["user"]
        assert user["email"] == test_email
        assert user.get("linkedin_connected") == True
        assert "id" in user
        
        print(f"✅ LinkedIn OAuth created new user: {test_email}")
    
    def test_linkedin_callback_updates_existing_user(self):
        """Test LinkedIn OAuth updates existing user"""
        # First create a user via registration
        test_email = f"TEST_linkedin_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        # Register user first
        register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "first_name": "Existing",
            "date_of_birth": "1990-01-15",
            "language": "en",
            "experience_level": 2,
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Other"
        })
        
        # Now connect LinkedIn
        linkedin_response = requests.post(f"{BASE_URL}/api/auth/linkedin/callback", json={
            "email": test_email,
            "name": "Existing User",
            "picture": "https://example.com/linkedin-pic.jpg",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "linkedin",
            "linkedin_id": f"linkedin_{uuid.uuid4().hex[:12]}"
        })
        
        assert linkedin_response.status_code == 200, f"Expected 200, got {linkedin_response.status_code}: {linkedin_response.text}"
        data = linkedin_response.json()
        
        # Verify LinkedIn is now connected
        user = data["user"]
        assert user.get("linkedin_connected") == True
        
        print(f"✅ LinkedIn OAuth updated existing user: {test_email}")
    
    def test_linkedin_callback_returns_valid_jwt(self):
        """Test LinkedIn OAuth returns valid JWT that works for protected endpoints"""
        test_email = f"TEST_linkedin_jwt_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/linkedin/callback", json={
            "email": test_email,
            "name": "JWT Test User",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "linkedin",
            "linkedin_id": f"linkedin_{uuid.uuid4().hex[:12]}"
        })
        
        assert response.status_code == 200
        data = response.json()
        token = data["access_token"]
        
        # Use token to access protected endpoint
        me_response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert me_response.status_code == 200, f"JWT should be valid for /api/auth/me: {me_response.text}"
        me_data = me_response.json()
        assert me_data["email"] == test_email
        
        print(f"✅ LinkedIn OAuth JWT is valid for protected endpoints")
    
    def test_linkedin_callback_missing_email(self):
        """Test LinkedIn OAuth returns 422 when email is missing"""
        response = requests.post(f"{BASE_URL}/api/auth/linkedin/callback", json={
            "name": "No Email User",
            "session_token": f"session_{uuid.uuid4().hex}",
            "provider": "linkedin"
        })
        
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
        print("✅ LinkedIn OAuth correctly rejects missing email")


class TestMagicLink:
    """Magic Link (passwordless email) authentication tests"""
    
    def test_magic_link_send_new_user(self):
        """Test sending magic link creates user if not exists"""
        test_email = f"TEST_magic_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/magic-link/send", json={
            "email": test_email
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return success message
        assert "message" in data
        assert data["email"] == test_email
        
        # In dev mode, should return _dev_token for testing
        # (email service may be limited in test mode)
        if "_dev_token" in data:
            assert len(data["_dev_token"]) > 20, "Dev token should be a valid token"
            print(f"✅ Magic link sent (dev token available): {test_email}")
        else:
            print(f"✅ Magic link sent (email sent): {test_email}")
    
    def test_magic_link_send_existing_user(self):
        """Test sending magic link to existing user"""
        # First create a user
        test_email = f"TEST_magic_existing_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "first_name": "Magic",
            "date_of_birth": "1990-01-15",
            "language": "en",
            "experience_level": 2,
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Other"
        })
        
        # Now send magic link
        response = requests.post(f"{BASE_URL}/api/auth/magic-link/send", json={
            "email": test_email
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ Magic link sent to existing user: {test_email}")
    
    def test_magic_link_verify_valid_token(self):
        """Test verifying a valid magic link token"""
        test_email = f"TEST_magic_verify_{uuid.uuid4().hex[:8]}@example.com"
        
        # Send magic link first
        send_response = requests.post(f"{BASE_URL}/api/auth/magic-link/send", json={
            "email": test_email
        })
        
        assert send_response.status_code == 200
        send_data = send_response.json()
        
        # Get dev token (available in test mode)
        if "_dev_token" not in send_data:
            pytest.skip("Dev token not available - email service may be active")
        
        dev_token = send_data["_dev_token"]
        
        # Verify the token
        verify_response = requests.post(f"{BASE_URL}/api/auth/magic-link/verify", json={
            "token": dev_token
        })
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        verify_data = verify_response.json()
        
        # Should return user and access token
        assert "user" in verify_data
        assert "access_token" in verify_data
        assert verify_data["user"]["email"] == test_email
        
        print(f"✅ Magic link verified successfully: {test_email}")
    
    def test_magic_link_verify_invalid_token(self):
        """Test verifying an invalid magic link token"""
        response = requests.post(f"{BASE_URL}/api/auth/magic-link/verify", json={
            "token": "invalid_token_12345"
        })
        
        assert response.status_code == 400, f"Expected 400 for invalid token, got {response.status_code}"
        print("✅ Magic link correctly rejects invalid token")
    
    def test_magic_link_token_single_use(self):
        """Test that magic link token can only be used once"""
        test_email = f"TEST_magic_single_{uuid.uuid4().hex[:8]}@example.com"
        
        # Send magic link
        send_response = requests.post(f"{BASE_URL}/api/auth/magic-link/send", json={
            "email": test_email
        })
        
        assert send_response.status_code == 200
        send_data = send_response.json()
        
        if "_dev_token" not in send_data:
            pytest.skip("Dev token not available")
        
        dev_token = send_data["_dev_token"]
        
        # First verification should succeed
        first_verify = requests.post(f"{BASE_URL}/api/auth/magic-link/verify", json={
            "token": dev_token
        })
        assert first_verify.status_code == 200
        
        # Second verification should fail (token already used)
        second_verify = requests.post(f"{BASE_URL}/api/auth/magic-link/verify", json={
            "token": dev_token
        })
        assert second_verify.status_code == 400, f"Expected 400 for reused token, got {second_verify.status_code}"
        
        print("✅ Magic link token is single-use")
    
    def test_magic_link_missing_email(self):
        """Test magic link send returns 422 when email is missing"""
        response = requests.post(f"{BASE_URL}/api/auth/magic-link/send", json={})
        
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
        print("✅ Magic link correctly rejects missing email")


class TestPasskey:
    """Passkey (WebAuthn) authentication tests"""
    
    def test_passkey_register_options_existing_user(self):
        """Test getting passkey registration options for existing user"""
        # First create a user
        test_email = f"TEST_passkey_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "first_name": "Passkey",
            "date_of_birth": "1990-01-15",
            "language": "en",
            "experience_level": 2,
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Other"
        })
        
        # Get registration options
        response = requests.post(f"{BASE_URL}/api/auth/passkey/register/options", json={
            "email": test_email
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return WebAuthn options
        assert "options" in data
        options = data["options"]
        
        # Options should be a JSON string containing WebAuthn registration options
        assert isinstance(options, str)
        assert "challenge" in options
        assert "rp" in options  # Relying Party
        assert "user" in options
        
        print(f"✅ Passkey registration options returned for: {test_email}")
    
    def test_passkey_register_options_nonexistent_user(self):
        """Test passkey registration options returns 404 for non-existent user"""
        response = requests.post(f"{BASE_URL}/api/auth/passkey/register/options", json={
            "email": "nonexistent_user_12345@example.com"
        })
        
        assert response.status_code == 404, f"Expected 404 for non-existent user, got {response.status_code}"
        print("✅ Passkey registration correctly rejects non-existent user")
    
    def test_passkey_authenticate_options_existing_user(self):
        """Test getting passkey authentication options for existing user"""
        # First create a user
        test_email = f"TEST_passkey_auth_{uuid.uuid4().hex[:8]}@example.com"
        
        requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "first_name": "Passkey Auth",
            "date_of_birth": "1990-01-15",
            "language": "en",
            "experience_level": 2,
            "user_type": "POC",
            "life_stage": "AD",
            "occupation": "Other"
        })
        
        # Get authentication options
        response = requests.post(f"{BASE_URL}/api/auth/passkey/authenticate/options", json={
            "email": test_email
        })
        
        # Should return 400 if no passkey registered (expected behavior)
        # or 200 with options if passkey exists
        if response.status_code == 400:
            data = response.json()
            assert "No passkey registered" in data.get("detail", "")
            print(f"✅ Passkey auth correctly reports no passkey registered for: {test_email}")
        else:
            assert response.status_code == 200
            data = response.json()
            assert "options" in data
            print(f"✅ Passkey authentication options returned for: {test_email}")
    
    def test_passkey_authenticate_options_discoverable(self):
        """Test getting passkey authentication options without email (discoverable credentials)"""
        response = requests.post(f"{BASE_URL}/api/auth/passkey/authenticate/options", json={
            "email": None
        })
        
        # Should return 200 with options for discoverable credentials
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "options" in data
        options = data["options"]
        assert "challenge" in options
        
        print("✅ Passkey discoverable credential options returned")
    
    def test_passkey_authenticate_options_nonexistent_user(self):
        """Test passkey auth options returns 404 for non-existent user"""
        response = requests.post(f"{BASE_URL}/api/auth/passkey/authenticate/options", json={
            "email": "nonexistent_passkey_user@example.com"
        })
        
        assert response.status_code == 404, f"Expected 404 for non-existent user, got {response.status_code}"
        print("✅ Passkey auth correctly rejects non-existent user")


class TestLoginPageAuthOptions:
    """Test that all auth options are available on login page"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "Wealth Builder" in data.get("message", "")
        print("✅ API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
