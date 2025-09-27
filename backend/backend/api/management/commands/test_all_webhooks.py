from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import json

class Command(BaseCommand):
    help = 'Test all n8n webhook connectivity'

    def handle(self, *args, **options):
        self.stdout.write("🧪 Testing all n8n webhook connectivity...")
        
        webhooks = {
            'Assessment Generation': {
                'url': getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', ''),
                'payload': {
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
            },
            'Profile Submission': {
                'url': getattr(settings, 'N8N_PROFILE_WEBHOOK_URL', ''),
                'payload': {
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
            },
            'Assessment Analysis': {
                'url': getattr(settings, 'N8N_ANALYSIS_WEBHOOK_URL', ''),
                'payload': {
                    "category_scores": {
                        "Math": 0.8,
                        "Logical Reasoning": 0.7
                    },
                    "personality_traits": {
                        "1": "Team",
                        "2": "Creative"
                    },
                    "action": "assessment_analysis"
                }
            },
            'Career Roadmap': {
                'url': getattr(settings, 'N8N_CAREER_ROADMAP_WEBHOOK_URL', ''),
                'payload': {
                    "assessment_id": 123,
                    "user_id": 456,
                    "category_scores": {
                        "Math": 0.8,
                        "Logical Reasoning": 0.7
                    },
                    "overall_percentage": 75.0,
                    "recommendations": [
                        {"career": "Data Scientist", "confidence": 0.8}
                    ],
                    "personality_traits": {"1": "Team"},
                    "timestamp": "2024-01-01T00:00:00Z",
                    "action": "career_roadmap_generation"
                }
            }
        }
        
        for name, config in webhooks.items():
            self.stdout.write(f"\n🔗 Testing {name} webhook...")
            self.stdout.write(f"URL: {config['url']}")
            
            if not config['url']:
                self.stdout.write(self.style.ERROR(f"❌ {name}: No URL configured"))
                continue
                
            try:
                response = requests.post(
                    config['url'],
                    json=config['payload'],
                    timeout=30,
                    headers={'Content-Type': 'application/json'}
                )
                
                self.stdout.write(f"📊 Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        self.stdout.write(self.style.SUCCESS(f"✅ {name}: SUCCESS"))
                        self.stdout.write(f"📄 Response: {json.dumps(data, indent=2)[:200]}...")
                    except ValueError:
                        self.stdout.write(self.style.WARNING(f"⚠️ {name}: Responded but not valid JSON"))
                        self.stdout.write(f"📄 Raw: {response.text[:200]}...")
                elif response.status_code == 404:
                    self.stdout.write(self.style.ERROR(f"❌ {name}: 404 - Workflow not activated"))
                    self.stdout.write("   💡 Solution: Go to N8N and click 'Execute workflow' button")
                else:
                    self.stdout.write(self.style.ERROR(f"❌ {name}: Error {response.status_code}"))
                    self.stdout.write(f"📄 Error: {response.text[:200]}...")
                    
            except requests.exceptions.Timeout:
                self.stdout.write(self.style.ERROR(f"❌ {name}: Timeout after 30 seconds"))
            except requests.exceptions.ConnectionError as e:
                self.stdout.write(self.style.ERROR(f"❌ {name}: Connection error: {e}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"❌ {name}: Unexpected error: {e}"))
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write("📋 SUMMARY:")
        self.stdout.write("1. If you see 404 errors: Activate workflows in N8N")
        self.stdout.write("2. If you see timeouts: Check N8N workflow performance")
        self.stdout.write("3. If you see connection errors: Check N8N instance status")
        self.stdout.write("4. Test mode limitation: Each webhook works only once after activation")
