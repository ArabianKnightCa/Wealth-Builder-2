import requests
import json
from datetime import datetime

class Phase2Tester:
    def __init__(self, base_url="https://family-keeper-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_pin = "123456"
        self.family_id = None
        self.share_token = None
        self.share_id = None

    def test_phase2_flow(self):
        """Test the exact flow described in the review request"""
        print("🚀 Testing Phase 2 Features - OurCircle App")
        print("="*60)
        
        # Step 1: Login
        print("\n1. Login with PIN...")
        response = requests.post(f"{self.api_url}/auth/verify", json={"pin": self.test_pin})
        if response.status_code == 200:
            print("✅ Login successful")
        else:
            print(f"❌ Login failed: {response.status_code}")
            return
        
        # Step 2: Get families
        print("\n2. Getting families...")
        response = requests.get(f"{self.api_url}/families")
        if response.status_code == 200:
            families = response.json().get("families", [])
            if families:
                self.family_id = families[0]["id"]
                print(f"✅ Found {len(families)} families, using family_id: {self.family_id}")
            else:
                print("❌ No families found, creating one...")
                # Create a test family
                family_data = {
                    "family_name": "Test Family for Phase 2",
                    "family_notes": "Testing QR sharing"
                }
                response = requests.post(f"{self.api_url}/families", json=family_data)
                if response.status_code == 200:
                    self.family_id = response.json()["id"]
                    print(f"✅ Created family with ID: {self.family_id}")
                else:
                    print(f"❌ Failed to create family: {response.status_code}")
                    return
        else:
            print(f"❌ Failed to get families: {response.status_code}")
            return
        
        # Step 3: Create share link for family
        print("\n3. Creating share link for family...")
        share_data = {
            "entity_type": "family",
            "entity_id": self.family_id,
            "expires_days": 7
        }
        response = requests.post(f"{self.api_url}/share/create", json=share_data)
        if response.status_code == 200:
            result = response.json()
            self.share_token = result["share_token"]
            self.share_id = result["share_id"]
            print(f"✅ Share link created:")
            print(f"   Share Token: {self.share_token}")
            print(f"   Share ID: {self.share_id}")
            print(f"   Expires: {result.get('expires_at')}")
        else:
            print(f"❌ Failed to create share link: {response.status_code}")
            print(f"   Error: {response.text}")
            return
        
        # Step 4: Verify share link works
        print("\n4. Verifying share link works...")
        response = requests.get(f"{self.api_url}/share/{self.share_token}")
        if response.status_code == 200:
            shared_data = response.json()
            print(f"✅ Share link verified:")
            print(f"   Entity Type: {shared_data['entity_type']}")
            print(f"   Entity Name: {shared_data['entity']['family_name']}")
            print(f"   Shared At: {shared_data['shared_at']}")
            if 'children' in shared_data['entity']:
                print(f"   Children Count: {len(shared_data['entity']['children'])}")
        else:
            print(f"❌ Failed to verify share link: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Step 5: Get QR code
        print("\n5. Getting QR code...")
        response = requests.get(f"{self.api_url}/share/{self.share_token}/qr-base64")
        if response.status_code == 200:
            qr_data = response.json()
            print(f"✅ QR code generated:")
            print(f"   Share URL: {qr_data['share_url']}")
            print(f"   QR Base64 length: {len(qr_data['qr_base64'])} characters")
            print(f"   QR starts with: {qr_data['qr_base64'][:50]}...")
        else:
            print(f"❌ Failed to get QR code: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Step 6: Check upcoming birthdays
        print("\n6. Checking upcoming birthdays...")
        response = requests.get(f"{self.api_url}/birthdays/upcoming?days=30")
        if response.status_code == 200:
            birthday_data = response.json()
            birthdays = birthday_data.get("upcoming_birthdays", [])
            print(f"✅ Birthday check successful:")
            print(f"   Upcoming birthdays (30 days): {len(birthdays)}")
            print(f"   Total checked: {birthday_data.get('total', 0)}")
            for birthday in birthdays[:3]:  # Show first 3
                print(f"   - {birthday['name']}: {birthday['days_until']} days")
        else:
            print(f"❌ Failed to check birthdays: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Test birthday settings
        print("\n6b. Testing birthday reminder settings...")
        # Get current settings
        response = requests.get(f"{self.api_url}/settings/birthday-reminders")
        if response.status_code == 200:
            settings = response.json()
            print(f"✅ Current birthday settings:")
            print(f"   Enabled: {settings.get('enabled')}")
            print(f"   Reminder days: {settings.get('reminder_days')}")
            print(f"   Show gift hints: {settings.get('show_gift_hints')}")
        
        # Set new settings
        new_settings = {
            "enabled": True,
            "reminder_days": [7, 1],
            "show_gift_hints": True
        }
        response = requests.post(f"{self.api_url}/settings/birthday-reminders", json=new_settings)
        if response.status_code == 200:
            print("✅ Birthday settings updated successfully")
        else:
            print(f"❌ Failed to update birthday settings: {response.status_code}")
        
        # Step 7: Revoke share link
        print("\n7. Revoking share link...")
        response = requests.delete(f"{self.api_url}/share/{self.share_id}")
        if response.status_code == 200:
            print("✅ Share link revoked successfully")
            
            # Verify it's actually revoked
            print("   Verifying revocation...")
            response = requests.get(f"{self.api_url}/share/{self.share_token}")
            if response.status_code == 404:
                print("✅ Share link properly revoked (404 as expected)")
            else:
                print(f"❌ Share link still accessible: {response.status_code}")
        else:
            print(f"❌ Failed to revoke share link: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Additional test: List my shares
        print("\n8. Listing my shares...")
        response = requests.get(f"{self.api_url}/my-shares")
        if response.status_code == 200:
            shares_data = response.json()
            shares = shares_data.get("shares", [])
            print(f"✅ My shares listed:")
            print(f"   Active shares: {len(shares)}")
            for share in shares:
                print(f"   - {share['entity_type']}: {share.get('entity_name', 'Unknown')} (views: {share.get('views', 0)})")
        else:
            print(f"❌ Failed to list shares: {response.status_code}")
        
        print("\n" + "="*60)
        print("🎉 Phase 2 Testing Complete!")

if __name__ == "__main__":
    tester = Phase2Tester()
    tester.test_phase2_flow()