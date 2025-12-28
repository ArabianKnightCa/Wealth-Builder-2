import requests
import json
from datetime import datetime, timedelta

class BirthdayTester:
    def __init__(self, base_url="https://family-keeper-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_pin = "123456"
        self.family_id = None
        self.child_id = None

    def test_birthday_functionality(self):
        """Test birthday functionality with a child that has an upcoming birthday"""
        print("🎂 Testing Birthday Reminder Functionality")
        print("="*50)
        
        # Login
        response = requests.post(f"{self.api_url}/auth/verify", json={"pin": self.test_pin})
        if response.status_code != 200:
            print("❌ Login failed")
            return
        
        # Get or create family
        response = requests.get(f"{self.api_url}/families")
        families = response.json().get("families", [])
        if families:
            self.family_id = families[0]["id"]
            print(f"✅ Using existing family: {self.family_id}")
        else:
            family_data = {"family_name": "Birthday Test Family"}
            response = requests.post(f"{self.api_url}/families", json=family_data)
            self.family_id = response.json()["id"]
            print(f"✅ Created family: {self.family_id}")
        
        # Create child with upcoming birthday (next week)
        next_week = datetime.now() + timedelta(days=7)
        birthday_str = next_week.strftime("%Y-%m-%d")
        
        child_data = {
            "family_id": self.family_id,
            "identity": {
                "full_name": "Birthday Child",
                "nicknames": ["Birthday Kid"],
                "birthday": birthday_str,
                "place_of_birth": "Birthday City"
            },
            "favorites": {
                "favorite_color": "Rainbow",
                "favorite_animal": "Unicorn",
                "favorite_game": "Hide and Seek",
                "favorite_book": "The Birthday Book"
            }
        }
        
        response = requests.post(f"{self.api_url}/children", json=child_data)
        if response.status_code == 200:
            self.child_id = response.json()["id"]
            print(f"✅ Created child with birthday {birthday_str}: {self.child_id}")
        else:
            print(f"❌ Failed to create child: {response.status_code}")
            return
        
        # Test upcoming birthdays
        print("\n🔍 Testing upcoming birthdays...")
        response = requests.get(f"{self.api_url}/birthdays/upcoming?days=30")
        if response.status_code == 200:
            birthday_data = response.json()
            birthdays = birthday_data.get("upcoming_birthdays", [])
            print(f"✅ Found {len(birthdays)} upcoming birthdays")
            
            for birthday in birthdays:
                print(f"   🎂 {birthday['name']} ({birthday.get('nickname', 'No nickname')})")
                print(f"      Birthday: {birthday['birthday']}")
                print(f"      Days until: {birthday['days_until']}")
                print(f"      Turning age: {birthday['turning_age']}")
                print(f"      Gift hints: {', '.join(birthday['gift_hints']) if birthday['gift_hints'] else 'None'}")
                print()
        else:
            print(f"❌ Failed to get birthdays: {response.status_code}")
        
        # Test with different day ranges
        for days in [7, 14, 30]:
            response = requests.get(f"{self.api_url}/birthdays/upcoming?days={days}")
            if response.status_code == 200:
                count = len(response.json().get("upcoming_birthdays", []))
                print(f"✅ Birthdays in next {days} days: {count}")
        
        # Cleanup
        print("\n🧹 Cleaning up...")
        if self.child_id:
            requests.delete(f"{self.api_url}/children/{self.child_id}")
            print("✅ Child deleted")

if __name__ == "__main__":
    tester = BirthdayTester()
    tester.test_birthday_functionality()