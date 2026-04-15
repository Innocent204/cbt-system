from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import CourseViewSet, ExamViewSet, ExamAttemptViewSet
from . import security_views, dashboard_views, grading_views

router = SimpleRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'attempts', ExamAttemptViewSet, basename='attempt')

urlpatterns = [
    path('', include(router.urls)),
    # Security endpoints
    path('attempts/<int:exam_id>/start/', security_views.start_exam_attempt, name='start_exam_attempt'),
    path('attempts/<int:attempt_id>/submit/', security_views.submit_exam, name='submit_exam'),
    path('attempts/<int:attempt_id>/log-tab-switch/', security_views.log_tab_switch, name='log_tab_switch'),
    path('attempts/<int:attempt_id>/security-status/', security_views.get_exam_security_status, name='get_security_status'),
    path('attempts/<int:attempt_id>/heartbeat/', security_views.heartbeat, name='exam_heartbeat'),
    # Dashboard endpoints
    path('security/dashboard/', dashboard_views.security_dashboard, name='security_dashboard'),
    path('security/timeline/', dashboard_views.security_timeline, name='security_timeline'),
    path('security/user/<int:user_id>/', dashboard_views.user_security_profile, name='user_security_profile'),
    # Grading queue endpoints
    path('grading/queue/', grading_views.queue_grading, name='queue_grading'),
    path('grading/status/<int:attempt_id>/', grading_views.grading_status, name='grading_status'),
    path('grading/statistics/', grading_views.queue_statistics, name='queue_statistics'),
    path('grading/batch-process/', grading_views.batch_process_pending, name='batch_process_pending'),
    path('grading/history/', grading_views.grading_history, name='grading_history'),
    path('grading/retry-failed/', grading_views.retry_failed_grading, name='retry_failed_grading'),
    path('grading/performance/', grading_views.grading_performance, name='grading_performance'),
]
