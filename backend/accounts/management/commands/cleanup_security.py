"""
Management commands for security features
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import AuditLog
from exams.models import ExamAttempt


class Command(BaseCommand):
    help = 'Clean up expired security sessions and old audit logs'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to keep audit logs (default: 30)'
        )
        parser.add_argument(
            '--expired-only',
            action='store_true',
            help='Only clean expired sessions, not audit logs'
        )

    def handle(self, *args, **options):
        days = options['days']
        expired_only = options['expired_only']
        
        # Clean expired exam attempts
        expired_attempts = ExamAttempt.objects.filter(
            status='in_progress',
            start_time__lt=timezone.now() - timedelta(hours=24)
        )
        
        expired_count = expired_attempts.count()
        if expired_count > 0:
            # Auto-submit expired attempts
            for attempt in expired_attempts:
                attempt.status = 'auto_submitted'
                attempt.end_time = timezone.now()
                attempt.submit_time = timezone.now()
                attempt.save()
                
                # Log auto-submission
                AuditLog.objects.create(
                    user=attempt.student,
                    action='auto_submit',
                    description=f'Exam auto-submitted due to timeout (attempt {attempt.id})',
                    severity='medium',
                    model_name='ExamAttempt',
                    object_id=attempt.id
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'Auto-submitted {expired_count} expired exam attempts')
            )
        else:
            self.stdout.write(self.style.SUCCESS('No expired exam attempts found'))
        
        if not expired_only:
            # Clean old audit logs
            cutoff_date = timezone.now() - timedelta(days=days)
            old_logs = AuditLog.objects.filter(timestamp__lt=cutoff_date)
            
            old_count = old_logs.count()
            if old_count > 0:
                old_logs.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Deleted {old_count} audit logs older than {days} days')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'No audit logs older than {days} days found')
                )
        
        # Clean unresolved low-priority security events
        resolved_count = AuditLog.objects.filter(
            severity='low',
            is_resolved=False,
            timestamp__lt=timezone.now() - timedelta(days=7)
        ).update(is_resolved=True, resolved_at=timezone.now())
        
        if resolved_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'Auto-resolved {resolved_count} low-priority security events')
            )
