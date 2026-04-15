from rest_framework import serializers
from .models import Course, Exam, ExamAttempt
from accounts.serializers import UserListSerializer
from questions.serializers import QuestionStudentSerializer

class CourseSerializer(serializers.ModelSerializer):
    """Serializer for Course model"""
    
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    exam_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'description', 'created_by', 
                  'created_by_name', 'is_active', 'exam_count', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_exam_count(self, obj):
        return obj.exams.filter(is_active=True).count()


class ExamListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for exam lists"""
    
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Exam
        fields = ['id', 'title', 'course', 'course_name', 'course_code', 
                  'duration_minutes', 'total_marks', 'passing_marks', 'status', 'question_count',
                  'created_by_name', 'start_time', 'end_time', 'is_available']


class ExamDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Exam model"""
    
    course_details = CourseSerializer(source='course', read_only=True)
    created_by_details = UserListSerializer(source='created_by', read_only=True)
    question_count = serializers.IntegerField(read_only=True)
    is_available = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Exam
        fields = ['id', 'title', 'description', 'course', 'course_details',
                  'created_by', 'created_by_details', 'duration_minutes', 
                  'total_marks', 'passing_marks', 'randomize_questions', 
                  'randomize_options', 'show_results_immediately', 'allow_review',
                  'max_attempts', 'start_time', 'end_time', 'status', 'is_active',
                  'question_count', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'question_count', 'is_available']


class ExamCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating exams"""
    
    class Meta:
        model = Exam
        fields = ['id', 'title', 'description', 'course', 'duration_minutes', 
                  'total_marks', 'passing_marks', 'randomize_questions',
                  'randomize_options', 'show_results_immediately', 'allow_review',
                  'max_attempts', 'start_time', 'end_time', 'status', 'is_active']
        read_only_fields = ['id']
    
    def validate(self, attrs):
        """Validate exam data"""
        if attrs.get('passing_marks', 0) > attrs.get('total_marks', 0):
            raise serializers.ValidationError(
                {"passing_marks": "Passing marks cannot exceed total marks"}
            )
        
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {"end_time": "End time must be after start time"}
            )
        
        return attrs


class ExamAttemptSerializer(serializers.ModelSerializer):
    """Serializer for exam attempts"""
    
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    duration_minutes = serializers.IntegerField(source='exam.duration_minutes', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    time_remaining = serializers.FloatField(read_only=True)
    is_timed_out = serializers.BooleanField(read_only=True)
    questions = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamAttempt
        fields = ['id', 'exam', 'exam_title', 'duration_minutes', 'student', 'student_name',
                  'attempt_number', 'status', 'start_time', 'end_time', 
                  'submit_time', 'score', 'percentage', 'time_remaining',
                  'is_timed_out', 'last_activity', 'questions']
        read_only_fields = ['id', 'start_time', 'end_time', 'submit_time', 
                            'score', 'percentage', 'last_activity']

    def get_questions(self, obj):
        questions = obj.exam.questions.all()
        if obj.exam.randomize_questions:
            questions = questions.order_by('?')
        else:
            questions = questions.order_by('order')
        return QuestionStudentSerializer(questions, many=True).data


class ExamAttemptCreateSerializer(serializers.ModelSerializer):
    """Serializer for starting an exam attempt"""
    
    class Meta:
        model = ExamAttempt
        fields = ['id', 'exam', 'status']
        read_only_fields = ['id', 'status']
    
    def validate_exam(self, value):
        """Validate exam availability"""
        if not value.is_available:
            raise serializers.ValidationError("This exam is not currently available")
        return value
    
    def create(self, validated_data):
        """Create exam attempt with validation"""
        student = self.context['request'].user
        exam = validated_data['exam']
        
        # Check attempt limit
        attempts_count = ExamAttempt.objects.filter(
            exam=exam,
            student=student
        ).count()
        
        if attempts_count >= exam.max_attempts:
            raise serializers.ValidationError("Maximum attempts reached for this exam")
        
        # Check for ongoing attempt
        ongoing = ExamAttempt.objects.filter(
            exam=exam,
            student=student,
            status='in_progress'
        ).first()
        
        if ongoing:
            return ongoing
        
        # Create new attempt
        attempt = ExamAttempt.objects.create(
            exam=exam,
            student=student,
            attempt_number=attempts_count + 1
        )
        
        return attempt