from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import json

class Command(BaseCommand):
    help = 'Test n8n webhook connectivity'

    def handle(self, *args, **options):
        self.stdout.write("🧪 Testing n8n webhook connectivity...")
        
        webhook_url = getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', '')
        
        if not webhook_url:
            self.stdout.write(self.style.ERROR("❌ No assessment webhook URL configured"))
            return
        
        self.stdout.write(f"🔗 Testing webhook: {webhook_url}")
        
        # Test payload
        test_payload = {
            "initial_profile": {
                "interests": ["technology"],
                "hobbies": ["programming"],
                "favoriteSubjects": ["mathematics"]
            },
            "num_questions": 5,
            "min_questions": 3,
            "max_questions": 8,
            "action": "assessment_generation"
        }
        
        try:
            self.stdout.write("📤 Sending test request...")
            response = requests.post(
                webhook_url,
                json=test_payload,
                timeout=30,
                headers={'Content-Type': 'application/json'}
            )
            
            self.stdout.write(f"📊 Response Status: {response.status_code}")
            self.stdout.write(f"📋 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    self.stdout.write(self.style.SUCCESS("✅ Webhook responded successfully!"))
                    self.stdout.write(f"📄 Response data: {json.dumps(data, indent=2)}")
                except ValueError:
                    self.stdout.write(self.style.WARNING("⚠️ Webhook responded but not with valid JSON"))
                    self.stdout.write(f"📄 Raw response: {response.text}")
            else:
                self.stdout.write(self.style.ERROR(f"❌ Webhook returned error: {response.status_code}"))
                self.stdout.write(f"📄 Error response: {response.text}")
                
        except requests.exceptions.Timeout:
            self.stdout.write(self.style.ERROR("❌ Webhook timed out after 30 seconds"))
        except requests.exceptions.ConnectionError as e:
            self.stdout.write(self.style.ERROR(f"❌ Connection error: {e}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Unexpected error: {e}"))

