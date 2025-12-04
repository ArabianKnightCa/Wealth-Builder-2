#!/usr/bin/env python3
"""
Telemetry Edge Case Testing
Tests error handling, validation, and edge cases for telemetry endpoints
"""

import requests
import json
import uuid
from datetime import datetime, timezone
import sys

# Configuration
BACKEND_URL = "https://money-mentor-380.preview.emergentagent.com/api"

def test_invalid_data_scenarios():
    """Test various invalid data scenarios"""
    print("🔍 Testing Invalid Data Scenarios...")
    
    # Test 1: Missing required fields
    print("\n1. Testing missing required fields...")
    
    invalid_session = {
        "userId": "test-user",
        # Missing sessionId, sessionStart, deviceType, userTier
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/session", json=invalid_session)
        print(f"   Missing fields response: {response.status_code}")
        if response.status_code != 200:
            print(f"   ✅ Correctly rejected invalid data: {response.status_code}")
        else:
            print(f"   ⚠️ Unexpectedly accepted invalid data")
    except Exception as e:
        print(f"   ✅ Request failed as expected: {e}")
    
    # Test 2: Invalid timestamp format
    print("\n2. Testing invalid timestamp format...")
    
    invalid_timestamp = {
        "userId": "test-user",
        "sessionId": "test-session",
        "sessionStart": "invalid-timestamp",
        "deviceType": "desktop",
        "userTier": "free"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/session", json=invalid_timestamp)
        print(f"   Invalid timestamp response: {response.status_code}")
        if response.status_code != 200:
            print(f"   ✅ Correctly rejected invalid timestamp: {response.status_code}")
        else:
            print(f"   ⚠️ Unexpectedly accepted invalid timestamp")
    except Exception as e:
        print(f"   ✅ Request failed as expected: {e}")
    
    # Test 3: Invalid numeric values
    print("\n3. Testing invalid numeric values...")
    
    invalid_numeric = {
        "userId": "test-user",
        "topicId": "test-topic",
        "chapterId": "CH01",
        "difficultyTier": "not-a-number",  # Should be int
        "timeSpentSeconds": -100,  # Negative value
        "accuracy": 150.0,  # Over 100%
        "retries": "invalid",  # Should be int
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "userTier": "free"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/topic-completed", json=invalid_numeric)
        print(f"   Invalid numeric response: {response.status_code}")
        if response.status_code != 200:
            print(f"   ✅ Correctly rejected invalid numeric data: {response.status_code}")
        else:
            print(f"   ⚠️ Unexpectedly accepted invalid numeric data")
    except Exception as e:
        print(f"   ✅ Request failed as expected: {e}")

def test_boundary_values():
    """Test boundary values and extreme cases"""
    print("\n🔍 Testing Boundary Values...")
    
    # Test very large values
    large_values = {
        "userId": "test-user-boundary",
        "topicId": "test-topic",
        "chapterId": "CH01",
        "difficultyTier": 999999,
        "timeSpentSeconds": 999999999,
        "accuracy": 100.0,
        "retries": 999999,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "userTier": "premium"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/topic-completed", json=large_values)
        if response.status_code == 200:
            print("   ✅ Large values accepted")
        else:
            print(f"   ⚠️ Large values rejected: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error with large values: {e}")
    
    # Test zero values
    zero_values = {
        "userId": "test-user-zero",
        "topicId": "test-topic",
        "chapterId": "CH01",
        "difficultyTier": 0,
        "timeSpentSeconds": 0,
        "accuracy": 0.0,
        "retries": 0,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "userTier": "free"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/topic-completed", json=zero_values)
        if response.status_code == 200:
            print("   ✅ Zero values accepted")
        else:
            print(f"   ⚠️ Zero values rejected: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error with zero values: {e}")

def test_special_characters():
    """Test special characters and Unicode"""
    print("\n🔍 Testing Special Characters...")
    
    special_chars = {
        "userId": "test-user-特殊字符-🎯",
        "stepName": "onboarding_step_with_émojis_🚀_and_spëcial_chars",
        "completed": True,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "userTier": "premium"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/telemetry/onboarding", json=special_chars)
        if response.status_code == 200:
            print("   ✅ Special characters accepted")
        else:
            print(f"   ⚠️ Special characters rejected: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error with special characters: {e}")

def test_concurrent_requests():
    """Test concurrent requests to the same endpoint"""
    print("\n🔍 Testing Concurrent Requests...")
    
    import threading
    import time
    
    results = []
    
    def make_request(i):
        data = {
            "userId": f"concurrent-user-{i}",
            "sessionId": f"session-{i}",
            "sessionStart": datetime.now(timezone.utc).isoformat(),
            "deviceType": "desktop",
            "userTier": "free"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/telemetry/session", json=data)
            results.append(response.status_code)
        except Exception as e:
            results.append(f"Error: {e}")
    
    # Create 10 concurrent threads
    threads = []
    for i in range(10):
        thread = threading.Thread(target=make_request, args=(i,))
        threads.append(thread)
    
    # Start all threads
    for thread in threads:
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    success_count = sum(1 for r in results if r == 200)
    print(f"   Concurrent requests: {success_count}/10 successful")
    
    if success_count >= 8:  # Allow for some network issues
        print("   ✅ Concurrent requests handled well")
    else:
        print("   ⚠️ Some concurrent requests failed")
        print(f"   Results: {results}")

def main():
    """Main test execution"""
    print("🚀 Starting Telemetry Edge Case Testing")
    print(f"Backend URL: {BACKEND_URL}")
    
    try:
        test_invalid_data_scenarios()
        test_boundary_values()
        test_special_characters()
        test_concurrent_requests()
        
        print("\n✅ Edge case testing completed!")
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error during testing: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())