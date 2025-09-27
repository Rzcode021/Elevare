from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import json

class Command(BaseCommand):
    help = 'Debug webhook responses in detail'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Debugging webhook responses...")
        
        # Test Assessment Generation (the main one that should work)
        assessment_url = getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', '')
        self.stdout.write(f"\n🔗 Testing Assessment Generation: {assessment_url}")
        
        if assessment_url:
            test_payload = {
                "initial_profile": {
                    "interests": ["technology"],
                    "hobbies": ["programming"],
                    "favoriteSubjects": ["mathematics"]
                },
                "num_questions": 3,
                "min_questions": 2,
                "max_questions": 5,
                "action": "assessment_generation"
            }
            
            try:
                response = requests.post(
                    assessment_url,
                    json=test_payload,
                    timeout=60,
                    headers={'Content-Type': 'application/json'}
                )
                
                self.stdout.write(f"📊 Status Code: {response.status_code}")
                self.stdout.write(f"📋 Headers: {dict(response.headers)}")
                self.stdout.write(f"📄 Raw Response: {response.text}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        self.stdout.write(self.style.SUCCESS("✅ Valid JSON Response!"))
                        self.stdout.write(f"📊 Response Structure: {json.dumps(data, indent=2)}")
                        
                        # Check if it has the expected structure
                        if 'questions' in data:
                            questions = data['questions']
                            self.stdout.write(f"📝 Found {len(questions)} questions")
                            if questions and len(questions) > 0:
                                first_q = questions[0]
                                self.stdout.write(f"🔍 First question structure: {json.dumps(first_q, indent=2)}")
                        else:
                            self.stdout.write(self.style.WARNING("⚠️ No 'questions' key in response"))
                            
                    except ValueError as e:
                        self.stdout.write(self.style.ERROR(f"❌ Invalid JSON: {e}"))
                        self.stdout.write(f"📄 Raw response: {response.text}")
                else:
                    self.stdout.write(self.style.ERROR(f"❌ HTTP Error: {response.status_code}"))
                    
            except requests.exceptions.Timeout:
                self.stdout.write(self.style.ERROR("❌ Request timed out after 60 seconds"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))
        
        # Test Profile webhook that's responding
        profile_url = getattr(settings, 'N8N_PROFILE_WEBHOOK_URL', '')
        self.stdout.write(f"\n🔗 Testing Profile Submission: {profile_url}")
        
        if profile_url:
            test_payload = {
                "user_id": 123,
                "username": "test_user",
                "email": "test@example.com",
                "profile_data": {
                    "interests": ["technology"],
                    "hobbies": ["programming"]
                },
                "timestamp": "2024-01-01T00:00:00Z",
                "action": "profile_submission"
            }
            
            try:
                response = requests.post(
                    profile_url,
                    json=test_payload,
                    timeout=30,
                    headers={'Content-Type': 'application/json'}
                )
                
                self.stdout.write(f"📊 Status Code: {response.status_code}")
                self.stdout.write(f"📄 Raw Response: {response.text}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        self.stdout.write(self.style.SUCCESS("✅ Valid JSON Response!"))
                        self.stdout.write(f"📊 Response: {json.dumps(data, indent=2)}")
                    except ValueError as e:
                        self.stdout.write(self.style.ERROR(f"❌ Invalid JSON: {e}"))
                        self.stdout.write(f"📄 Raw response: {response.text}")
                        
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ Error: {e}"))
