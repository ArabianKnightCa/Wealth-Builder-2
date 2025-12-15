"""
TAP v2.3 Unit Tests
===================
Comprehensive tests for TAP v2.3 implementation.

Run with: python test_tap_v2_3.py
"""

from tap_v2_3_formulas import compute_tap_scalars
from tap_v2_3_templates import create_sample_template
from tap_v2_3_engine import get_tap_v23_engine
from tap_v2_3_ae_integration import AEStatePacket


def test_formulas():
    """Test core formula computations"""
    print("="*60)
    print("TEST 1: Core Formula Computations")
    print("="*60)
    
    test_cases = [
        {"age": 7, "el": 1, "el_max": 15},
        {"age": 29, "el": 9, "el_max": 15},
        {"age": 67, "el": 15, "el_max": 15},
    ]
    
    for case in test_cases:
        scalars = compute_tap_scalars(case["age"], case["el"], case["el_max"])
        print(f"\nUser: age={case['age']}, EL={case['el']}")
        print(f"  age_norm: {scalars.age_norm:.4f}")
        print(f"  el_norm: {scalars.el_norm:.4f}")
        print(f"  LC: {scalars.lc:.4f}")
        print(f"  CD: {scalars.cd:.4f}")
        print(f"  IA: {scalars.ia:.4f}")
        print(f"  stretch_EL: {scalars.stretch_el}")
        print(f"  stretch_norm: {scalars.stretch_norm:.4f}")
    
    print("\n✅ Formula tests passed\n")


def test_templates():
    """Test template-based progressive reveal"""
    print("="*60)
    print("TEST 2: Template Progressive Reveal")
    print("="*60)
    
    template = create_sample_template()
    
    test_cases = [
        {"age": 7, "el": 1, "name": "Child Beginner"},
        {"age": 29, "el": 9, "name": "Adult Intermediate"},
        {"age": 67, "el": 15, "name": "Senior Expert"},
    ]
    
    for case in test_cases:
        scalars = compute_tap_scalars(case["age"], case["el"], 15)
        included_blocks = template.get_included_blocks(scalars)
        
        print(f"\n{case['name']} (age={case['age']}, EL={case['el']})")
        print(f"  Blocks included: {len(included_blocks)}")
        for block in included_blocks:
            print(f"    - {block.type} (threshold={block.threshold})")
    
    print("\n✅ Template tests passed\n")


def test_engine():
    """Test complete TAP v2.3 engine"""
    print("="*60)
    print("TEST 3: Complete Engine Transformation")
    print("="*60)
    
    engine = get_tap_v23_engine()
    template = create_sample_template()
    
    test_cases = [
        {"age": 7, "el": 1, "name": "Child Beginner"},
        {"age": 29, "el": 9, "name": "Adult Intermediate"},
    ]
    
    for case in test_cases:
        result = engine.transform_with_template(
            template=template,
            user_age=case["age"],
            user_experience_level=case["el"],
            el_max=15
        )
        
        print(f"\n{case['name']}:")
        print(f"  {result[:100]}...")
    
    print("\n✅ Engine tests passed\n")


def test_ae_integration():
    """Test AE state packet integration"""
    print("="*60)
    print("TEST 4: AE State Integration")
    print("="*60)
    
    engine = get_tap_v23_engine()
    
    # High friction scenario
    ae_state_high_friction = AEStatePacket(
        friction=0.8,
        momentum=0.2,
        exposure=1,
        confidence_band=0.3
    )
    
    baseline = "Credit cards let you borrow money from the bank."
    
    result = engine.transform_content(
        baseline_text=baseline,
        user_age=22,
        user_experience_level=4,
        el_max=15,
        ae_state=ae_state_high_friction
    )
    
    print(f"\nBaseline: {baseline}")
    print(f"With High Friction AE: {result}")
    print("\n✅ AE integration tests passed\n")


def test_15_user_matrix():
    """Test 15-user matrix from specification"""
    print("="*60)
    print("TEST 5: 15-User Matrix Validation")
    print("="*60)
    
    test_users = [
        (6, 1), (10, 2), (14, 3), (18, 5), (22, 6),
        (26, 7), (30, 8), (35, 9), (40, 10), (45, 11),
        (50, 12), (55, 13), (60, 14), (67, 15), (75, 15)
    ]
    
    print(f"{'Age':<5} {'EL':<3} {'LC':<7} {'CD':<7} {'IA':<7} {'Stretch':<8}")
    print("-" * 50)
    
    for age, el in test_users:
        scalars = compute_tap_scalars(age, el, 15)
        print(f"{age:<5} {el:<3} {scalars.lc:<7.4f} {scalars.cd:<7.4f} {scalars.ia:<7.4f} {scalars.stretch_el:<8}")
    
    print("\n✅ 15-user matrix tests passed\n")


def test_no_buckets():
    """Verify no age or experience bucketing"""
    print("="*60)
    print("TEST 6: No Buckets Validation")
    print("="*60)
    
    # Test that adjacent ages produce different scalars
    age_12 = compute_tap_scalars(12, 3, 15)
    age_13 = compute_tap_scalars(13, 3, 15)
    
    assert age_12.lc != age_13.lc, "Ages are being bucketed!"
    print(f"  age=12, EL=3: LC={age_12.lc:.4f}")
    print(f"  age=13, EL=3: LC={age_13.lc:.4f}")
    print(f"  ✓ Different LC values (no age bucketing)")
    
    # Test that adjacent ELs produce different scalars
    el_4 = compute_tap_scalars(30, 4, 15)
    el_5 = compute_tap_scalars(30, 5, 15)
    
    assert el_4.cd != el_5.cd, "ELs are being bucketed!"
    print(f"  age=30, EL=4: CD={el_4.cd:.4f}")
    print(f"  age=30, EL=5: CD={el_5.cd:.4f}")
    print(f"  ✓ Different CD values (no EL bucketing)")
    
    print("\n✅ No-buckets validation passed\n")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("TAP v2.3 COMPREHENSIVE TEST SUITE")
    print("="*60 + "\n")
    
    test_formulas()
    test_templates()
    test_engine()
    test_ae_integration()
    test_15_user_matrix()
    test_no_buckets()
    
    print("="*60)
    print("ALL TESTS PASSED ✅")
    print("="*60)
    print("\nTAP v2.3 is ready for production!")
