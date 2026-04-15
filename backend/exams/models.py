from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User

class Course(models.Model):
    """Course model for organizing exams"""
    
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='courses_created')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'courses'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Exam(models.Model):
    """Exam model with configuration options"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='exams_created')
    
    # Exam Configuration
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(480)])
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    passing_marks = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Exam Behavior
    randomize_questions = models.BooleanField(default=False)
    randomize_options = models.BooleanField(default=False)
    show_results_immediately = models.BooleanField(default=True)
    allow_review = models.BooleanField(default=True)
    max_attempts = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    
    # Scheduling
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exams'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['course', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['start_time', 'end_time']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.course.code}"
    
    @property
    def question_count(self):
        return self.questions.count()
    
    @property
    def is_available(self):
        from django.utils import timezone
        now = timezone.now()
        
        if not self.is_active or self.status != 'published':
            return False
        
        if self.start_time and now < self.start_time:
            return False
        
        if self.end_time and now > self.end_time:
            return False
        
        return True


class ExamAttempt(models.Model):
    """Track student exam attempts"""
    
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('auto_submitted', 'Auto Submitted'),
    ]
    
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exam_attempts')
    
    attempt_number = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    submit_time = models.DateTimeField(null=True, blank=True)
    
    score = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Track progress
    last_activity = models.DateTimeField(auto_now=True)
    
    # Security and Device Locking
    device_fingerprint = models.CharField(max_length=255, null=True, blank=True, help_text="Unique browser/device identifier")
    session_token = models.CharField(max_length=255, unique=True, null=True, blank=True, help_text="Unique session identifier")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    tab_switch_count = models.IntegerField(default=0, help_text="Number of tab switches detected")
    security_violations = models.JSONField(default=list, help_text="List of security violations")
    is_locked = models.BooleanField(default=False, help_text="Lock attempt to prevent multiple devices")
    
    # Enhanced Security Monitoring
    webcam_monitored = models.BooleanField(default=False, help_text="Webcam monitoring flag (simulated)")
    face_detection_count = models.IntegerField(default=0, help_text="Number of face detection events")
    away_from_keyboard_count = models.IntegerField(default=0, help_text="Number of AFK events")
    mouse_movement_pattern = models.JSONField(default=dict, help_text="Mouse movement analysis data")
    keystroke_pattern = models.JSONField(default=dict, help_text="Keystroke timing analysis")
    suspicious_activity_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="AI-calculated suspiciousness score")
    proctoring_log = models.JSONField(default=list, help_text="Detailed proctoring events")
    
    class Meta:
        db_table = 'exam_attempts'
        ordering = ['-start_time']
        unique_together = ['exam', 'student', 'attempt_number']
        indexes = [
            models.Index(fields=['student', 'exam']),
            models.Index(fields=['status', '-start_time']),
            models.Index(fields=['device_fingerprint']),
            models.Index(fields=['session_token']),
            models.Index(fields=['is_locked']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.exam.title} - Attempt {self.attempt_number}"
    
    @property
    def is_timed_out(self):
        from django.utils import timezone
        if self.status != 'in_progress':
            return False
        
        elapsed = (timezone.now() - self.start_time).total_seconds() / 60
        return elapsed >= self.exam.duration_minutes
    
    @property
    def time_remaining(self):
        from django.utils import timezone
        if self.status != 'in_progress':
            return 0
        
        elapsed = (timezone.now() - self.start_time).total_seconds() / 60
        remaining = self.exam.duration_minutes - elapsed
        return max(0, remaining)