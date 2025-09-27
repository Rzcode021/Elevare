#!/usr/bin/env python3
"""
Test script to check API endpoints and webhook integration
"""
import requests
import json
import time

def test_assessment_creation():
    """Test the assessment creation endpoint"""
    print("🧪 Testing Assessment Creation API...")
    
    url = "http://127.0.0.1:8000/api/assessments/create/"
    payload = {
        "initial_profile": {
            "interests": ["technology"],
            "hobbies": ["programming"],
            "favoriteSubjects": ["mathematics"]
        }
    }
    
    try:
        print(f"📤 Sending request to: {url}")
        print(f"📦 Payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(
            url,
            json=payload,
            timeout=180,  # 3 minutes timeout
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("✅ SUCCESS - Assessment created!")
                print(f"📄 Response: {json.dumps(data, indent=2)}")
                return True
            except ValueError as e:
                print(f"❌ Invalid JSON response: {e}")
                print(f"📄 Raw response: {response.text}")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"📄 Error response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 3 minutes")
        print("💡 This suggests the N8N webhook is taking too long to respond")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the Django server running?")
        print("💡 Run: python manage.py runserver 8000")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    
    return False

if __name__ == "__main__":
    print("🚀 Starting API Test...")
    print("=" * 50)
    
    # Wait a moment for server to be ready
    print("⏳ Waiting for server to be ready...")
    time.sleep(2)
    
    success = test_assessment_creation()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Test completed successfully!")
    else:
        print("❌ Test failed - Check the issues above")
        print("\n💡 Common solutions:")
        print("1. Make sure Django server is running: python manage.py runserver 8000")
        print("2. Activate N8N workflows: Go to N8N and click 'Execute workflow'")
        print("3. Check N8N workflow configuration and response format")
