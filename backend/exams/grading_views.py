"""
API views for grading queue management
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from grading_queue import grading_queue, BatchGradingProcessor, queue_grading_task, get_grading_status, get_queue_statistics
from exams.models import ExamAttempt
from accounts.models import User


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def queue_grading(request):
    """Queue an exam attempt for grading"""
    data = request.data
    attempt_id = data.get('attempt_id')
    priority = data.get('priority', 'normal')
    
    if not attempt_id:
        return Response(
            {'error': 'attempt_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Verify attempt exists and user has permission
        attempt = ExamAttempt.objects.get(id=attempt_id)
        
        # Check permissions (admin/examiner can queue any attempt, students can only queue their own)
        if request.user.role not in ['admin', 'examiner'] and attempt.student != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Queue the grading task
        task = queue_grading_task(attempt_id, priority)
        
        return Response({
            'task_id': task.attempt_id,
            'priority': task.priority,
            'status': task.status,
            'message': 'Grading task queued successfully'
        })
        
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to queue grading task: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grading_status(request, attempt_id):
    """Get grading status for an exam attempt"""
    try:
        # Verify attempt exists and user has permission
        attempt = ExamAttempt.objects.get(id=attempt_id)
        
        # Check permissions
        if request.user.role not in ['admin', 'examiner'] and attempt.student != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get grading status
        status_info = get_grading_status(attempt_id)
        
        if not status_info:
            return Response(
                {'error': 'Grading task not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(status_info)
        
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def queue_statistics(request):
    """Get grading queue statistics"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        stats = get_queue_statistics()
        return Response(stats)
    except Exception as e:
        return Response(
            {'error': f'Failed to get queue statistics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def batch_process_pending(request):
    """Process all pending exam submissions in batch"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data
    exam_id = data.get('exam_id')
    batch_size = data.get('batch_size', 50)
    
    try:
        processor = BatchGradingProcessor(batch_size=batch_size)
        results = processor.process_pending_submissions(exam_id)
        
        return Response({
            'results': results,
            'message': 'Batch processing completed'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Batch processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grading_history(request):
    """Get grading history for a user"""
    user_id = request.GET.get('user_id')
    
    # Check permissions
    if request.user.role not in ['admin', 'examiner'] and str(request.user.id) != user_id:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        if user_id:
            user = User.objects.get(id=user_id)
            attempts = ExamAttempt.objects.filter(student=user).order_by('-submit_time')
        else:
            # Admin can see all history
            if request.user.role not in ['admin', 'examiner']:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            attempts = ExamAttempt.objects.all().order_by('-submit_time')[:100]
        
        history = []
        for attempt in attempts:
            # Get grading status
            grading_status = get_grading_status(attempt.id)
            
            history.append({
                'attempt_id': attempt.id,
                'exam_title': attempt.exam.title,
                'student': attempt.student.username,
                'submit_time': attempt.submit_time,
                'status': attempt.status,
                'score': float(attempt.score) if attempt.score else None,
                'percentage': float(attempt.percentage) if attempt.percentage else None,
                'grading_status': grading_status,
                'security_violations': len(attempt.security_violations),
                'suspicious_score': float(attempt.suspicious_activity_score) if attempt.suspicious_activity_score else 0.0
            })
        
        return Response({
            'history': history,
            'total_count': len(history)
        })
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_failed_grading(request):
    """Retry failed grading tasks"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data
    attempt_ids = data.get('attempt_ids', [])
    
    if not attempt_ids:
        return Response(
            {'error': 'attempt_ids is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    results = []
    for attempt_id in attempt_ids:
        try:
            # Get current status
            status_info = get_grading_status(attempt_id)
            
            if status_info and status_info.get('status') == 'failed':
                # Queue for retry
                task = queue_grading_task(attempt_id, priority='high')
                results.append({
                    'attempt_id': attempt_id,
                    'status': 'queued_for_retry',
                    'message': 'Failed task queued for retry'
                })
            else:
                results.append({
                    'attempt_id': attempt_id,
                    'status': 'not_failed',
                    'message': 'Task is not in failed status'
                })
                
        except Exception as e:
            results.append({
                'attempt_id': attempt_id,
                'status': 'error',
                'message': str(e)
            })
    
    return Response({
        'results': results,
        'message': 'Retry processing completed'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def grading_performance(request):
    """Get grading performance metrics"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # Get queue statistics
        queue_stats = get_queue_statistics()
        
        # Calculate additional metrics
        total_attempts = ExamAttempt.objects.count()
        submitted_attempts = ExamAttempt.objects.filter(status='submitted').count()
        graded_attempts = ExamAttempt.objects.filter(status='submitted', score__isnull=False).count()
        
        # Calculate grading rate
        if submitted_attempts > 0:
            grading_rate = (graded_attempts / submitted_attempts) * 100
        else:
            grading_rate = 0
        
        # Get recent performance (last 24 hours)
        from django.utils import timezone
        last_24h = timezone.now() - timezone.timedelta(hours=24)
        recent_graded = ExamAttempt.objects.filter(
            submit_time__gte=last_24h,
            score__isnull=False
        ).count()
        
        performance_metrics = {
            'queue_statistics': queue_stats,
            'overall_metrics': {
                'total_attempts': total_attempts,
                'submitted_attempts': submitted_attempts,
                'graded_attempts': graded_attempts,
                'grading_rate': round(grading_rate, 2),
                'recent_graded_24h': recent_graded
            },
            'performance_indicators': {
                'avg_processing_time': queue_stats.get('avg_processing_time', 0),
                'queue_utilization': (queue_stats.get('queue_size', 0) / queue_stats.get('max_queue_size', 1000)) * 100,
                'worker_efficiency': queue_stats.get('active_workers', 0) / queue_stats.get('max_workers', 4) * 100
            }
        }
        
        return Response(performance_metrics)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get performance metrics: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
