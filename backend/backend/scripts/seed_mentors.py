"""
Run this from the Django project root (backend/backend) with the venv active:

python scripts/seed_mentors.py

It will create some mock mentors if they do not exist.
"""
import os
import django
import sys

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Mentor

mentors = [
    {'name': 'Jane Doe', 'expertise': 'Software Engineering', 'bio': 'Senior engineer with 10+ years in full-stack.', 'avatar_url': '/avatars/jane.jpg'},
    {'name': 'John Smith', 'expertise': 'Data Science', 'bio': 'Data scientist specializing in ML and analytics.', 'avatar_url': '/avatars/john.jpg'},
    {'name': 'Aisha Khan', 'expertise': 'Product Management', 'bio': 'PM with a focus on education tech.', 'avatar_url': '/avatars/aisha.jpg'},
    {'name': 'Carlos Mendez', 'expertise': 'UI/UX Design', 'bio': 'Designer focused on accessible interfaces.', 'avatar_url': '/assets/download (7).jpg'},
    {'name': 'Lina Chen', 'expertise': 'AI Research', 'bio': 'Researcher working on language models and education.', 'avatar_url': '/assets/download (7).jpg'},
    {'name': 'Priya Patel', 'expertise': 'Career Counseling', 'bio': 'Experienced counselor helping students find paths.', 'avatar_url': '/assets/download (7).jpg'},
]

for m in mentors:
    Mentor.objects.get_or_create(name=m['name'], defaults=m)

print('Seeded mentors.')
