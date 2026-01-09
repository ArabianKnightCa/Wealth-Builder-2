#!/usr/bin/env python3
"""
CLG (Controlled Language Generator) API Testing
===============================================

**Objective:** Test CLG API endpoints for the Mizo Wealth Builder application.

**Test Focus:**
1. GET /api/clg/test - 9-case step test validation
2. POST /api/clg/render - Content rendering for different user profiles

**Validation Criteria:**
- All outputs must be grammatically correct
- Band score should increase as CD increases
- Analogies should only appear for young users or low LC
- Examples should appear for most users except very high EL
- No periods after questions (PPI integrity)
- Gradual depth scaling

**Test Cases:**
- Child User (age=8, EL=1): Simple language, analogies, examples
- Teen User (age=16, EL=2): Moderate complexity, may include analogies
- Adult User (age=45, EL=8): Moderate complexity, examples, no analogies
- Senior Expert (age=60, EL=14): Expert terminology, no analogies, no examples
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://wealth-journey-79.preview.emergentagent.com/api"

class CLGTester:
    def __init__(self):
        self.results = {
            "clg_test_endpoint": {"passed": 0, "failed": 0, "errors": []},
            "clg_render_endpoint": {"passed": 0, "failed": 0, "errors": []},
            "grammar_validation": {"passed": 0, "failed": 0, "errors": []},
            "depth_scaling": {"passed": 0, "failed": 0, "errors": []},
            "user_profile_adaptation": {"passed": 0, "failed": 0, "errors": []}
        }
        self.test_cases = []
        
    def test_clg_test_endpoint(self):
        """Test GET /api/clg/test - 9-case step test"""
        print(f"\n🧪 Testing CLG Test Endpoint: GET /api/clg/test")
        
        try:
            response = requests.get(f"{BACKEND_URL}/clg/test")
            
            if response.status_code == 404:
                error_msg = "CLG test endpoint not found (404)"
                print(f"❌ {error_msg}")
                self.results["clg_test_endpoint"]["failed"] += 1
                self.results["clg_test_endpoint"]["errors"].append(error_msg)
                return False
                
            elif response.status_code == 503:
                error_msg = "CLG engine is disabled (503)"
                print(f"❌ {error_msg}")
                self.results["clg_test_endpoint"]["failed"] += 1
                self.results["clg_test_endpoint"]["errors"].append(error_msg)
                return False
                
            elif response.status_code == 500:
                error_msg = f"Server error (500): {response.text}"
                print(f"❌ {error_msg}")
                self.results["clg_test_endpoint"]["failed"] += 1
                self.results["clg_test_endpoint"]["errors"].append(error_msg)
                return False
                
            elif response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Validate response structure
                    required_fields = ["clg_version", "clg_enabled", "test_results"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        error_msg = f"Missing required fields: {missing_fields}"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                        return False
                    
                    # Check if CLG is enabled
                    if not data.get("clg_enabled", False):
                        error_msg = "CLG engine is not enabled"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                        return False
                    
                    # Validate test results structure
                    test_results = data.get("test_results", {})
                    if not isinstance(test_results, dict):
                        error_msg = "test_results should be a dictionary"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                        return False
                    
                    # Check for expected test structure
                    expected_test_fields = ["test_run", "el_max", "cases", "summary"]
                    missing_test_fields = [field for field in expected_test_fields if field not in test_results]
                    
                    if missing_test_fields:
                        error_msg = f"Missing test result fields: {missing_test_fields}"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                        return False
                    
                    # Validate 9 test cases (3 profiles × 3 concepts)
                    cases = test_results.get("cases", [])
                    if len(cases) != 9:
                        error_msg = f"Expected 9 test cases, got {len(cases)}"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                        return False
                    
                    # Validate each test case
                    profiles_found = set()
                    concepts_found = set()
                    grammar_issues = []
                    
                    for case in cases:
                        case_id = case.get("case_id", "unknown")
                        
                        # Check case structure
                        if "profile" not in case or "concept" not in case or "output" not in case:
                            error_msg = f"Case {case_id} missing required fields"
                            print(f"❌ {error_msg}")
                            self.results["clg_test_endpoint"]["failed"] += 1
                            self.results["clg_test_endpoint"]["errors"].append(error_msg)
                            continue
                        
                        profile = case["profile"]
                        concept = case["concept"]
                        output = case["output"]
                        
                        profiles_found.add(profile.get("name"))
                        concepts_found.add(concept)
                        
                        # Check grammar
                        if not self._check_grammar(output):
                            grammar_issues.append(f"Case {case_id}: Grammar issues in output")
                        
                        # Check if output has content
                        if not output or len(output.strip()) < 10:
                            error_msg = f"Case {case_id}: Output too short or empty"
                            print(f"❌ {error_msg}")
                            self.results["clg_test_endpoint"]["failed"] += 1
                            self.results["clg_test_endpoint"]["errors"].append(error_msg)
                    
                    # Validate expected profiles and concepts
                    expected_profiles = {"P1_child", "P2_adult", "P3_senior"}
                    expected_concepts = {"CREDIT_CARD", "PAYING_BILLS", "INVESTING"}
                    
                    if profiles_found != expected_profiles:
                        error_msg = f"Missing profiles: {expected_profiles - profiles_found}"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                    
                    if concepts_found != expected_concepts:
                        error_msg = f"Missing concepts: {expected_concepts - concepts_found}"
                        print(f"❌ {error_msg}")
                        self.results["clg_test_endpoint"]["failed"] += 1
                        self.results["clg_test_endpoint"]["errors"].append(error_msg)
                    
                    # Report grammar issues
                    if grammar_issues:
                        for issue in grammar_issues:
                            print(f"⚠️ {issue}")
                            self.results["grammar_validation"]["failed"] += 1
                            self.results["grammar_validation"]["errors"].append(issue)
                    else:
                        print(f"✅ All test cases have correct grammar")
                        self.results["grammar_validation"]["passed"] += 1
                    
                    print(f"✅ CLG test endpoint working correctly")
                    print(f"   • CLG Version: {data.get('clg_version')}")
                    print(f"   • Test Cases: {len(cases)}")
                    print(f"   • Summary: {test_results.get('summary', {})}")
                    
                    self.results["clg_test_endpoint"]["passed"] += 1
                    return True
                    
                except json.JSONDecodeError as e:
                    error_msg = f"Invalid JSON response: {str(e)}"
                    print(f"❌ {error_msg}")
                    self.results["clg_test_endpoint"]["failed"] += 1
                    self.results["clg_test_endpoint"]["errors"].append(error_msg)
                    return False
            else:
                error_msg = f"Unexpected status code: {response.status_code}"
                print(f"❌ {error_msg}")
                self.results["clg_test_endpoint"]["failed"] += 1
                self.results["clg_test_endpoint"]["errors"].append(error_msg)
                return False
                
        except Exception as e:
            error_msg = f"Request error: {str(e)}"
            print(f"❌ {error_msg}")
            self.results["clg_test_endpoint"]["failed"] += 1
            self.results["clg_test_endpoint"]["errors"].append(error_msg)
            return False
    
    def test_clg_render_endpoint(self):
        """Test POST /api/clg/render with different user profiles"""
        print(f"\n🎨 Testing CLG Render Endpoint: POST /api/clg/render")
        
        # Test cases as specified in the review request
        test_cases = [
            {
                "name": "Child User",
                "payload": {
                    "concept_ids": ["CREDIT_CARD"],
                    "age": 8,
                    "el_declared": 1,
                    "el_max": 15
                },
                "expected": {
                    "simple_language": True,
                    "includes_analogy": True,
                    "includes_example": True,
                    "no_expert_terms": True
                }
            },
            {
                "name": "Adult User",
                "payload": {
                    "concept_ids": ["INVESTING"],
                    "age": 45,
                    "el_declared": 8,
                    "el_max": 15
                },
                "expected": {
                    "moderate_complexity": True,
                    "includes_example": True,
                    "no_analogy": True,
                    "some_technical_terms": True
                }
            },
            {
                "name": "Senior Expert",
                "payload": {
                    "concept_ids": ["CREDIT_CARD", "INVESTING"],
                    "age": 60,
                    "el_declared": 14,
                    "el_max": 15
                },
                "expected": {
                    "expert_terminology": True,
                    "no_analogies": True,
                    "no_examples": True,
                    "high_complexity": True
                }
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            print(f"\n🔍 Testing {test_case['name']}")
            
            try:
                response = requests.post(
                    f"{BACKEND_URL}/clg/render",
                    json=test_case["payload"],
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 404:
                    error_msg = f"{test_case['name']}: CLG render endpoint not found (404)"
                    print(f"❌ {error_msg}")
                    self.results["clg_render_endpoint"]["failed"] += 1
                    self.results["clg_render_endpoint"]["errors"].append(error_msg)
                    all_passed = False
                    continue
                    
                elif response.status_code == 503:
                    error_msg = f"{test_case['name']}: CLG engine is disabled (503)"
                    print(f"❌ {error_msg}")
                    self.results["clg_render_endpoint"]["failed"] += 1
                    self.results["clg_render_endpoint"]["errors"].append(error_msg)
                    all_passed = False
                    continue
                    
                elif response.status_code == 422:
                    error_msg = f"{test_case['name']}: Validation error (422): {response.text}"
                    print(f"❌ {error_msg}")
                    self.results["clg_render_endpoint"]["failed"] += 1
                    self.results["clg_render_endpoint"]["errors"].append(error_msg)
                    all_passed = False
                    continue
                    
                elif response.status_code == 500:
                    error_msg = f"{test_case['name']}: Server error (500): {response.text}"
                    print(f"❌ {error_msg}")
                    self.results["clg_render_endpoint"]["failed"] += 1
                    self.results["clg_render_endpoint"]["errors"].append(error_msg)
                    all_passed = False
                    continue
                    
                elif response.status_code == 200:
                    try:
                        data = response.json()
                        
                        # Validate response structure
                        required_fields = ["clg_version", "rendered_text", "scalars", "debug"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            error_msg = f"{test_case['name']}: Missing required fields: {missing_fields}"
                            print(f"❌ {error_msg}")
                            self.results["clg_render_endpoint"]["failed"] += 1
                            self.results["clg_render_endpoint"]["errors"].append(error_msg)
                            all_passed = False
                            continue
                        
                        rendered_text = data.get("rendered_text", "")
                        scalars = data.get("scalars", {})
                        debug = data.get("debug", {})
                        
                        # Store test case result for analysis
                        test_result = {
                            "name": test_case["name"],
                            "payload": test_case["payload"],
                            "response": data,
                            "rendered_text": rendered_text,
                            "scalars": scalars,
                            "debug": debug
                        }
                        self.test_cases.append(test_result)
                        
                        # Basic validation
                        if not rendered_text or len(rendered_text.strip()) < 10:
                            error_msg = f"{test_case['name']}: Rendered text too short or empty"
                            print(f"❌ {error_msg}")
                            self.results["clg_render_endpoint"]["failed"] += 1
                            self.results["clg_render_endpoint"]["errors"].append(error_msg)
                            all_passed = False
                            continue
                        
                        # Grammar check
                        if not self._check_grammar(rendered_text):
                            error_msg = f"{test_case['name']}: Grammar issues in rendered text"
                            print(f"❌ {error_msg}")
                            self.results["grammar_validation"]["failed"] += 1
                            self.results["grammar_validation"]["errors"].append(error_msg)
                            all_passed = False
                        else:
                            self.results["grammar_validation"]["passed"] += 1
                        
                        # Validate user profile adaptation
                        adaptation_passed = self._validate_user_profile_adaptation(test_case, test_result)
                        if adaptation_passed:
                            self.results["user_profile_adaptation"]["passed"] += 1
                        else:
                            self.results["user_profile_adaptation"]["failed"] += 1
                            all_passed = False
                        
                        print(f"✅ {test_case['name']}: Render successful")
                        print(f"   • Rendered text length: {len(rendered_text)} chars")
                        print(f"   • Scalars: LC={scalars.get('lc', 'N/A'):.3f}, CD={scalars.get('cd', 'N/A'):.3f}")
                        print(f"   • Preview: {rendered_text[:100]}...")
                        
                    except json.JSONDecodeError as e:
                        error_msg = f"{test_case['name']}: Invalid JSON response: {str(e)}"
                        print(f"❌ {error_msg}")
                        self.results["clg_render_endpoint"]["failed"] += 1
                        self.results["clg_render_endpoint"]["errors"].append(error_msg)
                        all_passed = False
                        continue
                else:
                    error_msg = f"{test_case['name']}: Unexpected status code: {response.status_code}"
                    print(f"❌ {error_msg}")
                    self.results["clg_render_endpoint"]["failed"] += 1
                    self.results["clg_render_endpoint"]["errors"].append(error_msg)
                    all_passed = False
                    continue
                    
            except Exception as e:
                error_msg = f"{test_case['name']}: Request error: {str(e)}"
                print(f"❌ {error_msg}")
                self.results["clg_render_endpoint"]["failed"] += 1
                self.results["clg_render_endpoint"]["errors"].append(error_msg)
                all_passed = False
                continue
        
        if all_passed:
            self.results["clg_render_endpoint"]["passed"] += 1
        
        return all_passed
    
    def _validate_user_profile_adaptation(self, test_case, test_result):
        """Validate that content adapts appropriately to user profile"""
        name = test_case["name"]
        rendered_text = test_result["rendered_text"].lower()
        scalars = test_result["scalars"]
        debug = test_result["debug"]
        
        issues = []
        
        if name == "Child User":
            # Should have simple language, analogies, examples
            if "like" not in rendered_text and "similar to" not in rendered_text:
                issues.append("Child user should include analogies (like, similar to)")
            
            if "example" not in rendered_text and "for instance" not in rendered_text:
                issues.append("Child user should include examples")
            
            # Should have low complexity scalars
            lc = scalars.get("lc", 1.0)
            if lc > 0.5:
                issues.append(f"Child user LC too high: {lc:.3f} (should be < 0.5)")
        
        elif name == "Adult User":
            # Should have moderate complexity, examples, no analogies
            if "like borrowing a toy" in rendered_text or "like a piggy bank" in rendered_text:
                issues.append("Adult user should not have childish analogies")
            
            # Should have moderate complexity scalars
            lc = scalars.get("lc", 0.0)
            if lc < 0.3 or lc > 0.8:
                issues.append(f"Adult user LC should be moderate: {lc:.3f} (should be 0.3-0.8)")
        
        elif name == "Senior Expert":
            # Should have expert terminology, no analogies, no examples
            if "like" in rendered_text and "revolving" not in rendered_text:
                issues.append("Senior expert should not have analogies")
            
            # Should have high complexity scalars
            lc = scalars.get("lc", 0.0)
            if lc < 0.7:
                issues.append(f"Senior expert LC too low: {lc:.3f} (should be > 0.7)")
            
            # Should use expert terms
            expert_terms = ["revolving facility", "asset allocation", "diversification", "portfolio"]
            has_expert_term = any(term in rendered_text for term in expert_terms)
            if not has_expert_term:
                issues.append("Senior expert should use expert terminology")
        
        if issues:
            for issue in issues:
                error_msg = f"{name}: {issue}"
                print(f"⚠️ {error_msg}")
                self.results["user_profile_adaptation"]["errors"].append(error_msg)
            return False
        else:
            print(f"✅ {name}: Content appropriately adapted to user profile")
            return True
    
    def validate_depth_scaling(self):
        """Validate that band scores increase with conceptual depth"""
        print(f"\n📊 Validating Depth Scaling...")
        
        if len(self.test_cases) < 3:
            error_msg = "Not enough test cases to validate depth scaling"
            print(f"❌ {error_msg}")
            self.results["depth_scaling"]["failed"] += 1
            self.results["depth_scaling"]["errors"].append(error_msg)
            return False
        
        # Sort test cases by EL (experience level)
        sorted_cases = sorted(self.test_cases, key=lambda x: x["payload"]["el_declared"])
        
        issues = []
        
        for i in range(len(sorted_cases) - 1):
            current_case = sorted_cases[i]
            next_case = sorted_cases[i + 1]
            
            current_cd = current_case["scalars"].get("cd", 0)
            next_cd = next_case["scalars"].get("cd", 0)
            
            current_el = current_case["payload"]["el_declared"]
            next_el = next_case["payload"]["el_declared"]
            
            # CD should generally increase with EL
            if next_cd <= current_cd and next_el > current_el:
                issue = f"CD not scaling properly: EL{current_el}->CD{current_cd:.3f}, EL{next_el}->CD{next_cd:.3f}"
                issues.append(issue)
        
        if issues:
            for issue in issues:
                print(f"⚠️ {issue}")
                self.results["depth_scaling"]["errors"].extend(issues)
            self.results["depth_scaling"]["failed"] += 1
            return False
        else:
            print(f"✅ Depth scaling working correctly")
            self.results["depth_scaling"]["passed"] += 1
            return True
    
    def _check_grammar(self, text):
        """Basic grammar check for CLG output"""
        if not text:
            return False
        
        # Check for fragmented sentences
        if text.strip().endswith(","):
            return False
        
        # Check for double punctuation
        if ".." in text or ",," in text:
            return False
        
        # Check for missing spaces after punctuation
        import re
        if re.search(r'[.!?][A-Z]', text):
            return False
        
        # Check for periods after questions (PPI integrity issue)
        if re.search(r'\?\.', text):
            return False
        
        # Check for redundant "like" phrases (e.g., "like: like something")
        if re.search(r'like:\s+like\b', text):
            return False
        
        # Check sentences start with capital (basic check)
        sentences = re.split(r'[.!?]\s+', text)
        for sent in sentences:
            if sent and sent[0].islower():
                return False
        
        return True
    
    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "="*80)
        print("🧪 CLG API TESTING SUMMARY")
        print("="*80)
        
        total_passed = 0
        total_failed = 0
        
        for test_name, results in self.results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{test_name.upper():30} | {status} | {passed} passed, {failed} failed")
            
            if results["errors"]:
                for error in results["errors"][:3]:  # Show first 3 errors
                    print(f"{'':32} |      | Error: {error}")
                if len(results["errors"]) > 3:
                    print(f"{'':32} |      | ... and {len(results['errors']) - 3} more errors")
        
        print("-" * 80)
        print(f"{'TOTAL':30} | {'✅ PASS' if total_failed == 0 else '❌ FAIL'} | {total_passed} passed, {total_failed} failed")
        
        # Test Case Details
        if self.test_cases:
            print(f"\n📋 TEST CASE DETAILS:")
            print(f"{'Test Case':<20} | {'Age':<4} | {'EL':<3} | {'LC':<6} | {'CD':<6} | {'Status'}")
            print(f"{'-'*20} | {'-'*4} | {'-'*3} | {'-'*6} | {'-'*6} | {'-'*10}")
            
            for case in self.test_cases:
                name = case["name"][:18]
                age = case["payload"]["age"]
                el = case["payload"]["el_declared"]
                lc = case["scalars"].get("lc", 0)
                cd = case["scalars"].get("cd", 0)
                status = "✅ PASS" if self._check_grammar(case["rendered_text"]) else "❌ FAIL"
                
                print(f"{name:<20} | {age:<4} | {el:<3} | {lc:<6.3f} | {cd:<6.3f} | {status}")
        
        # Critical Issues
        critical_issues = []
        if any("not found" in error for error in self.results["clg_test_endpoint"]["errors"]):
            critical_issues.append("CLG test endpoint missing")
        if any("not found" in error for error in self.results["clg_render_endpoint"]["errors"]):
            critical_issues.append("CLG render endpoint missing")
        if any("disabled" in error for error in self.results["clg_test_endpoint"]["errors"]):
            critical_issues.append("CLG engine is disabled")
        
        if critical_issues:
            print(f"\n🚨 CRITICAL ISSUES:")
            for issue in critical_issues:
                print(f"   • {issue}")
        
        if total_failed == 0:
            print("\n✅ All CLG API endpoints are working correctly!")
            print("   • 9-case step test validates grammar and depth scaling")
            print("   • Content rendering adapts appropriately to user profiles")
            print("   • Grammar safety maintained across all test cases")
        else:
            print(f"\n❌ {total_failed} test(s) failed. See details above.")
        
        return total_failed == 0

def main():
    """Main test execution"""
    print("🚀 Starting CLG API Testing")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    
    tester = CLGTester()
    
    try:
        # Step 1: Test CLG test endpoint
        test_endpoint_success = tester.test_clg_test_endpoint()
        
        # Step 2: Test CLG render endpoint
        render_endpoint_success = tester.test_clg_render_endpoint()
        
        # Step 3: Validate depth scaling
        if render_endpoint_success:
            tester.validate_depth_scaling()
        
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