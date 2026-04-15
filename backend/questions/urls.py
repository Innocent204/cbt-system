from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import QuestionViewSet, StudentAnswerViewSet
from . import pool_views

router = SimpleRouter()
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'answers', StudentAnswerViewSet, basename='answer')

urlpatterns = [
    path('', include(router.urls)),
    # Question pool endpoints
    path('pools/', pool_views.question_banks, name='question_banks'),
    path('pools/<int:bank_id>/', pool_views.question_bank_detail, name='question_bank_detail'),
    path('pools/<int:bank_id>/analytics/', pool_views.bank_analytics, name='bank_analytics'),
    # Exam template endpoints
    path('templates/', pool_views.exam_templates, name='exam_templates'),
    path('templates/<int:template_id>/optimize/', pool_views.template_optimization, name='template_optimization'),
    path('templates/generate/', pool_views.generate_exam, name='generate_exam'),
]
