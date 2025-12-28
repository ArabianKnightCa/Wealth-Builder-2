import requests
import sys
import json
from datetime import datetime
import uuid

class OurCircleAPITester:
    def __init__(self, base_url="https://family-keeper-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_pin = "123456"
        self.test_family_id = None
        self.test_child_id = None
        self.test_event_id = None
        self.test_share_id = None
        self.test_share_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n" + "="*50)
        print("TESTING AUTHENTICATION FLOW")
        print("="*50)
        
        # Check if PIN exists (should be false initially)
        success, response = self.run_test(
            "Check PIN Status",
            "GET",
            "auth/check",
            200
        )
        
        # Setup PIN
        success, response = self.run_test(
            "Setup PIN",
            "POST",
            "auth/setup",
            200,
            data={"pin": self.test_pin}
        )
        
        # Verify PIN
        success, response = self.run_test(
            "Verify PIN",
            "POST",
            "auth/verify",
            200,
            data={"pin": self.test_pin}
        )
        
        # Test invalid PIN
        success, response = self.run_test(
            "Invalid PIN",
            "POST",
            "auth/verify",
            401,
            data={"pin": "000000"}
        )
        
        # Change PIN
        success, response = self.run_test(
            "Change PIN",
            "POST",
            "auth/change-pin",
            200,
            data={"old_pin": self.test_pin, "new_pin": "654321"}
        )
        
        # Verify new PIN
        success, response = self.run_test(
            "Verify New PIN",
            "POST",
            "auth/verify",
            200,
            data={"pin": "654321"}
        )
        
        # Change back to original PIN for other tests
        self.run_test(
            "Change PIN Back",
            "POST",
            "auth/change-pin",
            200,
            data={"old_pin": "654321", "new_pin": self.test_pin}
        )

    def test_theme_settings(self):
        """Test theme settings"""
        print("\n" + "="*50)
        print("TESTING THEME SETTINGS")
        print("="*50)
        
        # Get current theme
        success, response = self.run_test(
            "Get Current Theme",
            "GET",
            "settings/theme",
            200
        )
        
        # Set theme
        success, response = self.run_test(
            "Set Theme",
            "POST",
            "settings/theme",
            200,
            data={"theme": "theme_2_ocean_breeze"}
        )
        
        # Verify theme was set
        success, response = self.run_test(
            "Verify Theme Set",
            "GET",
            "settings/theme",
            200
        )
        if success and response.get("theme") == "theme_2_ocean_breeze":
            print("✅ Theme correctly updated")
        else:
            print("❌ Theme not updated correctly")

    def test_family_crud(self):
        """Test family CRUD operations"""
        print("\n" + "="*50)
        print("TESTING FAMILY CRUD")
        print("="*50)
        
        # Get families (should be empty initially)
        success, response = self.run_test(
            "Get Families (Empty)",
            "GET",
            "families",
            200
        )
        
        # Create family
        family_data = {
            "family_name": "Test Family",
            "family_photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "family_notes": "This is a test family"
        }
        success, response = self.run_test(
            "Create Family",
            "POST",
            "families",
            200,
            data=family_data
        )
        
        if success and response.get("id"):
            self.test_family_id = response["id"]
            print(f"✅ Family created with ID: {self.test_family_id}")
        
        # Get single family
        if self.test_family_id:
            success, response = self.run_test(
                "Get Single Family",
                "GET",
                f"families/{self.test_family_id}",
                200
            )
        
        # Update family
        if self.test_family_id:
            update_data = {
                "family_name": "Updated Test Family",
                "family_notes": "Updated notes"
            }
            success, response = self.run_test(
                "Update Family",
                "PUT",
                f"families/{self.test_family_id}",
                200,
                data=update_data
            )
        
        # Archive family
        if self.test_family_id:
            success, response = self.run_test(
                "Archive Family",
                "PUT",
                f"families/{self.test_family_id}",
                200,
                data={"archived": True}
            )
        
        # Get families including archived
        success, response = self.run_test(
            "Get Families (Including Archived)",
            "GET",
            "families?include_archived=true",
            200
        )
        
        # Restore family
        if self.test_family_id:
            success, response = self.run_test(
                "Restore Family",
                "PUT",
                f"families/{self.test_family_id}",
                200,
                data={"archived": False}
            )

    def test_children_crud(self):
        """Test children CRUD operations"""
        print("\n" + "="*50)
        print("TESTING CHILDREN CRUD")
        print("="*50)
        
        if not self.test_family_id:
            print("❌ No family ID available for child tests")
            return
        
        # Get children (should be empty initially)
        success, response = self.run_test(
            "Get Children (Empty)",
            "GET",
            f"families/{self.test_family_id}/children",
            200
        )
        
        # Create child
        child_data = {
            "family_id": self.test_family_id,
            "identity": {
                "full_name": "Test Child",
                "nicknames": ["Testy", "TC"],
                "profile_photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                "birthday": "2015-05-15",
                "place_of_birth": "Test City",
                "languages": ["English", "Spanish"],
                "pronouns": "they/them"
            },
            "school": {
                "grade": "3rd Grade",
                "school_name": "Test Elementary",
                "favorite_teachers": ["Ms. Smith"],
                "favorite_subject": "Math",
                "least_favorite_subject": "History"
            },
            "favorites": {
                "favorite_food": "Pizza",
                "favorite_color": "Blue",
                "favorite_animal": "Dog"
            },
            "personality": {
                "likes": ["Reading", "Playing"],
                "strengths": ["Creative", "Kind"],
                "primary_love_language": "Quality Time"
            }
        }
        
        success, response = self.run_test(
            "Create Child",
            "POST",
            "children",
            200,
            data=child_data
        )
        
        if success and response.get("id"):
            self.test_child_id = response["id"]
            print(f"✅ Child created with ID: {self.test_child_id}")
        
        # Get single child
        if self.test_child_id:
            success, response = self.run_test(
                "Get Single Child",
                "GET",
                f"children/{self.test_child_id}",
                200
            )
        
        # Update child
        if self.test_child_id:
            update_data = {
                "identity": {
                    "full_name": "Updated Test Child",
                    "nicknames": ["Updated"],
                    "birthday": "2015-05-15",
                    "pronouns": "she/her"
                }
            }
            success, response = self.run_test(
                "Update Child",
                "PUT",
                f"children/{self.test_child_id}",
                200,
                data=update_data
            )
        
        # Get children after creation
        success, response = self.run_test(
            "Get Children (After Creation)",
            "GET",
            f"families/{self.test_family_id}/children",
            200
        )

    def test_timeline_crud(self):
        """Test timeline CRUD operations"""
        print("\n" + "="*50)
        print("TESTING TIMELINE CRUD")
        print("="*50)
        
        if not self.test_child_id:
            print("❌ No child ID available for timeline tests")
            return
        
        # Get timeline (should be empty initially)
        success, response = self.run_test(
            "Get Timeline (Empty)",
            "GET",
            f"children/{self.test_child_id}/timeline",
            200
        )
        
        # Create timeline event
        event_data = {
            "child_id": self.test_child_id,
            "title": "First Day of School",
            "description": "Started 3rd grade today!",
            "event_date": "2024-09-01",
            "event_type": "milestone",
            "photo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            "tags": ["school", "milestone"]
        }
        
        success, response = self.run_test(
            "Create Timeline Event",
            "POST",
            "timeline",
            200,
            data=event_data
        )
        
        if success and response.get("id"):
            self.test_event_id = response["id"]
            print(f"✅ Timeline event created with ID: {self.test_event_id}")
        
        # Update timeline event
        if self.test_event_id:
            update_data = {
                "title": "Updated First Day",
                "description": "Updated description"
            }
            success, response = self.run_test(
                "Update Timeline Event",
                "PUT",
                f"timeline/{self.test_event_id}",
                200,
                data=update_data
            )
        
        # Get timeline after creation
        success, response = self.run_test(
            "Get Timeline (After Creation)",
            "GET",
            f"children/{self.test_child_id}/timeline",
            200
        )

    def test_qr_profile_sharing(self):
        """Test QR Profile Sharing APIs"""
        print("\n" + "="*50)
        print("TESTING QR PROFILE SHARING")
        print("="*50)
        
        if not self.test_family_id:
            print("❌ No family ID available for QR sharing tests")
            return
        
        # Create share link for family
        share_data = {
            "entity_type": "family",
            "entity_id": self.test_family_id,
            "expires_days": 7
        }
        success, response = self.run_test(
            "Create Share Link (Family)",
            "POST",
            "share/create",
            200,
            data=share_data
        )
        
        if success and response.get("share_token"):
            self.test_share_token = response["share_token"]
            self.test_share_id = response["share_id"]
            print(f"✅ Share link created with token: {self.test_share_token}")
        
        # Get shared profile
        if self.test_share_token:
            success, response = self.run_test(
                "Get Shared Profile",
                "GET",
                f"share/{self.test_share_token}",
                200
            )
            if success and response.get("entity_type") == "family":
                print("✅ Shared profile retrieved successfully")
        
        # Get QR code base64
        if self.test_share_token:
            success, response = self.run_test(
                "Get QR Code Base64",
                "GET",
                f"share/{self.test_share_token}/qr-base64",
                200
            )
            if success and response.get("qr_base64"):
                print("✅ QR code generated successfully")
        
        # List my shares
        success, response = self.run_test(
            "List My Shares",
            "GET",
            "my-shares",
            200
        )
        if success and isinstance(response.get("shares"), list):
            print(f"✅ Found {len(response['shares'])} active shares")
        
        # Create share link for child (if available)
        if self.test_child_id:
            child_share_data = {
                "entity_type": "child",
                "entity_id": self.test_child_id,
                "expires_days": 3
            }
            success, response = self.run_test(
                "Create Share Link (Child)",
                "POST",
                "share/create",
                200,
                data=child_share_data
            )
            if success and response.get("share_token"):
                print(f"✅ Child share link created")
        
        # Test invalid entity type
        invalid_share_data = {
            "entity_type": "invalid",
            "entity_id": "test-id",
            "expires_days": 7
        }
        success, response = self.run_test(
            "Create Share Link (Invalid Type)",
            "POST",
            "share/create",
            400,
            data=invalid_share_data
        )
        
        # Test non-existent entity
        nonexistent_share_data = {
            "entity_type": "family",
            "entity_id": "non-existent-id",
            "expires_days": 7
        }
        success, response = self.run_test(
            "Create Share Link (Non-existent Entity)",
            "POST",
            "share/create",
            404,
            data=nonexistent_share_data
        )

    def test_birthday_reminders(self):
        """Test Birthday Reminders APIs"""
        print("\n" + "="*50)
        print("TESTING BIRTHDAY REMINDERS")
        print("="*50)
        
        # Get upcoming birthdays (default 30 days)
        success, response = self.run_test(
            "Get Upcoming Birthdays (30 days)",
            "GET",
            "birthdays/upcoming",
            200
        )
        if success:
            birthdays = response.get("upcoming_birthdays", [])
            print(f"✅ Found {len(birthdays)} upcoming birthdays in next 30 days")
        
        # Get upcoming birthdays (7 days)
        success, response = self.run_test(
            "Get Upcoming Birthdays (7 days)",
            "GET",
            "birthdays/upcoming?days=7",
            200
        )
        if success:
            birthdays = response.get("upcoming_birthdays", [])
            print(f"✅ Found {len(birthdays)} upcoming birthdays in next 7 days")
        
        # Get birthday reminder settings
        success, response = self.run_test(
            "Get Birthday Reminder Settings",
            "GET",
            "settings/birthday-reminders",
            200
        )
        if success:
            enabled = response.get("enabled", False)
            reminder_days = response.get("reminder_days", [])
            show_gift_hints = response.get("show_gift_hints", False)
            print(f"✅ Birthday settings: enabled={enabled}, days={reminder_days}, hints={show_gift_hints}")
        
        # Set birthday reminder settings
        settings_data = {
            "enabled": True,
            "reminder_days": [7, 1],
            "show_gift_hints": True
        }
        success, response = self.run_test(
            "Set Birthday Reminder Settings",
            "POST",
            "settings/birthday-reminders",
            200,
            data=settings_data
        )
        
        # Verify settings were updated
        success, response = self.run_test(
            "Verify Birthday Settings Updated",
            "GET",
            "settings/birthday-reminders",
            200
        )
        if success:
            if (response.get("enabled") == True and 
                response.get("reminder_days") == [7, 1] and 
                response.get("show_gift_hints") == True):
                print("✅ Birthday reminder settings updated correctly")
            else:
                print("❌ Birthday reminder settings not updated correctly")
        
        # Test different reminder settings
        alt_settings_data = {
            "enabled": False,
            "reminder_days": [14, 7, 3, 1],
            "show_gift_hints": False
        }
        success, response = self.run_test(
            "Set Alternative Birthday Settings",
            "POST",
            "settings/birthday-reminders",
            200,
            data=alt_settings_data
        )

    def test_cleanup(self):
        """Clean up test data"""
        print("\n" + "="*50)
        print("CLEANUP TEST DATA")
        print("="*50)
        
        # Delete timeline event
        if self.test_event_id:
            success, response = self.run_test(
                "Delete Timeline Event",
                "DELETE",
                f"timeline/{self.test_event_id}",
                200
            )
        
        # Delete child
        if self.test_child_id:
            success, response = self.run_test(
                "Delete Child",
                "DELETE",
                f"children/{self.test_child_id}",
                200
            )
        
        # Delete family
        if self.test_family_id:
            success, response = self.run_test(
                "Delete Family",
                "DELETE",
                f"families/{self.test_family_id}",
                200
            )

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting OurCircle API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        
        try:
            self.test_auth_flow()
            self.test_theme_settings()
            self.test_family_crud()
            self.test_children_crud()
            self.test_timeline_crud()
            self.test_cleanup()
        except Exception as e:
            print(f"\n❌ Test suite failed with error: {str(e)}")
        
        # Print results
        print("\n" + "="*50)
        print("TEST RESULTS")
        print("="*50)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = OurCircleAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())