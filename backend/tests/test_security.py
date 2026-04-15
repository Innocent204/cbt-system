"""
Test suite for security utilities
"""
import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock
from datetime import timedelta

from accounts.models import AuditLog
from exams.models import Exam, ExamAttempt, Course
from questions.models import Question, Option
from security_utils import (
    generate_device_fingerprint,
    get_client_ip,
    log_security_event,
    submit_exam_attempt_safe,
    detect_multiple_devices,
    lock_exam_to_device,
    validate_session_token
)

User = get_user_model()


class SecurityUtilsTestCase(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student'
        )
        self.course = Course.objects.create(
            name='Test Course',
            code='TEST101',
            created_by=self.user
        )
        self.exam = Exam.objects.create(
            title='Test Exam',
            course=self.course,
            duration_minutes=60,
            total_marks=100,
            passing_marks=50,
            created_by=self.user
        )
        
        # Create test questions
        self.question = Question.objects.create(
            exam=self.exam,
            question_type='mcq',
            text='Test question',
            marks=10,
            order=1,
            created_by=self.user
        )
        
        self.option1 = Option.objects.create(
            question=self.question,
            text='Option 1',
            is_correct=True,
            order=1
        )
        
        self.option2 = Option.objects.create(
            question=self.question,
            text='Option 2',
            is_correct=False,
            order=2
        )

    def test_generate_device_fingerprint(self):
        """Test device fingerprint generation"""
        request = self.factory.get('/', HTTP_USER_AGENT='Mozilla/5.0')
        fingerprint, device_info = generate_device_fingerprint(request)
        
        self.assertIsInstance(fingerprint, str)
        self.assertEqual(len(fingerprint), 64)  # SHA256 hex length
        self.assertIn('user_agent', device_info)
        self.assertIn('ip_address', device_info)

    def test_get_client_ip(self):
        """Test client IP extraction"""
        request = self.factory.get('/', REMOTE_ADDR='192.168.1.1')
        ip = get_client_ip(request)
        self.assertEqual(ip, '192.168.1.1')

    def test_log_security_event(self):
        """Test security event logging"""
        request = self.factory.get('/')
        log_security_event(
            user=self.user,
            action='tab_switch',
            description='Test tab switch',
            severity='medium',
            request=request
        )
        
        event = AuditLog.objects.filter(user=self.user, action='tab_switch').first()
        self.assertIsNotNone(event)
        self.assertEqual(event.description, 'Test tab switch')
        self.assertEqual(event.severity, 'medium')

    def test_detect_multiple_devices(self):
        """Test multiple device detection"""
        # Create attempt with different fingerprint
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user,
            device_fingerprint='different_fingerprint'
        )
        
        request = self.factory.get('/', HTTP_USER_AGENT='Different Browser')
        has_multiple, count = detect_multiple_devices(self.user, request)
        
        self.assertTrue(has_multiple)
        self.assertEqual(count, 1)

    def test_lock_exam_to_device(self):
        """Test device locking"""
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user
        )
        
        request = self.factory.get('/', HTTP_USER_AGENT='Test Browser')
        session_token = lock_exam_to_device(attempt, request)
        
        # Verify attempt is locked
        attempt.refresh_from_db()
        self.assertTrue(attempt.is_locked)
        self.assertIsNotNone(attempt.device_fingerprint)
        self.assertIsNotNone(attempt.session_token)
        self.assertEqual(session_token, attempt.session_token)

    def test_validate_session_token(self):
        """Test session token validation"""
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user,
            device_fingerprint='test_fingerprint',
            session_token='test_token',
            is_locked=True
        )
        
        # Valid request
        request = self.factory.get('/', HTTP_USER_AGENT='Test Browser')
        with patch('security_utils.generate_device_fingerprint') as mock_fingerprint:
            mock_fingerprint.return_value = ('test_fingerprint', {})
            is_valid = validate_session_token(attempt, 'test_token', request)
            self.assertTrue(is_valid)
        
        # Invalid token
        is_valid = validate_session_token(attempt, 'wrong_token', request)
        self.assertFalse(is_valid)

    def test_submit_exam_attempt_safe(self):
        """Test transaction-safe exam submission"""
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user,
            device_fingerprint='test_fingerprint',
            session_token='test_token',
            is_locked=True
        )
        
        answers = [
            {
                'question_id': self.question.id,
                'selected_option_id': self.option1.id
            }
        ]
        
        request = self.factory.post('/')
        with patch('security_utils.generate_device_fingerprint') as mock_fingerprint:
            mock_fingerprint.return_value = ('test_fingerprint', {})
            
            success, message = submit_exam_attempt_safe(attempt, answers, request)
            
            self.assertTrue(success)
            self.assertEqual(message, 'Exam submitted successfully')
            
            # Verify attempt is submitted
            attempt.refresh_from_db()
            self.assertEqual(attempt.status, 'submitted')
            self.assertIsNotNone(attempt.submit_time)
            self.assertEqual(float(attempt.score), 10.0)

    def test_submit_exam_attempt_locked_device_violation(self):
        """Test submission from wrong device"""
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user,
            device_fingerprint='original_fingerprint',
            session_token='test_token',
            is_locked=True
        )
        
        answers = [
            {
                'question_id': self.question.id,
                'selected_option_id': self.option1.id
            }
        ]
        
        request = self.factory.post('/')
        with patch('security_utils.generate_device_fingerprint') as mock_fingerprint:
            mock_fingerprint.return_value = ('different_fingerprint', {})
            
            success, message = submit_exam_attempt_safe(attempt, answers, request)
            
            self.assertFalse(success)
            self.assertEqual(message, 'Exam locked to different device')


class SecurityIntegrationTestCase(TestCase):
    """Integration tests for security features"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='student'
        )
        self.course = Course.objects.create(
            name='Test Course',
            code='TEST101',
            created_by=self.user
        )
        self.exam = Exam.objects.create(
            title='Test Exam',
            course=self.course,
            duration_minutes=60,
            total_marks=100,
            passing_marks=50,
            created_by=self.user
        )

    def test_exam_security_workflow(self):
        """Test complete exam security workflow"""
        # 1. Start exam with device locking
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.user
        )
        
        request = self.factory.post('/', HTTP_USER_AGENT='Test Browser')
        session_token = lock_exam_to_device(attempt, request)
        
        # 2. Log security event
        log_security_event(
            user=self.user,
            action='exam_start',
            description=f'Started exam {self.exam.title}',
            severity='low',
            request=request,
            session_token=session_token
        )
        
        # 3. Validate session
        is_valid = validate_session_token(attempt, session_token, request)
        self.assertTrue(is_valid)
        
        # 4. Submit exam
        answers = []
        success, message = submit_exam_attempt_safe(attempt, answers, request)
        self.assertTrue(success)
        
        # 5. Verify audit trail
        events = AuditLog.objects.filter(user=self.user).order_by('-timestamp')
        self.assertEqual(events.count(), 2)
        self.assertEqual(events[0].action, 'exam_submit')
        self.assertEqual(events[1].action, 'exam_start')
