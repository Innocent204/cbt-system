from django.db import models
from exams.models import Exam, ExamAttempt
from accounts.models import User

class Result(models.Model):
    """Final result for an exam attempt"""
    
    attempt = models.OneToOneField(ExamAttempt, on_delete=models.CASCADE, related_name='result')
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='results')
    
    # Scores
    total_marks = models.DecimalField(max_digits=6, decimal_places=2)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)
    
    # Pass/Fail
    is_passed = models.BooleanField(default=False)
    grade = models.CharField(max_length=5, blank=True)
    
    # Statistics
    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    incorrect_answers = models.IntegerField()
    unanswered = models.IntegerField()
    
    # Timing
    time_taken_minutes = models.IntegerField()
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'results'
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['student', '-generated_at']),
            models.Index(fields=['exam', '-percentage']),
            models.Index(fields=['is_passed']),
        ]
    
    def __str__(self):
        return f"{self.student.username} - {self.exam.title} - {self.percentage}%"
    
    @classmethod
    def calculate_grade(cls, percentage):
        """Calculate grade based on percentage"""
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B'
        elif percentage >= 60:
            return 'C'
        elif percentage >= 50:
            return 'D'
        else:
            return 'F'
    
    def save(self, *args, **kwargs):
        """Auto-calculate grade on save"""
        if not self.grade:
            self.grade = self.calculate_grade(float(self.percentage))
        super().save(*args, **kwargs)