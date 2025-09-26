from django.db import models

# Create your models here.
from django.conf import settings
from django.db import models

# Extends the built-in Django user to store our app-specific data
class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    initial_profile = models.JSONField(null=True, blank=True)

    def __str__(self):
        return self.user.username

# Tracks each assessment session initiated by a user
class Assessment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default='pending') # pending, completed, analyzed
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Assessment {self.id} for {self.user.username}"

# Securely stores each question and its correct answer for an assessment
class AssessmentQuestion(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    options = models.JSONField() # ["Option A", "Option B", ...]
    category = models.CharField(max_length=100)
    correct_answer = models.TextField(null=True, blank=True) # Can be null for personality questions

    def __str__(self):
        return self.question_text[:50] # Show first 50 chars

# Records the specific answers submitted by the user
class UserAnswer(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    selected_answer = models.TextField()
    is_correct = models.BooleanField(null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

# Stores the final AI analysis and career recommendations
class AssessmentResult(models.Model):
    assessment = models.OneToOneField(Assessment, on_delete=models.CASCADE, related_name='result')
    category_scores = models.JSONField() # { "Logical Reasoning": 1.0, ... }
    recommended_careers = models.JSONField() # Array of career recommendation objects
    final_chosen_career = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


# Mentorship models
class Mentor(models.Model):
    name = models.CharField(max_length=200)
    expertise = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)

    def __str__(self):
        return self.name


class MentorshipSession(models.Model):
    mentor = models.ForeignKey(Mentor, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Session {self.id} with {self.mentor.name} for {self.user.username}"


class MentorMessage(models.Model):
    session = models.ForeignKey(MentorshipSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20)  # 'mentor' or 'user'
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender}: {self.content[:30]}"