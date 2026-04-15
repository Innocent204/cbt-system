"""
Question pool and random exam generation models
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from exams.models import Course, Exam
from .models import QuestionBank


class ExamTemplate(models.Model):
    """Template for generating random exams from question banks"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exam_templates')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='exam_templates_created')
    
    # Exam configuration
    total_questions = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(200)])
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(480)])
    total_marks = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    passing_marks = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Generation settings
    randomize_questions = models.BooleanField(default=True)
    randomize_options = models.BooleanField(default=True)
    allow_reuse_in_same_exam = models.BooleanField(default=False, help_text="Allow same question multiple times in one exam")
    prevent_recent_reuse = models.BooleanField(default=True, help_text="Prevent questions used recently by same student")
    recent_reuse_days = models.IntegerField(default=7, help_text="Days to prevent recent reuse")
    
    # Question selection rules
    question_banks = models.ManyToManyField(QuestionBank, through='TemplateBankRule')
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'exam_templates'
        ordering = ['name']
        indexes = [
            models.Index(fields=['course', 'is_active']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.course.code}"


class TemplateBankRule(models.Model):
    """Rules for selecting questions from banks in templates"""
    
    template = models.ForeignKey(ExamTemplate, on_delete=models.CASCADE)
    bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE)
    
    # Selection criteria
    questions_from_bank = models.IntegerField(validators=[MinValueValidator(0)])
    difficulty_distribution = models.JSONField(
        default=dict,
        help_text="Difficulty distribution for this bank: {easy: X, medium: Y, hard: Z}"
    )
    question_types = models.JSONField(
        default=list,
        help_text="Allowed question types: ['mcq', 'true_false', 'short_answer', 'essay']"
    )
    tags_required = models.JSONField(
        default=list,
        help_text="Required tags for questions from this bank"
    )
    tags_excluded = models.JSONField(
        default=list,
        help_text="Tags to exclude from this bank"
    )
    
    class Meta:
        db_table = 'template_bank_rules'
        unique_together = ['template', 'bank']
    
    def __str__(self):
        return f"{self.template.name} - {self.bank.name} ({self.questions_from_bank} questions)"


class GeneratedExam(models.Model):
    """Exams generated from templates"""
    
    template = models.ForeignKey(ExamTemplate, on_delete=models.SET_NULL, null=True, related_name='generated_exams')
    exam = models.OneToOneField('exams.Exam', on_delete=models.CASCADE, related_name='generation_info')
    
    # Generation metadata
    generation_seed = models.CharField(max_length=32, help_text="Seed used for random generation")
    questions_used = models.JSONField(help_text="List of question IDs and their sources")
    generation_time = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_exams')
    
    # Quality metrics
    difficulty_distribution = models.JSONField(help_text="Actual difficulty distribution achieved")
    question_type_distribution = models.JSONField(help_text="Actual question type distribution")
    bank_distribution = models.JSONField(help_text="Questions from each bank")
    
    class Meta:
        db_table = 'generated_exams'
        indexes = [
            models.Index(fields=['template', 'generation_time']),
            models.Index(fields=['generated_by']),
            models.Index(fields=['generation_seed']),
        ]
    
    def __str__(self):
        return f"Generated {self.exam.title} from {self.template.name if self.template else 'Unknown'}"


class QuestionUsageHistory(models.Model):
    """Track question usage across exams for analytics"""
    
    question = models.ForeignKey('questions.Question', on_delete=models.CASCADE, related_name='usage_history')
    exam = models.ForeignKey('exams.Exam', on_delete=models.CASCADE, related_name='question_usage')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='question_history')
    
    # Usage context
    used_at = models.DateTimeField(auto_now_add=True)
    question_number = models.IntegerField(help_text="Position of question in exam")
    time_spent_seconds = models.IntegerField(null=True, blank=True, help_text="Time student spent on this question")
    is_correct = models.BooleanField(null=True, blank=True, help_text="Whether student answered correctly")
    marks_obtained = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Generation context
    generated_from_template = models.ForeignKey(ExamTemplate, null=True, blank=True, on_delete=models.SET_NULL)
    selected_from_bank = models.ForeignKey(QuestionBank, null=True, blank=True, on_delete=models.SET_NULL)
    
    class Meta:
        db_table = 'question_usage_history'
        unique_together = ['question', 'exam', 'student']
        indexes = [
            models.Index(fields=['question', 'used_at']),
            models.Index(fields=['student', 'used_at']),
            models.Index(fields=['generated_from_template']),
            models.Index(fields=['selected_from_bank']),
        ]
    
    def __str__(self):
        return f"{self.question.text[:30]}... for {self.student.username}"
