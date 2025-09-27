from django.core.management.base import BaseCommand
from django.conf import settings

class Command(BaseCommand):
    help = 'Check webhook configuration status'

    def handle(self, *args, **options):
        self.stdout.write("🔍 Checking webhook configuration...")
        
        webhooks = {
            'N8N_ASSESSMENT_WEBHOOK_URL': getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', ''),
            'N8N_ANALYSIS_WEBHOOK_URL': getattr(settings, 'N8N_ANALYSIS_WEBHOOK_URL', ''),
            'N8N_PROFILE_WEBHOOK_URL': getattr(settings, 'N8N_PROFILE_WEBHOOK_URL', ''),
            'N8N_CAREER_ROADMAP_WEBHOOK_URL': getattr(settings, 'N8N_CAREER_ROADMAP_WEBHOOK_URL', ''),
        }
        
        for name, url in webhooks.items():
            if url and 'YOUR_N8N' not in url:
                self.stdout.write(
                    self.style.SUCCESS(f"✅ {name}: {url}")
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ {name}: Not configured")
                )
        
        self.stdout.write("\n📋 To configure webhooks, add these to your .env file:")
        self.stdout.write("N8N_ASSESSMENT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/assessment")
        self.stdout.write("N8N_ANALYSIS_WEBHOOK_URL=https://your-n8n-instance.com/webhook/analysis")
        self.stdout.write("N8N_PROFILE_WEBHOOK_URL=https://your-n8n-instance.com/webhook/profile")
        self.stdout.write("N8N_CAREER_ROADMAP_WEBHOOK_URL=https://your-n8n-instance.com/webhook/career-roadmap")

