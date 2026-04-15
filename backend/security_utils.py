"""
Security utilities for CBT system
"""
import hashlib
import uuid
import json
from django.db import transaction
from django.utils import timezone
from accounts.models import AuditLog


def generate_device_fingerprint(request):
    """Generate unique device fingerprint from request data"""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    accept_language = request.META.get('HTTP_ACCEPT_LANGUAGE', '')
    accept_encoding = request.META.get('HTTP_ACCEPT_ENCODING', '')
    ip_address = get_client_ip(request)
    
    # Create fingerprint string
    fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}|{ip_address}"
    
    # Generate hash
    fingerprint = hashlib.sha256(fingerprint_data.encode()).hexdigest()
    
    return fingerprint, {
        'user_agent': user_agent,
        'accept_language': accept_language,
        'accept_encoding': accept_encoding,
        'ip_address': ip_address
    }


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def generate_session_token():
    """Generate unique session token for exam attempt"""
    return str(uuid.uuid4())


def log_security_event(user, action, description, severity='low', request=None, 
                       device_fingerprint=None, session_token=None, model_name=None, object_id=None):
    """Log security event to audit trail"""
    ip_address = None
    user_agent = None
    
    if request:
        ip_address = get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
    
    AuditLog.objects.create(
        user=user,
        action=action,
        description=description,
        severity=severity,
        ip_address=ip_address,
        user_agent=user_agent,
        device_fingerprint=device_fingerprint,
        session_token=session_token,
        model_name=model_name,
        object_id=object_id
    )


@transaction.atomic
def submit_exam_attempt_safe(attempt, answers, request=None):
    """
    Transaction-safe exam submission with security checks
    """
    from questions.models import StudentAnswer
    from results.models import Result
    
    try:
        # Lock the attempt to prevent concurrent modifications
        attempt = ExamAttempt.objects.select_for_update().get(id=attempt.id)
        
        # Check if attempt is already submitted
        if attempt.status != 'in_progress':
            log_security_event(
                user=attempt.student,
                action='suspicious_activity',
                description=f"Attempt to submit already submitted exam attempt {attempt.id}",
                severity='medium',
                request=request
            )
            return False, "Exam already submitted"
        
        # Check if attempt is locked to different device
        device_fingerprint, _ = generate_device_fingerprint(request) if request else (None, None)
        if attempt.is_locked and attempt.device_fingerprint != device_fingerprint:
            log_security_event(
                user=attempt.student,
                action='device_lock',
                description=f"Device lock violation for attempt {attempt.id}",
                severity='high',
                request=request,
                device_fingerprint=device_fingerprint
            )
            return False, "Exam locked to different device"
        
        # Update attempt status
        attempt.status = 'submitted'
        attempt.submit_time = timezone.now()
        attempt.end_time = timezone.now()
        attempt.save()
        
        # Process answers
        total_marks = 0
        marks_obtained = 0
        correct_answers = 0
        incorrect_answers = 0
        unanswered = 0
        
        for answer_data in answers:
            question_id = answer_data.get('question_id')
            selected_option_id = answer_data.get('selected_option_id')
            answer_text = answer_data.get('answer_text', '')
            
            try:
                question = attempt.exam.questions.get(id=question_id)
                
                # Create or update student answer
                student_answer, created = StudentAnswer.objects.update_or_create(
                    attempt=attempt,
                    question=question,
                    defaults={
                        'selected_option_id': selected_option_id,
                        'answer_text': answer_text,
                    }
                )
                
                # Auto-grade objective questions
                if question.question_type in ['mcq', 'true_false']:
                    marks = student_answer.auto_grade()
                    total_marks += question.marks
                    marks_obtained += marks
                    
                    if marks > 0:
                        correct_answers += 1
                    else:
                        incorrect_answers += 1
                else:
                    total_marks += question.marks
                    unanswered += 1  # Will be graded manually
                    
            except Exception as e:
                log_security_event(
                    user=attempt.student,
                    action='suspicious_activity',
                    description=f"Invalid question {question_id} in attempt {attempt.id}: {str(e)}",
                    severity='medium',
                    request=request
                )
                continue
        
        # Calculate percentage
        percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
        
        # Update attempt with scores
        attempt.score = marks_obtained
        attempt.percentage = percentage
        attempt.save()
        
        # Create result
        Result.objects.create(
            attempt=attempt,
            exam=attempt.exam,
            student=attempt.student,
            total_marks=total_marks,
            marks_obtained=marks_obtained,
            percentage=percentage,
            is_passed=percentage >= attempt.exam.passing_marks,
            total_questions=len(answers),
            correct_answers=correct_answers,
            incorrect_answers=incorrect_answers,
            unanswered=unanswered,
            time_taken_minutes=int((attempt.submit_time - attempt.start_time).total_seconds() / 60)
        )
        
        # Log successful submission
        log_security_event(
            user=attempt.student,
            action='exam_submit',
            description=f"Exam {attempt.exam.title} submitted successfully",
            severity='low',
            request=request,
            device_fingerprint=device_fingerprint,
            model_name='ExamAttempt',
            object_id=attempt.id
        )
        
        return True, "Exam submitted successfully"
        
    except Exception as e:
        # Log transaction failure
        log_security_event(
            user=attempt.student,
            action='suspicious_activity',
            description=f"Transaction failed during exam submission: {str(e)}",
            severity='high',
            request=request
        )
        return False, f"Submission failed: {str(e)}"


def detect_multiple_devices(user, request):
    """Detect if user is accessing from multiple devices"""
    device_fingerprint, device_info = generate_device_fingerprint(request)
    
    # Check for existing active attempts from different devices
    from exams.models import ExamAttempt
    active_attempts = ExamAttempt.objects.filter(
        student=user,
        status='in_progress'
    ).exclude(device_fingerprint=device_fingerprint)
    
    if active_attempts.exists():
        # Log multiple device detection
        log_security_event(
            user=user,
            action='multiple_devices',
            description=f"User accessing from multiple devices. Current: {device_fingerprint}",
            severity='high',
            request=request,
            device_fingerprint=device_fingerprint
        )
        return True, active_attempts.count()
    
    return False, 0


def lock_exam_to_device(attempt, request):
    """Lock exam attempt to specific device"""
    device_fingerprint, device_info = generate_device_fingerprint(request)
    session_token = generate_session_token()
    
    attempt.device_fingerprint = device_fingerprint
    attempt.session_token = session_token
    attempt.ip_address = device_info['ip_address']
    attempt.user_agent = device_info['user_agent']
    attempt.is_locked = True
    attempt.save()
    
    # Log device lock
    log_security_event(
        user=attempt.student,
        action='device_lock',
        description=f"Exam {attempt.exam.title} locked to device {device_fingerprint}",
        severity='low',
        request=request,
        device_fingerprint=device_fingerprint,
        session_token=session_token,
        model_name='ExamAttempt',
        object_id=attempt.id
    )
    
    return session_token


def validate_session_token(attempt, session_token, request):
    """Validate session token for exam attempt"""
    if attempt.session_token != session_token:
        log_security_event(
            user=attempt.student,
            action='session_hijack',
            description=f"Invalid session token for attempt {attempt.id}",
            severity='critical',
            request=request
        )
        return False
    
    # Check device fingerprint
    device_fingerprint, _ = generate_device_fingerprint(request)
    if attempt.device_fingerprint != device_fingerprint:
        log_security_event(
            user=attempt.student,
            action='device_lock',
            description=f"Device fingerprint mismatch for attempt {attempt.id}",
            severity='high',
            request=request,
            device_fingerprint=device_fingerprint
        )
        return False
    
    return True
