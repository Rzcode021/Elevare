from rest_framework import serializers
from .models import AssessmentQuestion

# This serializer is for INTERNAL use when creating questions
class AssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        fields = '__all__' # Includes the correct_answer

# This serializer is for sending questions to the user (it HIDES the answer)
class SanitizedAssessmentQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentQuestion
        # Exclude the 'correct_answer' field to prevent cheating
        exclude = ('correct_answer',)


# Mentorship serializers
from .models import Mentor, MentorshipSession, MentorMessage


class MentorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mentor
        fields = ('id', 'name', 'expertise', 'bio', 'avatar_url')


class MentorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorMessage
        fields = ('id', 'sender', 'content', 'created_at')


class MentorshipSessionSerializer(serializers.ModelSerializer):
    messages = MentorMessageSerializer(many=True, read_only=True)
    mentor = MentorSerializer(read_only=True)

    class Meta:
        model = MentorshipSession
        fields = ('id', 'mentor', 'user', 'started_at', 'messages')
