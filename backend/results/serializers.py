from rest_framework import serializers
from .models import Result
from exams.serializers import ExamListSerializer
from accounts.serializers import UserListSerializer

class ResultSerializer(serializers.ModelSerializer):
    """Serializer for exam results"""
    
    exam_details = ExamListSerializer(source='exam', read_only=True)
    student_details = UserListSerializer(source='student', read_only=True)
    
    class Meta:
        model = Result
        fields = ['id', 'attempt', 'exam', 'exam_details', 'student', 
                  'student_details', 'total_marks', 'marks_obtained', 
                  'percentage', 'is_passed', 'grade', 'total_questions',
                  'correct_answers', 'incorrect_answers', 'unanswered',
                  'time_taken_minutes', 'generated_at']
        read_only_fields = ['id', 'generated_at']


class ResultListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for result lists"""
    
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    course_name = serializers.CharField(source='exam.course.name', read_only=True)
    score = serializers.FloatField(source='marks_obtained', read_only=True)
    completed_at = serializers.DateTimeField(source='generated_at', read_only=True)
    duration_minutes = serializers.IntegerField(source='time_taken_minutes', read_only=True)
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Result
        fields = ['id', 'exam', 'exam_title', 'student', 'student_name', 'course_name',
                  'score', 'marks_obtained', 'total_marks', 'percentage', 
                  'grade', 'is_passed', 'status', 'completed_at', 
                  'generated_at', 'duration_minutes', 'total_questions',
                  'correct_answers', 'incorrect_answers', 'unanswered']

    def get_status(self, obj):
        return 'passed' if obj.is_passed else 'failed'


class ResultDetailSerializer(serializers.ModelSerializer):
    """Detailed result with question-wise breakdown"""
    
    exam_details = ExamListSerializer(source='exam', read_only=True)
    student_details = UserListSerializer(source='student', read_only=True)
    answers = serializers.SerializerMethodField()
    
    class Meta:
        model = Result
        fields = ['id', 'attempt', 'exam', 'exam_details', 'student',
                  'student_details', 'total_marks', 'marks_obtained',
                  'percentage', 'is_passed', 'grade', 'total_questions',
                  'correct_answers', 'incorrect_answers', 'unanswered',
                  'time_taken_minutes', 'generated_at', 'answers']
        read_only_fields = ['id', 'generated_at']
    
    def get_answers(self, obj):
        """Get answer details if allowed"""
        from questions.serializers import StudentAnswerSerializer
        
        # Check if review is allowed
        if not obj.exam.allow_review:
            return None
        
        answers = obj.attempt.answers.select_related(
            'question', 'selected_option'
        ).order_by('question__order')
        
        return StudentAnswerSerializer(answers, many=True).data