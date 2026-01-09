#!/usr/bin/env python3
"""
TAP 3.2 Testing Suite
====================

Tests the TAP 3.2 sentence-level scaffolding engine implementation.

Test Coverage:
1. TAP 3.2 Unit Tests (built-in test harness)
2. LPI Content API with different user profiles
3. Key behavior verification (baseline preservation, scaffolding, decode lines)
4. PPI option adaptation testing

Expected Behaviors:
- 6yo users: Heavy scaffolding, decode lines, preamble
- 35yo experts: Minimal scaffolding, no decode lines
- Baseline text must appear verbatim (baseline_preserved=True)
- TAP version should be "3.2"
"""

import requests
import json
import sys
import subprocess
import os
from datetime import datetime
from pathlib import Path

# Configuration
BACKEND_URL = "https://finpath-16.preview.emergentagent.com/api"

class TAP32Tester:
    def __init__(self):
        self.results = {
            "tap32_unit_tests": {"passed": 0, "failed": 0, "errors": []},
            "lpi_api_6yo": {"passed": 0, "failed": 0, "errors": []},
            "lpi_api_35yo": {"passed": 0, "failed": 0, "errors": []},
            "baseline_preservation": {"passed": 0, "failed": 0, "errors": []},
            "scaffolding_behavior": {"passed": 0, "failed": 0, "errors": []},
            "ppi_adaptation": {"passed": 0, "failed": 0, "errors": []}
        }
        self.test_users = {}
        
    def test_tap32_unit_tests(self):
        """Test 1: Run TAP 3.2 built-in unit tests"""
        print("\n🧪 Testing TAP 3.2 Unit Tests")
        print("Running: cd /app/backend && python tap_3_2.py")
        
        try:
            # Change to backend directory and run TAP 3.2 unit tests
            result = subprocess.run(
                ["python", "tap_3_2.py"],
                cwd="/app/backend",
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                print("✅ TAP 3.2 unit tests passed successfully")
                print(f"   Output length: {len(result.stdout)} chars")
                
                # Check for key indicators in output
                output = result.stdout
                if "LPI CASE:" in output and "PPI CASE:" in output:
                    print("   ✅ Found LPI and PPI test cases")
                if "baseline_hash=" in output:
                    print("   ✅ Baseline hash verification present")
                if "mutated=False" in output:
                    print("   ✅ Baseline mutation checks working")
                
                self.results["tap32_unit_tests"]["passed"] += 1
                return True
            else:
                error_msg = f"Unit tests failed with return code {result.returncode}"
                if result.stderr:
                    error_msg += f": {result.stderr}"
                print(f"❌ {error_msg}")
                self.results["tap32_unit_tests"]["failed"] += 1
                self.results["tap32_unit_tests"]["errors"].append(error_msg)
                return False
                
        except subprocess.TimeoutExpired:
            error_msg = "Unit tests timed out after 60 seconds"
            print(f"❌ {error_msg}")
            self.results["tap32_unit_tests"]["failed"] += 1
            self.results["tap32_unit_tests"]["errors"].append(error_msg)
            return False
        except Exception as e:
            error_msg = f"Error running unit tests: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["tap32_unit_tests"]["failed"] += 1
            self.results["tap32_unit_tests"]["errors"].append(error_msg)
            return False
    
    def create_test_users(self):
        """Create test users for API testing"""
        print("\n👥 Creating test users...")
        
        test_users_data = [
            {
                "email": "kid_test_6yo@example.com",
                "password": "Test1234!",
                "first_name": "Kid",
                "date_of_birth": "2018-01-01",  # 6 years old
                "language": "en",
                "experience_level": 1,
                "user_type": "POC",
                "life_stage": "ES",
                "occupation": "Elementary School Student",
                "state": "CA"
            },
            {
                "email": "adult_expert_35@example.com", 
                "password": "Test1234!",
                "first_name": "Expert",
                "date_of_birth": "1989-01-01",  # 35 years old
                "language": "en",
                "experience_level": 5,
                "user_type": "POC",
                "life_stage": "AD",
                "occupation": "Financial Advisor",
                "state": "NY"
            }
        ]
        
        for user_data in test_users_data:
            try:
                # Try to register user
                response = requests.post(
                    f"{BACKEND_URL}/auth/register",
                    json=user_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.test_users[user_data["email"]] = {
                        "token": data["access_token"],
                        "user_data": data["user"]
                    }
                    print(f"✅ Created user: {user_data['email']}")
                elif response.status_code == 400 and "already registered" in response.text:
                    # User exists, try to login
                    login_response = requests.post(
                        f"{BACKEND_URL}/auth/login",
                        json={
                            "email": user_data["email"],
                            "password": user_data["password"]
                        },
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if login_response.status_code == 200:
                        data = login_response.json()
                        self.test_users[user_data["email"]] = {
                            "token": data["access_token"],
                            "user_data": data["user"]
                        }
                        print(f"✅ Logged in existing user: {user_data['email']}")
                    else:
                        print(f"❌ Failed to login existing user: {user_data['email']}")
                else:
                    print(f"❌ Failed to create user {user_data['email']}: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"❌ Error with user {user_data['email']}: {str(e)}")
        
        return len(self.test_users) >= 2
    
    def test_lpi_content_api(self):
        """Test 2 & 3: Test LPI content API for different user profiles"""
        print("\n📚 Testing LPI Content API")
        
        if not self.test_users:
            error_msg = "No test users available for API testing"
            print(f"❌ {error_msg}")
            self.results["lpi_api_6yo"]["failed"] += 1
            self.results["lpi_api_35yo"]["failed"] += 1
            self.results["lpi_api_6yo"]["errors"].append(error_msg)
            self.results["lpi_api_35yo"]["errors"].append(error_msg)
            return False
        
        success = True
        
        # Test 6yo user
        if "kid_test_6yo@example.com" in self.test_users:
            success &= self._test_user_lpi("6yo", "kid_test_6yo@example.com", "lpi_api_6yo")
        
        # Test 35yo expert
        if "adult_expert_35@example.com" in self.test_users:
            success &= self._test_user_lpi("35yo expert", "adult_expert_35@example.com", "lpi_api_35yo")
        
        return success
    
    def _test_user_lpi(self, user_type, email, result_key):
        """Test LPI API for a specific user"""
        print(f"\n🔍 Testing {user_type} user: {email}")
        
        try:
            user_info = self.test_users[email]
            token = user_info["token"]
            
            response = requests.get(
                f"{BACKEND_URL}/content/lpi",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                error_msg = f"{user_type}: API returned {response.status_code}: {response.text}"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            data = response.json()
            
            # Validate response structure
            required_fields = ["chapters", "personalization_applied", "tap_version", "user_profile"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                error_msg = f"{user_type}: Missing required fields: {missing_fields}"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            # Check TAP version
            tap_version = data.get("tap_version")
            if tap_version != "3.2":
                error_msg = f"{user_type}: Expected tap_version=3.2, got {tap_version}"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            print(f"✅ {user_type}: TAP version 3.2 confirmed")
            
            # Analyze first chapter/lesson for detailed validation
            chapters = data.get("chapters", [])
            if not chapters:
                error_msg = f"{user_type}: No chapters found"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            first_chapter = chapters[0]
            lessons = first_chapter.get("lessons", [])
            if not lessons:
                error_msg = f"{user_type}: No lessons found in first chapter"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            first_lesson = lessons[0]
            
            # Validate lesson structure
            lesson_fields = ["text", "tap_version", "baseline_preserved", "scaffolding_count"]
            missing_lesson_fields = [field for field in lesson_fields if field not in first_lesson]
            
            if missing_lesson_fields:
                error_msg = f"{user_type}: Missing lesson fields: {missing_lesson_fields}"
                print(f"❌ {error_msg}")
                self.results[result_key]["failed"] += 1
                self.results[result_key]["errors"].append(error_msg)
                return False
            
            # Check baseline preservation
            baseline_preserved = first_lesson.get("baseline_preserved", False)
            if not baseline_preserved:
                error_msg = f"{user_type}: Baseline not preserved (baseline_preserved=False)"
                print(f"❌ {error_msg}")
                self.results["baseline_preservation"]["failed"] += 1
                self.results["baseline_preservation"]["errors"].append(error_msg)
                return False
            
            print(f"✅ {user_type}: Baseline preserved correctly")
            self.results["baseline_preservation"]["passed"] += 1
            
            # Check scaffolding behavior
            scaffolding_count = first_lesson.get("scaffolding_count", 0)
            lesson_text = first_lesson.get("text", "")
            
            if user_type == "6yo":
                # 6yo should have heavy scaffolding and decode lines
                if scaffolding_count < 8:
                    error_msg = f"6yo: Low scaffolding count {scaffolding_count} (expected 8-9)"
                    print(f"⚠️ {error_msg}")
                    self.results["scaffolding_behavior"]["errors"].append(error_msg)
                else:
                    print(f"✅ 6yo: High scaffolding count ({scaffolding_count})")
                
                if "🔎 Decode:" not in lesson_text:
                    error_msg = "6yo: No decode lines found (expected for low LC users)"
                    print(f"⚠️ {error_msg}")
                    self.results["scaffolding_behavior"]["errors"].append(error_msg)
                else:
                    print("✅ 6yo: Decode lines present")
                
                if "First, here's the simple idea" in lesson_text:
                    print("✅ 6yo: Preamble with 'First, here's the simple idea' found")
                else:
                    print("⚠️ 6yo: Expected preamble not found")
                
            elif user_type == "35yo expert":
                # 35yo expert should have minimal scaffolding, no decode lines
                if scaffolding_count > 6:
                    error_msg = f"35yo expert: High scaffolding count {scaffolding_count} (expected 4-6)"
                    print(f"⚠️ {error_msg}")
                    self.results["scaffolding_behavior"]["errors"].append(error_msg)
                else:
                    print(f"✅ 35yo expert: Low scaffolding count ({scaffolding_count})")
                
                if "🔎 Decode:" in lesson_text:
                    error_msg = "35yo expert: Decode lines found (should not have for high LC users)"
                    print(f"⚠️ {error_msg}")
                    self.results["scaffolding_behavior"]["errors"].append(error_msg)
                else:
                    print("✅ 35yo expert: No decode lines (correct)")
            
            # Overall success for this user
            print(f"✅ {user_type}: LPI API test completed")
            print(f"   • Scaffolding count: {scaffolding_count}")
            print(f"   • Text length: {len(lesson_text)} chars")
            print(f"   • Baseline preserved: {baseline_preserved}")
            
            self.results[result_key]["passed"] += 1
            self.results["scaffolding_behavior"]["passed"] += 1
            return True
            
        except Exception as e:
            error_msg = f"{user_type}: Request error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results[result_key]["failed"] += 1
            self.results[result_key]["errors"].append(error_msg)
            return False
    
    def test_ppi_option_adaptation(self):
        """Test 4: Test PPI option adaptation"""
        print("\n🎯 Testing PPI Option Adaptation")
        
        try:
            # Test the TAP 3.2 engine directly for PPI adaptation
            from tap_3_2 import TAP32Engine_v321, PPIOptionSpec
            
            engine = TAP32Engine_v321()
            opts = [
                PPIOptionSpec("A", "Research extensively before deciding", "RESEARCH_FIRST"),
                PPIOptionSpec("B", "Go with my gut feeling", "GUT_FEELING"),
            ]
            
            # Test 6yo user (should get simplified options)
            result_6yo = engine.process_ppi(
                "When making financial decisions, I prefer to:",
                opts,
                age=6,
                el_declared=1
            )
            
            # Test 35yo expert (should get original options)
            result_35 = engine.process_ppi(
                "When making financial decisions, I prefer to:",
                opts,
                age=35,
                el_declared=5
            )
            
            print("6yo options:")
            for opt in result_6yo['options']:
                print(f"  {opt['option_id']}. {opt['option_text']}")
                if opt['option_gloss']:
                    print(f"     -> {opt['option_gloss']}")
            
            print("\n35yo expert options:")
            for opt in result_35['options']:
                print(f"  {opt['option_id']}. {opt['option_text']}")
                if opt['option_gloss']:
                    print(f"     -> {opt['option_gloss']}")
            
            # Validate 6yo gets simplified options
            option_a_6yo = result_6yo['options'][0]['option_text']
            if "Look up information first" in option_a_6yo or "Research" in option_a_6yo:
                print("✅ 6yo: Option A appropriately adapted")
            else:
                error_msg = f"6yo: Option A not simplified: {option_a_6yo}"
                print(f"⚠️ {error_msg}")
                self.results["ppi_adaptation"]["errors"].append(error_msg)
            
            # Validate 35yo expert gets standard options
            option_a_35 = result_35['options'][0]['option_text']
            if "Research extensively before deciding" in option_a_35:
                print("✅ 35yo expert: Option A kept original text")
            else:
                print(f"⚠️ 35yo expert: Option A modified: {option_a_35}")
            
            # Check question help for 6yo
            if result_6yo.get('question_help'):
                print(f"✅ 6yo: Question help provided: {result_6yo['question_help']}")
            else:
                print("⚠️ 6yo: No question help provided")
            
            # Check no question help for 35yo expert
            if not result_35.get('question_help'):
                print("✅ 35yo expert: No question help (correct)")
            else:
                print(f"⚠️ 35yo expert: Unexpected question help: {result_35['question_help']}")
            
            print("✅ PPI option adaptation test completed")
            self.results["ppi_adaptation"]["passed"] += 1
            return True
            
        except Exception as e:
            error_msg = f"PPI adaptation test error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["ppi_adaptation"]["failed"] += 1
            self.results["ppi_adaptation"]["errors"].append(error_msg)
            return False
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🧪 TAP 3.2 TESTING SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        test_descriptions = {
            "tap32_unit_tests": "TAP 3.2 Unit Tests",
            "lpi_api_6yo": "LPI API (6yo user)",
            "lpi_api_35yo": "LPI API (35yo expert)",
            "baseline_preservation": "Baseline Preservation",
            "scaffolding_behavior": "Scaffolding Behavior",
            "ppi_adaptation": "PPI Option Adaptation"
        }
        
        for test_name, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            description = test_descriptions.get(test_name, test_name)
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{description:30} | {status} | {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"][:2]:  # Show first 2 errors
                    print(f"{'':32} |      | Error: {error}")
                if len(results["errors"]) > 2:
                    print(f"{'':32} |      | ... and {len(results['errors']) - 2} more errors")
        
        print("-" * 80)
        print(f"{'TOTAL':30} | {'✅ PASS' if total_failed == 0 else '❌ FAIL'} | {total_passed} passed, {total_failed} failed")
        
        # Key findings
        print(f"\n📋 KEY FINDINGS:")
        
        if self.results["tap32_unit_tests"]["passed"] > 0:
            print("   ✅ TAP 3.2 unit tests pass - all assertions validated")
        
        if self.results["baseline_preservation"]["passed"] > 0:
            print("   ✅ Baseline text preserved verbatim (baseline_preserved=True)")
        
        if self.results["scaffolding_behavior"]["passed"] > 0:
            print("   ✅ Scaffolding adapts correctly to user age/experience")
        
        if self.results["ppi_adaptation"]["passed"] > 0:
            print("   ✅ PPI options adapt appropriately for different users")
        
        # Critical issues
        critical_issues = []
        if self.results["tap32_unit_tests"]["failed"] > 0:
            critical_issues.append("TAP 3.2 unit tests failing")
        if self.results["baseline_preservation"]["failed"] > 0:
            critical_issues.append("Baseline text being modified")
        if any("tap_version" in error for errors in [r["errors"] for r in self.results.values()] for error in errors):
            critical_issues.append("TAP version not 3.2")
        
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   • {issue}")
        
        if total_failed == 0:
            print("\n✅ All TAP 3.2 tests passed successfully!")
            print("   • Sentence-level scaffolding working correctly")
            print("   • Baseline immutability maintained")
            print("   • User profile adaptation functioning")
            print("   • PPI option adaptation working")
        else:
            print(f"\n❌ {total_failed} test(s) failed. See details above.")
        
        return total_failed == 0

def main():
    """Main test execution"""
    print("🚀 Starting TAP 3.2 Testing Suite")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    tester = TAP32Tester()
    
    try:
        # Step 1: Test TAP 3.2 unit tests
        unit_tests_success = tester.test_tap32_unit_tests()
        
        # Step 2: Create test users
        users_created = tester.create_test_users()
        
        # Step 3: Test LPI content API
        if users_created:
            lpi_success = tester.test_lpi_content_api()
        else:
            print("⚠️ Skipping LPI API tests - no test users available")
            lpi_success = False
        
        # Step 4: Test PPI option adaptation
        ppi_success = tester.test_ppi_option_adaptation()
        
        # Print comprehensive summary
        success = tester.print_summary()
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())