from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from exams.models import Exam, ExamAttempt, Course
from accounts.models import User

class QuestionBank(models.Model):
    """Organized collection of questions for random generation"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='question_banks')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='question_banks_created')
    is_active = models.BooleanField(default=True)

    @property
    def question_distribution(self):
        """Get actual distribution of questions by difficulty"""
        questions = self.questions.all()
        total = questions.count()
        if total == 0:
            return {'easy': 0, 'medium': 0, 'hard': 0}
        
        distribution = {
            'easy': questions.filter(difficulty='easy').count(),
            'medium': questions.filter(difficulty='medium').count(),
            'hard': questions.filter(difficulty='hard').count()
        }
        
        return {k: round((v / total) * 100, 1) for k, v in distribution.items()}

class Question(models.Model):
    """Question model supporting multiple question types"""
    
    TYPE_CHOICES = [
        ('mcq', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('essay', 'Essay'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    course = models.ForeignKey('exams.Course', on_delete=models.CASCADE, related_name='questions', null=True)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions', null=True, blank=True)
    bank = models.ForeignKey(QuestionBank, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    question_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='mcq')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    
    text = models.TextField()
    image = models.ImageField(upload_to='questions/', null=True, blank=True)
    
    marks = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    order = models.IntegerField(default=0)
    
    # Metadata for pool/bank management
    tags = models.JSONField(default=list, blank=True, help_text="Tags for categorization")
    usage_count = models.IntegerField(default=0, help_text="Times this question has been used")
    last_used = models.DateTimeField(null=True, blank=True)
    
    # For short answer questions
    correct_answer_text = models.TextField(blank=True, help_text="For short answer questions")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='questions_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'questions'
        ordering = ['course', 'exam', 'order']
        indexes = [
            models.Index(fields=['course', 'order']),
            models.Index(fields=['exam', 'order']),
            models.Index(fields=['question_type']),
        ]
    
    def __str__(self):
        return f"Q{self.order}: {self.text[:50]}..."
    
    @property
    def correct_option(self):
        """Get the correct option for MCQ/True-False questions"""
        if self.question_type in ['mcq', 'true_false']:
            return self.options.filter(is_correct=True).first()
        return None


class Option(models.Model):
    """Options for MCQ and True/False questions"""
    
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'options'
        ordering = ['question', 'order']
        indexes = [
            models.Index(fields=['question', 'order']),
        ]
    
    def __str__(self):
        return f"{self.text[:30]}... ({'Correct' if self.is_correct else 'Incorrect'})"


class StudentAnswer(models.Model):
    """Store student answers during exam"""
    
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='student_answers')
    selected_option = models.ForeignKey(Option, on_delete=models.SET_NULL, null=True, blank=True, related_name='selected_by')
    
    # For short answer questions
    answer_text = models.TextField(blank=True)
    
    # Grading
    is_correct = models.BooleanField(null=True, blank=True)
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Auto-save tracking
    answered_at = models.DateTimeField(auto_now=True)
    is_marked_for_review = models.BooleanField(default=False)
    
    # Manual Grading
    is_graded = models.BooleanField(default=False)
    feedback = models.TextField(blank=True, null=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='graded_answers')
    graded_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'student_answers'
        unique_together = ['attempt', 'question']
        indexes = [
            models.Index(fields=['attempt', 'question']),
            models.Index(fields=['answered_at']),
        ]
    
    def __str__(self):
        return f"{self.attempt.student.username} - Q{self.question.order}"
    
    def auto_grade(self):
        """Automatically grade objective questions"""
        if self.question.question_type in ['mcq', 'true_false']:
            if self.selected_option and self.selected_option.is_correct:
                self.is_correct = True
                self.marks_obtained = self.question.marks
            else:
                self.is_correct = False
                self.marks_obtained = 0
        
        self.save()
        return self.marks_obtained