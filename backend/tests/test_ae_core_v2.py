"""
AE-CORE v2.0 Test Suite
18 Automated Test Cases for Adaptive Engine Formula Verification

Tests cover:
- Formula accuracy
- Edge cases
- Age normalization
- Experience normalization
- Combined score calculations
- Integration with AE methods
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import unittest
from ae_engine_v2 import get_adaptive_engine_v2


class TestAECoreV2Formula(unittest.TestCase):
    """Test suite for AE-CORE v2.0 formula: combined_score = 0.4 * age_score + 0.6 * exp_score"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test fixtures"""
        cls.ae = get_adaptive_engine_v2()
    
    # ========================================================================
    # TEST GROUP 1: EDGE CASES (Tests 1-6)
    # ========================================================================
    
    def test_01_minimum_age_minimum_experience(self):
        """Test 1: Minimum age (6) + minimum experience (1) should give lowest score"""
        score = self.ae.calculate_combined_score(age=6, experience_level=1)
        self.assertAlmostEqual(score, 0.0, places=3)
        print(f"✓ Test 1: Min age/exp → Score: {score}")
    
    def test_02_maximum_age_maximum_experience(self):
        """Test 2: Maximum age (99) + maximum experience (5) should give highest score"""
        score = self.ae.calculate_combined_score(age=99, experience_level=5)
        self.assertAlmostEqual(score, 1.0, places=3)
        print(f"✓ Test 2: Max age/exp → Score: {score}")
    
    def test_03_minimum_age_maximum_experience(self):
        """Test 3: Young expert - minimum age (6) with maximum experience (5)"""
        score = self.ae.calculate_combined_score(age=6, experience_level=5)
        # Expected: 0.4 * 0.0 + 0.6 * 1.0 = 0.6
        self.assertAlmostEqual(score, 0.6, places=3)
        print(f"✓ Test 3: Min age, max exp → Score: {score}")
    
    def test_04_maximum_age_minimum_experience(self):
        """Test 4: Senior beginner - maximum age (99) with minimum experience (1)"""
        score = self.ae.calculate_combined_score(age=99, experience_level=1)
        # Expected: 0.4 * 1.0 + 0.6 * 0.0 = 0.4
        self.assertAlmostEqual(score, 0.4, places=3)
        print(f"✓ Test 4: Max age, min exp → Score: {score}")
    
    def test_05_child_age_range(self):
        """Test 5: Child age band (6-12) with beginner level"""
        score = self.ae.calculate_combined_score(age=10, experience_level=1)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 0.1)  # Should be very low
        print(f"✓ Test 5: Child beginner → Score: {score}")
    
    def test_06_teen_age_range(self):
        """Test 6: Teen age band (13-17) with novice level"""
        score = self.ae.calculate_combined_score(age=15, experience_level=2)
        self.assertGreaterEqual(score, 0.1)
        self.assertLessEqual(score, 0.3)
        print(f"✓ Test 6: Teen novice → Score: {score}")
    
    # ========================================================================
    # TEST GROUP 2: FORMULA ACCURACY (Tests 7-12)
    # ========================================================================
    
    def test_07_mid_point_calculation(self):
        """Test 7: Mid-point age and experience should give ~0.5 score"""
        # Age 52.5 (midpoint of 6-99), Experience 3 (midpoint of 1-5)
        score = self.ae.calculate_combined_score(age=53, experience_level=3)
        self.assertGreaterEqual(score, 0.45)
        self.assertLessEqual(score, 0.55)
        print(f"✓ Test 7: Mid-point → Score: {score}")
    
    def test_08_experience_weight_dominance(self):
        """Test 8: Experience weight (60%) should dominate over age (40%)"""
        # Same age, different experience
        score_exp1 = self.ae.calculate_combined_score(age=30, experience_level=1)
        score_exp5 = self.ae.calculate_combined_score(age=30, experience_level=5)
        
        difference = score_exp5 - score_exp1
        self.assertAlmostEqual(difference, 0.6, places=2)  # Full experience range = 0.6
        print(f"✓ Test 8: Experience weight → Diff: {difference}")
    
    def test_09_age_weight_contribution(self):
        """Test 9: Age weight (40%) contribution verification"""
        # Same experience, different age
        score_age6 = self.ae.calculate_combined_score(age=6, experience_level=3)
        score_age99 = self.ae.calculate_combined_score(age=99, experience_level=3)
        
        difference = score_age99 - score_age6
        self.assertAlmostEqual(difference, 0.4, places=2)  # Full age range = 0.4
        print(f"✓ Test 9: Age weight → Diff: {difference}")
    
    def test_10_linear_progression_age(self):
        """Test 10: Age should scale linearly within range"""
        scores = []
        for age in [6, 28, 52, 75, 99]:
            score = self.ae.calculate_combined_score(age=age, experience_level=3)
            scores.append(score)
        
        # Check monotonic increase
        for i in range(len(scores) - 1):
            self.assertLess(scores[i], scores[i + 1])
        print(f"✓ Test 10: Linear age progression → {[round(s, 3) for s in scores]}")
    
    def test_11_linear_progression_experience(self):
        """Test 11: Experience should scale linearly"""
        scores = []
        for exp in [1, 2, 3, 4, 5]:
            score = self.ae.calculate_combined_score(age=40, experience_level=exp)
            scores.append(score)
        
        # Check monotonic increase
        for i in range(len(scores) - 1):
            self.assertLess(scores[i], scores[i + 1])
        print(f"✓ Test 11: Linear exp progression → {[round(s, 3) for s in scores]}")
    
    def test_12_score_normalization(self):
        """Test 12: All scores should be normalized between 0.0 and 1.0"""
        test_cases = [
            (6, 1), (15, 2), (25, 3), (50, 4), (99, 5),
            (10, 1), (20, 2), (30, 3), (40, 4), (60, 5)
        ]
        
        for age, exp in test_cases:
            score = self.ae.calculate_combined_score(age, exp)
            self.assertGreaterEqual(score, 0.0, f"Score {score} for age={age}, exp={exp} is below 0.0")
            self.assertLessEqual(score, 1.0, f"Score {score} for age={age}, exp={exp} is above 1.0")
        
        print(f"✓ Test 12: All scores normalized (0.0-1.0) ✓")
    
    # ========================================================================
    # TEST GROUP 3: INTEGRATION & REAL-WORLD SCENARIOS (Tests 13-18)
    # ========================================================================
    
    def test_13_young_professional_scenario(self):
        """Test 13: Young professional (25, intermediate) realistic score"""
        score = self.ae.calculate_combined_score(age=25, experience_level=3)
        # Expected range: ~0.35-0.40
        self.assertGreaterEqual(score, 0.35)
        self.assertLessEqual(score, 0.42)
        print(f"✓ Test 13: Young professional → Score: {score}")
    
    def test_14_mid_career_advanced_scenario(self):
        """Test 14: Mid-career advanced (40, advanced) realistic score"""
        score = self.ae.calculate_combined_score(age=40, experience_level=4)
        # Expected range: ~0.55-0.65
        self.assertGreaterEqual(score, 0.55)
        self.assertLessEqual(score, 0.65)
        print(f"✓ Test 14: Mid-career advanced → Score: {score}")
    
    def test_15_senior_expert_scenario(self):
        """Test 15: Senior expert (60, expert) high score"""
        score = self.ae.calculate_combined_score(age=60, experience_level=5)
        # Expected range: ~0.80-0.85
        self.assertGreaterEqual(score, 0.80)
        self.assertLessEqual(score, 0.85)
        print(f"✓ Test 15: Senior expert → Score: {score}")
    
    def test_16_career_changer_scenario(self):
        """Test 16: Career changer (45, beginner) - high age, low experience"""
        score = self.ae.calculate_combined_score(age=45, experience_level=1)
        # Expected: Age contributes more than experience
        # ~0.4 * 0.42 + 0.6 * 0.0 = ~0.168
        self.assertGreaterEqual(score, 0.15)
        self.assertLessEqual(score, 0.20)
        print(f"✓ Test 16: Career changer → Score: {score}")
    
    def test_17_child_prodigy_scenario(self):
        """Test 17: Child prodigy (8, intermediate) - low age, medium experience"""
        score = self.ae.calculate_combined_score(age=8, experience_level=3)
        # Expected: Experience dominates
        # ~0.4 * 0.02 + 0.6 * 0.5 = ~0.308
        self.assertGreaterEqual(score, 0.28)
        self.assertLessEqual(score, 0.32)
        print(f"✓ Test 17: Child prodigy → Score: {score}")
    
    def test_18_consistent_results(self):
        """Test 18: Same inputs should always produce same outputs (deterministic)"""
        score1 = self.ae.calculate_combined_score(age=30, experience_level=3)
        score2 = self.ae.calculate_combined_score(age=30, experience_level=3)
        score3 = self.ae.calculate_combined_score(age=30, experience_level=3)
        
        self.assertEqual(score1, score2)
        self.assertEqual(score2, score3)
        print(f"✓ Test 18: Deterministic results → Score: {score1}")


def run_test_suite():
    """Run all 18 tests and generate report"""
    print("\n" + "=" * 70)
    print("AE-CORE v2.0 TEST SUITE - 18 AUTOMATED TESTS")
    print("=" * 70)
    print(f"Formula: combined_score = 0.4 * age_score + 0.6 * exp_score")
    print("=" * 70 + "\n")
    
    # Run tests
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestAECoreV2Formula)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {result.testsRun}")
    print(f"✓ Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"✗ Failed: {len(result.failures)}")
    print(f"⚠ Errors: {len(result.errors)}")
    print("=" * 70)
    
    if result.wasSuccessful():
        print("\n🎉 ALL 18 TESTS PASSED! AE-CORE v2.0 Formula is working correctly.")
    else:
        print("\n⚠️ SOME TESTS FAILED. Please review the output above.")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_test_suite()
    sys.exit(0 if success else 1)
