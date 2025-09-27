
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
import requests
from datetime import datetime
from .models import UserProfile, Assessment, AssessmentQuestion, UserAnswer, AssessmentResult
from .serializers import SanitizedAssessmentQuestionSerializer
from .serializers import MentorSerializer, MentorshipSessionSerializer, MentorMessageSerializer
from .models import Mentor, MentorshipSession, MentorMessage
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .webhook_utils import (
    trigger_profile_webhook, 
    trigger_career_roadmap_webhook, 
    trigger_assessment_webhook, 
    trigger_analysis_webhook
)

User = get_user_model()

def _get_request_user(request):
    """Return request.user if authenticated; otherwise in DEBUG, return or create a demo user.
    This keeps the hackathon/demo flow simple without requiring login.
    """
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        return user
    if getattr(settings, 'DEBUG', False):
        demo_user, _ = User.objects.get_or_create(username='demo_user', defaults={'email': 'demo@example.com'})
        return demo_user
    return None

# NOTE: n8n assessment webhook URL should be provided via settings (N8N_ASSESSMENT_WEBHOOK_URL)


class CreateAssessmentView(APIView):
    # Allow unauthenticated requests while in DEBUG to simplify hackathon/demo usage.
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # 1. Get user profile data from the request
        initial_profile = request.data.get('initial_profile')
        if not initial_profile:
            return Response(
                {"error": "initial_profile is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 2. Save the user's initial profile
        user = _get_request_user(request)
        if user is None:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        UserProfile.objects.update_or_create(
            user=user,
            defaults={'initial_profile': initial_profile}
        )

        # 2.1. Trigger profile submission webhook
        profile_webhook_data = {
            'user_id': user.id,
            'username': user.username,
            'email': getattr(user, 'email', ''),
            'profile_data': initial_profile,
            'timestamp': datetime.now().isoformat()
        }
        
        profile_success, profile_response, profile_error = trigger_profile_webhook(profile_webhook_data)
        if not profile_success:
            # Log the error but don't fail the request
            print(f"Profile webhook failed: {profile_error}")
        else:
            print(f"Profile webhook successful: {profile_response}")

        # 3. Trigger the n8n workflow to generate questions
        # ONLY use webhook-generated questions - NO FALLBACKS
        desired_questions = request.data.get('num_questions') or 12  # default to 12

        print(f"🔗 Attempting to get questions from n8n webhook...")
        print(f"📊 Profile data: {initial_profile}")
        print(f"🎯 Desired questions: {desired_questions}")
        
        # Use the webhook utility to get questions from n8n
        assessment_success, assessment_response, assessment_error = trigger_assessment_webhook(
            initial_profile, desired_questions
        )
        
        if not assessment_success or not assessment_response:
            # If webhook fails, return error - NO FALLBACK
            print(f"❌ Webhook failed: {assessment_error}")
            print(f"🔍 Webhook URL: {getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', 'NOT SET')}")
            return Response({
                "error": f"Failed to generate assessment questions: {assessment_error}",
                "details": "Assessment questions can ONLY be generated via n8n webhook. The webhook timed out after 2 minutes. Please ensure your webhook is properly configured and can process requests within 2 minutes.",
                "webhook_required": True,
                "timeout_seconds": 120,
                "debug_info": {
                    "webhook_url_configured": bool(getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', '')),
                    "error_type": type(assessment_error).__name__ if assessment_error else "Unknown"
                }
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        questions_data = assessment_response.get('questions', assessment_response)
        
        if not questions_data or not isinstance(questions_data, list):
            print(f"❌ Invalid webhook response: {assessment_response}")
            return Response({
                "error": "Invalid response from assessment webhook",
                "details": "Expected 'questions' array in webhook response",
                "webhook_required": True
            }, status=status.HTTP_502_BAD_GATEWAY)

        print(f"✅ Successfully received {len(questions_data)} questions from n8n webhook")

        # 4. Save the assessment and questions securely in the database
        try:
            with transaction.atomic():
                # Create a new assessment session
                assessment = Assessment.objects.create(user=user, status='pending')

                # Create question objects from the n8n response
                questions_to_create = []
                for q_data in questions_data:
                    # Validate that question has correct answer (required for webhook questions)
                    correct_answer = q_data.get('correctAnswer')
                    if not correct_answer:
                        print(f"⚠️ Warning: Question missing correct answer: {q_data.get('questionText', 'Unknown')}")
                    
                    # Store both question and answer in backend
                    questions_to_create.append(
                        AssessmentQuestion(
                            assessment=assessment,
                            question_text=q_data.get('questionText'),
                            options=q_data.get('options'),
                            category=q_data.get('category'),
                            correct_answer=correct_answer # Store the correct answer securely
                        )
                    )
                
                if not questions_to_create:
                    return Response({
                        "error": "No valid questions received from webhook",
                        "details": "All questions must have correct answers when generated via webhook"
                    }, status=status.HTTP_502_BAD_GATEWAY)
                
                AssessmentQuestion.objects.bulk_create(questions_to_create)
                print(f"💾 Saved {len(questions_to_create)} webhook-generated questions to database")
        except Exception as e:
             return Response({"error": f"Failed to save assessment: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        # 5. Send the SANITIZED questions back to the frontend including assessment id
        sanitized_questions = assessment.questions.all()
        serializer = SanitizedAssessmentQuestionSerializer(sanitized_questions, many=True)
        return Response({
            'assessment_id': assessment.id,
            'questions': serializer.data,
        }, status=status.HTTP_201_CREATED)




class SubmitAssessmentView(APIView):
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def post(self, request, assessment_id, *args, **kwargs):
        # Expect a JSON object mapping question IDs to the selected answer
        submitted_answers = request.data.get('answers') or request.data

        user = _get_request_user(request)
        if user is None:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            assessment = Assessment.objects.get(id=assessment_id)
        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure ownership unless in DEBUG/demo mode
        if not getattr(settings, 'DEBUG', False) and assessment.user != user:
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        questions = list(assessment.questions.all())
        category_totals = {}
        category_correct = {}
        personality_traits = {}

        user_answers_objects = []

        for q in questions:
            qid_str = str(q.id)
            raw_answer = submitted_answers.get(qid_str) if qid_str in submitted_answers else submitted_answers.get(q.id)
            selected = raw_answer

            is_correct = None
            if q.correct_answer is not None and selected is not None:
                # Enhanced validation using stored correct answers
                correct_answer = str(q.correct_answer).strip().lower()
                selected_answer = str(selected).strip().lower()
                is_correct = selected_answer == correct_answer

            # Track category scoring
            cat = q.category or 'General'
            category_totals[cat] = category_totals.get(cat, 0) + 1
            if is_correct:
                category_correct[cat] = category_correct.get(cat, 0) + 1

            # Personality style (no correct_answer)
            if q.correct_answer is None and selected:
                personality_traits[q.id] = selected

            # Save (but don't commit yet)
            user_answers_objects.append(UserAnswer(
                assessment=assessment,
                question=q,
                user=user,
                selected_answer=selected if selected is not None else '',
                is_correct=is_correct
            ))

        # Bulk save user answers
        UserAnswer.objects.bulk_create(user_answers_objects)

        # Compute category scores as fraction correct
        category_scores = {}
        for cat, total in category_totals.items():
            correct = category_correct.get(cat, 0)
            category_scores[cat] = round(correct / total if total > 0 else 0, 3)

        # Compute overall correct/total and percentage
        overall_total = sum(category_totals.values()) if category_totals else 0
        overall_correct = sum(category_correct.get(cat, 0) for cat in category_totals.keys()) if category_totals else 0
        overall_percentage = round((overall_correct / overall_total * 100) if overall_total > 0 else 0.0, 1)

        # Call analysis webhook or fallback to local simple analysis
        analysis_payload = {
            'category_scores': category_scores,
            'personality_traits': personality_traits,
        }

        analysis_result = None
        analysis_success, analysis_response, analysis_error = trigger_analysis_webhook(analysis_payload)
        
        if analysis_success and analysis_response:
            analysis_result = analysis_response

        if analysis_result is None:
            # Simple fallback analysis: map top categories to careers
            sorted_cats = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
            recommendations = []
            mapping = {
                'Math': ['Data Scientist', 'Engineer'],
                'Logical Reasoning': ['Analyst', 'Research Scientist'],
                'Interests': ['Content Creator', 'Designer'],
                'General': ['Generalist']
            }
            for cat, score in sorted_cats[:3]:
                careers = mapping.get(cat, ['Generalist'])
                for c in careers:
                    recommendations.append({'career': c, 'confidence': float(score)})

            analysis_result = {
                'recommendations': recommendations,
                'explanation': f'Generated from category scores: {category_scores}'
            }

        # Save the result in AssessmentResult
        AssessmentResult.objects.update_or_create(
            assessment=assessment,
            defaults={
                'category_scores': category_scores,
                'recommended_careers': analysis_result.get('recommendations', []),
            }
        )

        # Trigger career roadmap webhook
        career_roadmap_data = {
            'assessment_id': assessment.id,
            'user_id': user.id,
            'category_scores': category_scores,
            'overall_percentage': overall_percentage,
            'recommendations': analysis_result.get('recommendations', []),
            'personality_traits': personality_traits,
            'timestamp': datetime.now().isoformat()
        }
        
        # Get user profile for additional context
        try:
            user_profile = UserProfile.objects.get(user=user)
            profile_data = user_profile.initial_profile
        except UserProfile.DoesNotExist:
            profile_data = None
        
        career_roadmap_success, career_roadmap_response, career_roadmap_error = trigger_career_roadmap_webhook(
            career_roadmap_data, profile_data
        )
        
        if not career_roadmap_success:
            print(f"Career roadmap webhook failed: {career_roadmap_error}")
        else:
            print(f"Career roadmap webhook successful: {career_roadmap_response}")

        return Response({
            'assessment_id': assessment.id,
            'category_scores': category_scores,
            'overall_percentage': overall_percentage,
            'recommendations': analysis_result.get('recommendations', []),
            'explanation': analysis_result.get('explanation', ''),
            'career_roadmap_triggered': career_roadmap_success
        }, status=status.HTTP_200_OK)


class AssessmentDetailView(APIView):
    """Return sanitized questions for a given assessment id so frontends can re-load questions.
    Only returns questions that were generated via n8n webhook.
    """
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def get(self, request, assessment_id):
        try:
            assessment = Assessment.objects.get(id=assessment_id)
        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)

        # In non-debug mode ensure ownership
        if not getattr(settings, 'DEBUG', False) and assessment.user != _get_request_user(request):
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Only return questions that have correct answers (indicating they came from webhook)
        webhook_questions = assessment.questions.filter(correct_answer__isnull=False)
        
        if not webhook_questions.exists():
            return Response({
                "error": "No webhook-generated questions found for this assessment",
                "details": "This assessment may contain old predetermined questions. Please create a new assessment.",
                "webhook_required": True
            }, status=status.HTTP_400_BAD_REQUEST)

        print(f"📋 Returning {webhook_questions.count()} webhook-generated questions for assessment {assessment_id}")
        
        serializer = SanitizedAssessmentQuestionSerializer(webhook_questions, many=True)
        return Response({
            'assessment_id': assessment.id, 
            'questions': serializer.data,
            'source': 'n8n_webhook',
            'total_questions': webhook_questions.count()
        })


class MentorListView(APIView):
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def get(self, request):
        mentors = Mentor.objects.all()
        serializer = MentorSerializer(mentors, many=True)
        return Response(serializer.data)


class MentorDetailView(APIView):
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def get(self, request, mentor_id):
        try:
            mentor = Mentor.objects.get(id=mentor_id)
        except Mentor.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorSerializer(mentor)
        return Response(serializer.data)


@method_decorator(csrf_exempt, name='dispatch')
class StartSessionView(APIView):
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def post(self, request, mentor_id):
        user = _get_request_user(request)
        if user is None:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            mentor = Mentor.objects.get(id=mentor_id)
        except Mentor.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=status.HTTP_404_NOT_FOUND)

        session = MentorshipSession.objects.create(mentor=mentor, user=user)
        serializer = MentorshipSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class PostMessageView(APIView):
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def post(self, request, session_id):
        user = _get_request_user(request)
        if user is None:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            session = MentorshipSession.objects.get(id=session_id)
        except MentorshipSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content')
        sender = request.data.get('sender', 'user')
        if not content:
            return Response({"error": "content is required."}, status=status.HTTP_400_BAD_REQUEST)

        msg = MentorMessage.objects.create(session=session, sender=sender, content=content)
        serializer = MentorMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get(self, request, session_id):
        try:
            session = MentorshipSession.objects.get(id=session_id)
        except MentorshipSession.DoesNotExist:
            return Response({"error": "Session not found."}, status=status.HTTP_404_NOT_FOUND)

        messages = session.messages.order_by('created_at')
        serializer = MentorMessageSerializer(messages, many=True)
        return Response(serializer.data)


class CareerRoadmapView(APIView):
    """
    Trigger career roadmap guidance webhook for a specific assessment.
    This can be called independently to generate career roadmaps.
    """
    permission_classes = [AllowAny] if getattr(settings, 'DEBUG', False) else [IsAuthenticated]

    def post(self, request, assessment_id):
        user = _get_request_user(request)
        if user is None:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            assessment = Assessment.objects.get(id=assessment_id)
        except Assessment.DoesNotExist:
            return Response({"error": "Assessment not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure ownership unless in DEBUG/demo mode
        if not getattr(settings, 'DEBUG', False) and assessment.user != user:
            return Response({"error": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

        # Get assessment result
        try:
            assessment_result = AssessmentResult.objects.get(assessment=assessment)
        except AssessmentResult.DoesNotExist:
            return Response({"error": "Assessment not completed or analyzed yet."}, status=status.HTTP_400_BAD_REQUEST)

        # Get user profile for additional context
        try:
            user_profile = UserProfile.objects.get(user=user)
            profile_data = user_profile.initial_profile
        except UserProfile.DoesNotExist:
            profile_data = None

        # Prepare career roadmap data
        career_roadmap_data = {
            'assessment_id': assessment.id,
            'user_id': user.id,
            'category_scores': assessment_result.category_scores,
            'recommended_careers': assessment_result.recommended_careers,
            'timestamp': datetime.now().isoformat(),
            'action': 'career_roadmap_request'
        }

        # Trigger career roadmap webhook
        career_roadmap_success, career_roadmap_response, career_roadmap_error = trigger_career_roadmap_webhook(
            career_roadmap_data, profile_data
        )

        if not career_roadmap_success:
            return Response({
                "error": f"Failed to generate career roadmap: {career_roadmap_error}",
                "success": False
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        return Response({
            "success": True,
            "assessment_id": assessment.id,
            "career_roadmap": career_roadmap_response,
            "message": "Career roadmap generated successfully"
        }, status=status.HTTP_200_OK)
