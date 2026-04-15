from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import AuthViewSet, UserViewSet, AuditLogViewSet, DashboardStatsView, NotificationViewSet

router = SimpleRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard-stats/', DashboardStatsView.as_view({'get': 'list'})),
]
