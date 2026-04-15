"""
Security dashboard views for administrators
"""
from django.db.models import Count, Avg, Max, Min, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from accounts.models import AuditLog, User
from exams.models import ExamAttempt, Exam
from questions.models import Question
from results.models import Result


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def security_dashboard(request):
    """Main security dashboard with comprehensive analytics"""
    if not request.user.is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Time ranges
    now = timezone.now()
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    last_30d = now - timedelta(days=30)
    
    # Security metrics
    dashboard_data = {
        'overview': get_security_overview(last_24h, last_7d, last_30d),
        'recent_violations': get_recent_security_violations(last_24h),
        'high_risk_attempts': get_high_risk_attempts(),
        'exam_security_stats': get_exam_security_stats(),
        'user_behavior_patterns': get_user_behavior_patterns(last_7d),
        'system_health': get_system_health_metrics(),
        'recommendations': get_security_recommendations()
    }
    
    return Response(dashboard_data)


def get_security_overview(last_24h, last_7d, last_30d):
    """Get security overview metrics"""
    return {
        'last_24h': {
            'total_attempts': ExamAttempt.objects.filter(start_time__gte=last_24h).count(),
            'security_violations': AuditLog.objects.filter(
                timestamp__gte=last_24h,
                action__in=['tab_switch', 'security_violation', 'multiple_devices']
            ).count(),
            'high_risk_attempts': ExamAttempt.objects.filter(
                start_time__gte=last_24h,
                suspicious_activity_score__gte=0.6
            ).count(),
            'webcam_monitored': ExamAttempt.objects.filter(
                start_time__gte=last_24h,
                webcam_monitored=True
            ).count(),
        },
        'last_7d': {
            'total_attempts': ExamAttempt.objects.filter(start_time__gte=last_7d).count(),
            'security_violations': AuditLog.objects.filter(
                timestamp__gte=last_7d,
                action__in=['tab_switch', 'security_violation', 'multiple_devices']
            ).count(),
            'high_risk_attempts': ExamAttempt.objects.filter(
                start_time__gte=last_7d,
                suspicious_activity_score__gte=0.6
            ).count(),
        },
        'last_30d': {
            'total_attempts': ExamAttempt.objects.filter(start_time__gte=last_30d).count(),
            'security_violations': AuditLog.objects.filter(
                timestamp__gte=last_30d,
                action__in=['tab_switch', 'security_violation', 'multiple_devices']
            ).count(),
            'high_risk_attempts': ExamAttempt.objects.filter(
                start_time__gte=last_30d,
                suspicious_activity_score__gte=0.6
            ).count(),
        }
    }


def get_recent_security_violations(last_24h):
    """Get recent security violations"""
    violations = AuditLog.objects.filter(
        timestamp__gte=last_24h,
        action__in=['tab_switch', 'security_violation', 'multiple_devices', 'device_lock']
    ).order_by('-timestamp')[:20]
    
    return [
        {
            'id': v.id,
            'user': v.user.username,
            'action': v.action,
            'description': v.description,
            'severity': v.severity,
            'timestamp': v.timestamp,
            'ip_address': v.ip_address,
            'device_fingerprint': v.device_fingerprint[:16] + '...' if v.device_fingerprint else None
        }
        for v in violations
    ]


def get_high_risk_attempts():
    """Get high-risk exam attempts"""
    attempts = ExamAttempt.objects.filter(
        suspicious_activity_score__gte=0.6,
        status='in_progress'
    ).order_by('-suspicious_activity_score')[:10]
    
    return [
        {
            'id': a.id,
            'student': a.student.username,
            'exam': a.exam.title,
            'suspicious_score': float(a.suspicious_activity_score),
            'tab_switches': a.tab_switch_count,
            'face_detection_failures': a.face_detection_count,
            'afk_events': a.away_from_keyboard_count,
            'start_time': a.start_time,
            'risk_level': get_risk_level(a.suspicious_activity_score)
        }
        for a in attempts
    ]


def get_exam_security_stats():
    """Get security statistics by exam"""
    exams = Exam.objects.annotate(
        total_attempts=Count('attempts'),
        avg_suspicious_score=Avg('attempts__suspicious_activity_score'),
        max_suspicious_score=Max('attempts__suspicious_activity_score'),
        total_violations=Count('attempts__security_violations')
    ).filter(total_attempts__gt=0).order_by('-avg_suspicious_score')[:10]
    
    return [
        {
            'exam_id': e.id,
            'exam_title': e.title,
            'course': e.course.name,
            'total_attempts': e.total_attempts,
            'avg_suspicious_score': float(e.avg_suspicious_score) or 0.0,
            'max_suspicious_score': float(e.max_suspicious_score) or 0.0,
            'total_violations': e.total_violations,
            'risk_level': get_risk_level(e.avg_suspicious_score or 0.0)
        }
        for e in exams
    ]


def get_user_behavior_patterns(last_7d):
    """Analyze user behavior patterns"""
    users = User.objects.annotate(
        recent_attempts=Count('exam_attempts', filter=Q(exam_attempts__start_time__gte=last_7d)),
        avg_suspicious_score=Avg('exam_attempts__suspicious_activity_score', filter=Q(exam_attempts__start_time__gte=last_7d)),
        total_violations=Count('audit_logs', filter=Q(audit_logs__timestamp__gte=last_7d, audit_logs__action__in=['tab_switch', 'security_violation']))
    ).filter(recent_attempts__gt=0).order_by('-avg_suspicious_score')[:15]
    
    return [
        {
            'user_id': u.id,
            'username': u.username,
            'email': u.email,
            'role': u.role,
            'recent_attempts': u.recent_attempts,
            'avg_suspicious_score': float(u.avg_suspicious_score) or 0.0,
            'total_violations': u.total_violations,
            'risk_level': get_risk_level(u.avg_suspicious_score or 0.0)
        }
        for u in users
    ]


def get_system_health_metrics():
    """Get system health and performance metrics"""
    now = timezone.now()
    last_hour = now - timedelta(hours=1)
    
    return {
        'active_attempts': ExamAttempt.objects.filter(status='in_progress').count(),
        'attempts_last_hour': ExamAttempt.objects.filter(start_time__gte=last_hour).count(),
        'avg_response_time': 0.5,  # Placeholder - would need actual monitoring
        'system_load': 45.2,  # Placeholder - would need actual monitoring
        'database_connections': 12,  # Placeholder - would need actual monitoring
        'error_rate': 0.02,  # Placeholder - would need actual monitoring
        'storage_usage': '2.3 GB / 10 GB',
        'last_cleanup': AuditLog.objects.filter(action='cleanup').order_by('-timestamp').first().timestamp if AuditLog.objects.filter(action='cleanup').exists() else None
    }


def get_security_recommendations():
    """Generate security recommendations based on current data"""
    recommendations = []
    
    # Check for high violation rates
    recent_violations = AuditLog.objects.filter(
        timestamp__gte=timezone.now() - timedelta(hours=24),
        severity='high'
    ).count()
    
    if recent_violations > 10:
        recommendations.append({
            'priority': 'high',
            'category': 'security_incidents',
            'message': f'High number of security violations ({recent_violations}) in last 24 hours',
            'action': 'Review recent audit logs and consider additional security measures'
        })
    
    # Check for suspicious attempts
    high_risk_count = ExamAttempt.objects.filter(
        suspicious_activity_score__gte=0.8,
        status='in_progress'
    ).count()
    
    if high_risk_count > 5:
        recommendations.append({
            'priority': 'critical',
            'category': 'exam_integrity',
            'message': f'{high_risk_count} high-risk exam attempts currently in progress',
            'action': 'Immediate review recommended - potential cheating detected'
        })
    
    # Check for system performance
    active_attempts = ExamAttempt.objects.filter(status='in_progress').count()
    if active_attempts > 100:
        recommendations.append({
            'priority': 'medium',
            'category': 'performance',
            'message': f'High system load: {active_attempts} concurrent exam attempts',
            'action': 'Monitor system performance and consider load balancing'
        })
    
    # Check for old audit logs
    old_logs_count = AuditLog.objects.filter(
        timestamp__lte=timezone.now() - timedelta(days=90)
    ).count()
    
    if old_logs_count > 10000:
        recommendations.append({
            'priority': 'low',
            'category': 'maintenance',
            'message': f'{old_logs_count} audit logs older than 90 days',
            'action': 'Run cleanup command to archive old logs'
        })
    
    return recommendations


def get_risk_level(score):
    """Get risk level based on score"""
    if score >= 0.8:
        return 'critical'
    elif score >= 0.6:
        return 'high'
    elif score >= 0.4:
        return 'medium'
    elif score >= 0.2:
        return 'low'
    else:
        return 'minimal'


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def security_timeline(request):
    """Get security events timeline"""
    if not request.user.is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    hours = int(request.GET.get('hours', 24))
    since = timezone.now() - timedelta(hours=hours)
    
    events = AuditLog.objects.filter(
        timestamp__gte=since,
        action__in=['tab_switch', 'security_violation', 'multiple_devices', 'device_lock', 'exam_start', 'exam_submit']
    ).order_by('-timestamp')
    
    timeline = []
    for event in events:
        timeline.append({
            'timestamp': event.timestamp,
            'type': event.action,
            'severity': event.severity,
            'user': event.user.username,
            'description': event.description,
            'details': {
                'ip_address': event.ip_address,
                'device_fingerprint': event.device_fingerprint[:16] + '...' if event.device_fingerprint else None,
                'model_name': event.model_name,
                'object_id': event.object_id
            }
        })
    
    return Response({
        'timeline': timeline,
        'summary': {
            'total_events': len(timeline),
            'high_severity': len([e for e in timeline if e['severity'] in ['high', 'critical']]),
            'unique_users': len(set(e['user'] for e in timeline))
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_security_profile(request, user_id):
    """Get detailed security profile for a specific user"""
    if not request.user.is_admin:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get user's exam attempts
    attempts = ExamAttempt.objects.filter(student=user).order_by('-start_time')
    
    # Get user's security events
    security_events = AuditLog.objects.filter(
        user=user,
        action__in=['tab_switch', 'security_violation', 'multiple_devices', 'device_lock']
    ).order_by('-timestamp')[:50]
    
    # Calculate statistics
    profile = {
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'date_joined': user.date_joined
        },
        'exam_statistics': {
            'total_attempts': attempts.count(),
            'completed_attempts': attempts.filter(status='submitted').count(),
            'avg_suspicious_score': float(attempts.aggregate(avg=Avg('suspicious_activity_score'))['avg'] or 0),
            'max_suspicious_score': float(attempts.aggregate(max=Max('suspicious_activity_score'))['max'] or 0),
            'total_tab_switches': attempts.aggregate(total=Count('tab_switch_count'))['total'] or 0,
            'total_violations': sum(len(a.security_violations) for a in attempts)
        },
        'recent_activity': [
            {
                'timestamp': a.start_time,
                'exam': a.exam.title,
                'status': a.status,
                'suspicious_score': float(a.suspicious_activity_score),
                'tab_switches': a.tab_switch_count,
                'violations': len(a.security_violations)
            }
            for a in attempts[:10]
        ],
        'security_events': [
            {
                'timestamp': e.timestamp,
                'action': e.action,
                'description': e.description,
                'severity': e.severity,
                'ip_address': e.ip_address,
                'device_fingerprint': e.device_fingerprint
            }
            for e in security_events
        ],
        'risk_assessment': {
            'current_risk_level': get_risk_level(
                attempts.aggregate(avg=Avg('suspicious_activity_score'))['avg'] or 0
            ),
            'trend': 'increasing' if attempts.filter(suspicious_activity_score__gte=0.6).count() > 3 else 'stable',
            'recommendations': generate_user_recommendations(user, attempts)
        }
    }
    
    return Response(profile)


def generate_user_recommendations(user, attempts):
    """Generate specific recommendations for a user"""
    recommendations = []
    
    high_score_attempts = attempts.filter(suspicious_activity_score__gte=0.6)
    
    if high_score_attempts.count() > 2:
        recommendations.append({
            'priority': 'high',
            'message': 'Multiple high-risk attempts detected',
            'action': 'Consider requiring in-person verification for future exams'
        })
    
    if attempts.filter(tab_switch_count__gt=5).count() > 0:
        recommendations.append({
            'priority': 'medium',
            'message': 'Excessive tab switching detected',
            'action': 'Educate user on exam rules and monitor future attempts'
        })
    
    return recommendations
