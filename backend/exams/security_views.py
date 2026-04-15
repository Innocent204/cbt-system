"""
Security enhanced views for exam submission and monitoring
"""
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from exams.models import ExamAttempt, Exam
from questions.models import StudentAnswer
from accounts.models import AuditLog
from security_utils import (
    submit_exam_attempt_safe,
    detect_multiple_devices,
    lock_exam_to_device,
    validate_session_token,
    log_security_event,
    generate_device_fingerprint,
    get_client_ip
)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_exam_attempt(request, exam_id):
    """Start exam attempt with security checks"""
    try:
        exam = Exam.objects.get(id=exam_id)
        
        # Check if exam is available
        if not exam.is_available:
            return Response(
                {'error': 'Exam is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check for multiple devices
        has_multiple_devices, device_count = detect_multiple_devices(request.user, request)
        if has_multiple_devices:
            return Response(
                {'error': f'Multiple devices detected ({device_count} active sessions). Please close other sessions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if student already has an active attempt
        active_attempt = ExamAttempt.objects.filter(
            exam=exam,
            student=request.user,
            status='in_progress'
        ).first()
        
        if active_attempt:
            # Validate existing attempt
            if active_attempt.is_locked:
                device_fingerprint, _ = generate_device_fingerprint(request)
                if active_attempt.device_fingerprint != device_fingerprint:
                    return Response(
                        {'error': 'Exam is locked to a different device'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            return Response({
                'attempt_id': active_attempt.id,
                'session_token': active_attempt.session_token,
                'message': 'Existing attempt resumed'
            })
        
        # Create new attempt
        with transaction.atomic():
            # Get attempt number
            last_attempt = ExamAttempt.objects.filter(
                exam=exam,
                student=request.user
            ).order_by('-attempt_number').first()
            
            attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1
            
            if attempt_number > exam.max_attempts:
                return Response(
                    {'error': 'Maximum attempts exceeded'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create attempt
            attempt = ExamAttempt.objects.create(
                exam=exam,
                student=request.user,
                attempt_number=attempt_number,
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Lock to device
            session_token = lock_exam_to_device(attempt, request)
            
            # Log exam start
            log_security_event(
                user=request.user,
                action='exam_start',
                description=f"Started exam {exam.title}",
                severity='low',
                request=request,
                device_fingerprint=attempt.device_fingerprint,
                session_token=session_token,
                model_name='ExamAttempt',
                object_id=attempt.id
            )
            
            return Response({
                'attempt_id': attempt.id,
                'session_token': session_token,
                'message': 'Exam started successfully'
            })
            
    except Exam.DoesNotExist:
        return Response(
            {'error': 'Exam not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        log_security_event(
            user=request.user,
            action='suspicious_activity',
            description=f"Error starting exam: {str(e)}",
            severity='medium',
            request=request
        )
        return Response(
            {'error': 'Failed to start exam'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_exam(request, attempt_id):
    """Submit exam with transaction safety"""
    try:
        attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        
        # Validate session token
        session_token = request.data.get('session_token')
        if not session_token or not validate_session_token(attempt, session_token, request):
            return Response(
                {'error': 'Invalid session or device'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get answers
        answers = request.data.get('answers', [])
        if not answers:
            return Response(
                {'error': 'No answers provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Submit with transaction safety
        success, message = submit_exam_attempt_safe(attempt, answers, request)
        
        if success:
            return Response({
                'message': message,
                'score': float(attempt.score),
                'percentage': float(attempt.percentage)
            })
        else:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        log_security_event(
            user=request.user,
            action='suspicious_activity',
            description=f"Error submitting exam: {str(e)}",
            severity='high',
            request=request
        )
        return Response(
            {'error': 'Failed to submit exam'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_tab_switch(request, attempt_id):
    """Log tab switching during exam"""
    try:
        attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        
        # Validate session token
        session_token = request.data.get('session_token')
        if not session_token or not validate_session_token(attempt, session_token, request):
            return Response(
                {'error': 'Invalid session or device'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Increment tab switch count
        attempt.tab_switch_count += 1
        attempt.save()
        
        # Log security event
        log_security_event(
            user=request.user,
            action='tab_switch',
            description=f"Tab switch detected during exam {attempt.exam.title}. Total: {attempt.tab_switch_count}",
            severity='medium' if attempt.tab_switch_count <= 3 else 'high',
            request=request,
            device_fingerprint=attempt.device_fingerprint,
            session_token=session_token,
            model_name='ExamAttempt',
            object_id=attempt.id
        )
        
        # Add to security violations if too many switches
        if attempt.tab_switch_count > 5:
            attempt.security_violations.append({
                'type': 'excessive_tab_switching',
                'count': attempt.tab_switch_count,
                'timestamp': timezone.now().isoformat()
            })
            attempt.save()
        
        return Response({
            'message': 'Tab switch logged',
            'tab_switch_count': attempt.tab_switch_count
        })
        
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_exam_security_status(request, attempt_id):
    """Get security status for exam attempt"""
    try:
        attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        
        # Validate session token
        session_token = request.GET.get('session_token')
        if not session_token or not validate_session_token(attempt, session_token, request):
            return Response(
                {'error': 'Invalid session or device'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get recent security events
        recent_events = AuditLog.objects.filter(
            user=request.user,
            model_name='ExamAttempt',
            object_id=attempt.id,
            timestamp__gte=attempt.start_time
        ).order_by('-timestamp')[:10]
        
        security_status = {
            'is_locked': attempt.is_locked,
            'device_fingerprint': attempt.device_fingerprint,
            'tab_switch_count': attempt.tab_switch_count,
            'security_violations': attempt.security_violations,
            'recent_events': [
                {
                    'action': event.action,
                    'description': event.description,
                    'severity': event.severity,
                    'timestamp': event.timestamp
                }
                for event in recent_events
            ]
        }
        
        return Response(security_status)
        
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def heartbeat(request, attempt_id):
    """Receive heartbeat from exam client to detect connection issues"""
    try:
        attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        
        # Validate session token
        session_token = request.data.get('session_token')
        if not session_token or not validate_session_token(attempt, session_token, request):
            return Response(
                {'error': 'Invalid session or device'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update last activity
        attempt.last_activity = timezone.now()
        attempt.save()
        
        return Response({
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'time_remaining': attempt.time_remaining
        })
        
    except ExamAttempt.DoesNotExist:
        return Response(
            {'error': 'Exam attempt not found'},
            status=status.HTTP_404_NOT_FOUND
        )
