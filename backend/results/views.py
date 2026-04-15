from rest_framework import viewsets, permissions
from .models import Result
from .serializers import ResultSerializer, ResultListSerializer, ResultDetailSerializer

class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Viewset for exam results (read-only)"""
    queryset = Result.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ResultListSerializer
        if self.action == 'retrieve':
            return ResultDetailSerializer
        return ResultSerializer
    
    def get_queryset(self):
        user = self.request.user
        exam_id = self.request.query_params.get('exam_id')
        
        queryset = Result.objects.all()
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
            
        if user.is_admin or user.is_examiner:
            return queryset
        return queryset.filter(student=user)
