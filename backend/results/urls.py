from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import ResultViewSet

router = SimpleRouter()
router.register(r'results', ResultViewSet, basename='result')

urlpatterns = [
    path('', include(router.urls)),
]
