from django.core.management.base import BaseCommand
from api.models import Assessment, AssessmentQuestion, UserAnswer, AssessmentResult

class Command(BaseCommand):
    help = 'Clear all assessments and related data to ensure only webhook-generated questions'

    def handle(self, *args, **options):
        # Clear all assessment-related data
        AssessmentResult.objects.all().delete()
        UserAnswer.objects.all().delete()
        AssessmentQuestion.objects.all().delete()
        Assessment.objects.all().delete()
        
        # Also clear any cached data
        from django.core.cache import cache
        cache.clear()
        
        self.stdout.write(
            self.style.SUCCESS('✅ Successfully cleared all assessments and related data')
        )
        self.stdout.write(
            self.style.WARNING('⚠️  All future assessments will ONLY use n8n webhook-generated questions')
        )
