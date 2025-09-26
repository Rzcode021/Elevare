
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
import requests
from .models import UserProfile, Assessment, AssessmentQuestion, UserAnswer, AssessmentResult
from .serializers import SanitizedAssessmentQuestionSerializer
from .serializers import MentorSerializer, MentorshipSessionSerializer, MentorMessageSerializer
from .models import Mentor, MentorshipSession, MentorMessage
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

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

        # 3. Trigger the n8n workflow to generate questions. For dev/hackathon,
        # send a request asking for a set of 10-15 questions. If the webhook is not
        # configured or fails in DEBUG, fall back to locally generated sample questions.
        questions_data = None
        webhook_url = getattr(settings, 'N8N_ASSESSMENT_WEBHOOK_URL', '')
        desired_questions = request.data.get('num_questions') or 12  # default to 12

        if webhook_url:
            try:
                payload = {
                    'initial_profile': initial_profile,
                    'num_questions': desired_questions,
                    'min_questions': 10,
                    'max_questions': 15,
                }
                n8n_response = requests.post(webhook_url, json=payload, timeout=10)
                n8n_response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
                questions_data = n8n_response.json()
            except requests.exceptions.RequestException as e:
                # If external service fails, fallback to sample questions in dev mode
                if not getattr(settings, 'DEBUG', False):
                    return Response({"error": f"Failed to connect to AI service: {e}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        if questions_data is None:
            # Local sample questions for quick demo/hackathon use (12 questions)
            questions_data = [
                {"questionText": "What is 2 + 2?", "options": ["1","2","3","4"], "category": "Math", "correctAnswer": "4"},
                {"questionText": "Which of these do you enjoy?", "options": ["Reading","Coding","Sports","Art"], "category": "Interests", "correctAnswer": None},
                {"questionText": "Rate your interest in problem solving (1-5)", "options": ["1","2","3","4","5"], "category": "Logical Reasoning", "correctAnswer": None},
                {"questionText": "Which subject do you prefer?", "options": ["Math","Science","History","Art"], "category": "Subject Aptitude", "correctAnswer": None},
                {"questionText": "Do you enjoy working with numbers?", "options": ["Yes","No"], "category": "Math", "correctAnswer": None},
                {"questionText": "Choose the task you prefer", "options": ["Design","Analyze data","Write code","Teach"], "category": "Interests", "correctAnswer": None},
                {"questionText": "Rate your interest in teamwork (1-5)", "options": ["1","2","3","4","5"], "category": "Personality", "correctAnswer": None},
                {"questionText": "Which tool sounds fun to you?", "options": ["Spreadsheets","3D modeling","Text editors","Cameras"], "category": "Interests", "correctAnswer": None},
                {"questionText": "Do you enjoy solving puzzles?", "options": ["Yes","Sometimes","Rarely","No"], "category": "Logical Reasoning", "correctAnswer": None},
                {"questionText": "Rate your comfort with public speaking (1-5)", "options": ["1","2","3","4","5"], "category": "Personality", "correctAnswer": None},
                {"questionText": "Would you prefer a desk job or a hands-on role?", "options": ["Desk","Hands-on","Field","Mixed"], "category": "Interests", "correctAnswer": None},
                {"questionText": "How much do you enjoy creative tasks? (1-5)", "options": ["1","2","3","4","5"], "category": "Creativity", "correctAnswer": None},
            ]

        # 4. Save the assessment and questions securely in the database
        try:
            with transaction.atomic():
                # Create a new assessment session
                assessment = Assessment.objects.create(user=user, status='pending')

                # Create question objects from the n8n response
                questions_to_create = []
                for q_data in questions_data:
                    questions_to_create.append(
                        AssessmentQuestion(
                            assessment=assessment,
                            question_text=q_data.get('questionText'),
                            options=q_data.get('options'),
                            category=q_data.get('category'),
                            correct_answer=q_data.get('correctAnswer') # Save the answer securely
                        )
                    )
                AssessmentQuestion.objects.bulk_create(questions_to_create)
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
                # simple equality check (could be enhanced)
                is_correct = str(selected).strip().lower() == str(q.correct_answer).strip().lower()

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

        # Call analysis webhook or fallback to local simple analysis
        analysis_payload = {
            'category_scores': category_scores,
            'personality_traits': personality_traits,
        }

        analysis_result = None
        N8N_ANALYSIS_WEBHOOK_URL = getattr(settings, 'N8N_ANALYSIS_WEBHOOK_URL', None)
        if N8N_ANALYSIS_WEBHOOK_URL and 'YOUR_N8N' not in N8N_ANALYSIS_WEBHOOK_URL:
            try:
                resp = requests.post(N8N_ANALYSIS_WEBHOOK_URL, json=analysis_payload, timeout=6)
                resp.raise_for_status()
                analysis_result = resp.json()
            except requests.exceptions.RequestException:
                analysis_result = None

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

        return Response({
            'assessment_id': assessment.id,
            'category_scores': category_scores,
            'recommendations': analysis_result.get('recommendations', []),
            'explanation': analysis_result.get('explanation', '')
        }, status=status.HTTP_200_OK)


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
