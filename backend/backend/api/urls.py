from django.urls import path
from .views import CreateAssessmentView, SubmitAssessmentView, MentorListView, StartSessionView, PostMessageView, MentorDetailView

urlpatterns = [
    path('assessments/create/', CreateAssessmentView.as_view(), name='create-assessment'),
    path('assessments/<int:assessment_id>/submit/', SubmitAssessmentView.as_view(), name='submit-assessment'),

    # Mentorship
    path('mentors/', MentorListView.as_view(), name='mentor-list'),
    path('mentors/<int:mentor_id>/start-session/', StartSessionView.as_view(), name='start-session'),
    path('mentors/<int:mentor_id>/', MentorDetailView.as_view(), name='mentor-detail'),
    path('mentorship/sessions/<int:session_id>/messages/', PostMessageView.as_view(), name='post-message'),
]

