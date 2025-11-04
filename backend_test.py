#!/usr/bin/env python3
"""
Backend Test Suite for Delete Account Functionality
Tests both backend API and frontend E2E functionality
"""

import asyncio
import json
import os
import sys
import time
from datetime import datetime
from playwright.async_api import async_playwright
import requests
import uuid

# Configuration
BACKEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com/api"
FRONTEND_URL = "https://wealth-wisdom-32.preview.emergentagent.com"

class DeleteAccountTester:
    def __init__(self):
        self.test_results = []
        self.test_user_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        self.test_user_password = "TestPassword123!"
        self.test_user_token = None
        self.test_user_data = None
        
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
            print(f"   Details: {details}")
    
    def create_test_user(self):
        """Create a test user for deletion testing"""
        print(f"\n🔧 Creating test user: {self.test_user_email}")
        
        user_data = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "first_name": "Test",
            "date_of_birth": "1990-01-01",
            "language": "en",
            "experience_level": 3,
            "user_type": "POC",
            "occupation": "Software Developer",
            "state": "CA"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_token = data.get("access_token")
                self.test_user_data = data.get("user")
                self.log_result(
                    "Create Test User", 
                    True, 
                    "Test user created successfully",
                    {"user_id": self.test_user_data.get("id"), "email": self.test_user_email}
                )
                return True
            else:
                self.log_result(
                    "Create Test User", 
                    False, 
                    f"Failed to create user: {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result("Create Test User", False, f"Exception: {str(e)}")
            return False
    
    def test_backend_delete_endpoint(self):
        """Test the backend DELETE endpoint directly"""
        print(f"\n🧪 Testing Backend DELETE Endpoint")
        
        try:
            # Test the POST /api/auth/delete-account endpoint
            delete_data = {"email": self.test_user_email}
            response = requests.post(f"{BACKEND_URL}/auth/delete-account", json=delete_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                deleted_counts = data.get("deleted", {})
                
                # Verify response structure
                expected_fields = ["message", "user_id", "deleted"]
                missing_fields = [field for field in expected_fields if field not in data]
                
                if missing_fields:
                    self.log_result(
                        "Backend Delete API - Response Structure", 
                        False, 
                        f"Missing fields in response: {missing_fields}",
                        {"response": data}
                    )
                    return False
                
                # Check if user was actually deleted
                if deleted_counts.get("users", 0) > 0:
                    self.log_result(
                        "Backend Delete API - User Deletion", 
                        True, 
                        "User successfully deleted from database",
                        {"deleted_counts": deleted_counts}
                    )
                else:
                    self.log_result(
                        "Backend Delete API - User Deletion", 
                        False, 
                        "User was not deleted from database",
                        {"deleted_counts": deleted_counts}
                    )
                    return False
                
                # Verify user can no longer login
                login_data = {"email": self.test_user_email, "password": self.test_user_password}
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
                
                if login_response.status_code == 401:
                    self.log_result(
                        "Backend Delete API - Login Verification", 
                        True, 
                        "Deleted user cannot login (expected behavior)",
                        {"login_status": login_response.status_code}
                    )
                else:
                    self.log_result(
                        "Backend Delete API - Login Verification", 
                        False, 
                        "Deleted user can still login (unexpected)",
                        {"login_status": login_response.status_code, "response": login_response.text}
                    )
                    return False
                
                return True
                
            else:
                self.log_result(
                    "Backend Delete API", 
                    False, 
                    f"Delete request failed: {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result("Backend Delete API", False, f"Exception: {str(e)}")
            return False
    
    async def test_frontend_e2e_delete(self):
        """Test frontend delete account functionality with Playwright"""
        print(f"\n🎭 Testing Frontend E2E Delete Account")
        
        # First create a new test user since the previous one was deleted
        if not self.create_test_user():
            return False
        
        async with async_playwright() as p:
            try:
                # Launch browser
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Navigate to frontend
                await page.goto(FRONTEND_URL, timeout=30000)
                await page.wait_for_load_state('networkidle')
                
                self.log_result(
                    "Frontend E2E - Page Load", 
                    True, 
                    "Frontend page loaded successfully"
                )
                
                # Set authentication token in localStorage
                await page.evaluate(f"""
                    localStorage.setItem('token', '{self.test_user_token}');
                    localStorage.setItem('user', JSON.stringify({json.dumps(self.test_user_data)}));
                """)
                
                # Navigate to settings page
                await page.goto(f"{FRONTEND_URL}/settings", timeout=30000)
                await page.wait_for_load_state('networkidle')
                
                # Wait for settings page to load
                try:
                    await page.wait_for_selector('[data-testid="settings-title"]', timeout=10000)
                    self.log_result(
                        "Frontend E2E - Settings Page", 
                        True, 
                        "Settings page loaded successfully"
                    )
                except:
                    self.log_result(
                        "Frontend E2E - Settings Page", 
                        False, 
                        "Settings page did not load properly"
                    )
                    await browser.close()
                    return False
                
                # Find the delete account button
                delete_button = await page.query_selector('[data-testid="delete-account-btn"]')
                if not delete_button:
                    self.log_result(
                        "Frontend E2E - Delete Button", 
                        False, 
                        "Delete account button not found"
                    )
                    await browser.close()
                    return False
                
                self.log_result(
                    "Frontend E2E - Delete Button", 
                    True, 
                    "Delete account button found"
                )
                
                # Check if button is clickable
                is_enabled = await delete_button.is_enabled()
                if not is_enabled:
                    self.log_result(
                        "Frontend E2E - Button State", 
                        False, 
                        "Delete button is disabled"
                    )
                    await browser.close()
                    return False
                
                self.log_result(
                    "Frontend E2E - Button State", 
                    True, 
                    "Delete button is enabled and clickable"
                )
                
                # Set up dialog handlers for confirmations
                dialog_count = 0
                
                async def handle_dialog(dialog):
                    nonlocal dialog_count
                    dialog_count += 1
                    print(f"   Dialog {dialog_count}: {dialog.message[:100]}...")
                    await dialog.accept()  # Accept both confirmations
                
                page.on("dialog", handle_dialog)
                
                # Click the delete button
                await delete_button.click()
                
                # Wait a moment for dialogs to appear and be handled
                await page.wait_for_timeout(2000)
                
                if dialog_count >= 2:
                    self.log_result(
                        "Frontend E2E - Confirmation Dialogs", 
                        True, 
                        f"Both confirmation dialogs appeared ({dialog_count} dialogs)"
                    )
                else:
                    self.log_result(
                        "Frontend E2E - Confirmation Dialogs", 
                        False, 
                        f"Expected 2 dialogs, got {dialog_count}"
                    )
                    await browser.close()
                    return False
                
                # Wait for redirect to home page (account deletion should redirect)
                try:
                    await page.wait_for_url(FRONTEND_URL, timeout=10000)
                    self.log_result(
                        "Frontend E2E - Redirect", 
                        True, 
                        "Successfully redirected to home page after deletion"
                    )
                except:
                    # Check if we're still on settings page or somewhere else
                    current_url = page.url
                    self.log_result(
                        "Frontend E2E - Redirect", 
                        False, 
                        f"Did not redirect to home page, current URL: {current_url}"
                    )
                
                # Verify localStorage is cleared
                token_after = await page.evaluate("localStorage.getItem('token')")
                user_after = await page.evaluate("localStorage.getItem('user')")
                
                if not token_after and not user_after:
                    self.log_result(
                        "Frontend E2E - LocalStorage Cleanup", 
                        True, 
                        "LocalStorage cleared successfully"
                    )
                else:
                    self.log_result(
                        "Frontend E2E - LocalStorage Cleanup", 
                        False, 
                        f"LocalStorage not cleared properly: token={bool(token_after)}, user={bool(user_after)}"
                    )
                
                await browser.close()
                return True
                
            except Exception as e:
                self.log_result("Frontend E2E Delete", False, f"Exception: {str(e)}")
                try:
                    await browser.close()
                except:
                    pass
                return False
    
    def test_backend_api_validation(self):
        """Test backend API validation and error handling"""
        print(f"\n🔍 Testing Backend API Validation")
        
        try:
            # Test with missing email
            response = requests.post(f"{BACKEND_URL}/auth/delete-account", json={}, timeout=30)
            if response.status_code == 400:
                self.log_result(
                    "Backend API - Missing Email Validation", 
                    True, 
                    "Correctly rejected request with missing email"
                )
            else:
                self.log_result(
                    "Backend API - Missing Email Validation", 
                    False, 
                    f"Expected 400, got {response.status_code}"
                )
            
            # Test with non-existent email
            fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@example.com"
            response = requests.post(f"{BACKEND_URL}/auth/delete-account", json={"email": fake_email}, timeout=30)
            if response.status_code == 404:
                self.log_result(
                    "Backend API - Non-existent User", 
                    True, 
                    "Correctly returned 404 for non-existent user"
                )
            else:
                self.log_result(
                    "Backend API - Non-existent User", 
                    False, 
                    f"Expected 404, got {response.status_code}"
                )
            
            return True
            
        except Exception as e:
            self.log_result("Backend API Validation", False, f"Exception: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all delete account tests"""
        print("🚀 Starting Delete Account Functionality Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Frontend URL: {FRONTEND_URL}")
        print(f"Test User Email: {self.test_user_email}")
        
        # Test 1: Create test user
        if not self.create_test_user():
            print("❌ Cannot proceed without test user")
            return False
        
        # Test 2: Backend API validation
        self.test_backend_api_validation()
        
        # Test 3: Backend delete endpoint
        backend_success = self.test_backend_delete_endpoint()
        
        # Test 4: Frontend E2E delete (creates new user internally)
        frontend_success = await self.test_frontend_e2e_delete()
        
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
    tester = DeleteAccountTester()
    success = await tester.run_all_tests()
    
    # Save detailed results
    with open('/app/delete_account_test_results.json', 'w') as f:
        json.dump(tester.test_results, f, indent=2)
    
    print(f"\n📝 Detailed results saved to: /app/delete_account_test_results.json")
    
    if success:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print("\n💥 Some tests failed!")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)