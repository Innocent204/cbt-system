from rest_framework import serializers
from .models import Question, Option, StudentAnswer

class OptionSerializer(serializers.ModelSerializer):
    """Serializer for question options"""
    
    class Meta:
        model = Option
        fields = ['id', 'text', 'is_correct', 'order']
        read_only_fields = ['id']


class OptionStudentSerializer(serializers.ModelSerializer):
    """Serializer for options (student view - hides correct answer)"""
    
    class Meta:
        model = Option
        fields = ['id', 'text', 'order']
        read_only_fields = ['id', 'text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    """Full question serializer with options"""
    
    options = OptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'course', 'exam', 'question_type', 'difficulty', 'text', 
                  'image', 'marks', 'order', 'correct_answer_text', 
                  'options', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Question serializer for students (hides answers)"""
    
    options = OptionStudentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_type', 'text', 'image', 'marks', 
                  'order', 'options']
        read_only_fields = ['id', 'question_type', 'text', 'image', 
                            'marks', 'order']


class QuestionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating questions with options"""
    
    options = OptionSerializer(many=True, required=False)
    bank_id = serializers.IntegerField(required=False, write_only=True)
    
    class Meta:
        model = Question
        fields = ['course', 'exam', 'question_type', 'difficulty', 'text', 'image', 
                  'marks', 'order', 'correct_answer_text', 'options', 'bank_id']
    
    def validate(self, attrs):
        """Validate question data"""
        question_type = attrs.get('question_type')
        options = attrs.get('options', [])
        
        # Validate bank_id if provided
        bank_id = attrs.get('bank_id')
        if bank_id:
            from .models import QuestionBank
            try:
                # Ensure bank exists and belongs to the same course as the question
                course = attrs.get('course')
                bank = QuestionBank.objects.get(id=bank_id)
                if course and bank.course != course:
                    raise serializers.ValidationError({"bank_id": "Question bank does not belong to the selected course"})
            except QuestionBank.DoesNotExist:
                raise serializers.ValidationError({"bank_id": "Question bank not found"})

        # MCQ must have options with exactly one correct
        if question_type == 'mcq':
            if len(options) < 2:
                raise serializers.ValidationError(
                    {"options": "MCQ must have at least 2 options"}
                )
            correct_count = sum(1 for opt in options if opt.get('is_correct'))
            if correct_count != 1:
                raise serializers.ValidationError(
                    {"options": "MCQ must have exactly one correct answer"}
                )
        
        # True/False must have exactly 2 options
        elif question_type == 'true_false':
            if len(options) != 2:
                raise serializers.ValidationError(
                    {"options": "True/False must have exactly 2 options"}
                )
            correct_count = sum(1 for opt in options if opt.get('is_correct'))
            if correct_count != 1:
                raise serializers.ValidationError(
                    {"options": "True/False must have exactly one correct answer"}
                )
        
        # Short answer must have correct_answer_text
        elif question_type == 'short_answer':
            if not attrs.get('correct_answer_text'):
                raise serializers.ValidationError(
                    {"correct_answer_text": "Short answer must have correct answer text"}
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create question with options and direct bank link"""
        options_data = validated_data.pop('options', [])
        bank = validated_data.pop('bank', None)
        tags = validated_data.pop('tags', [])
        
        question = Question.objects.create(**validated_data)
        
        for option_data in options_data:
            Option.objects.create(question=question, **option_data)
        
        if bank:
            question.bank = bank
            question.save()
        
        question.tags.set(tags)
        
        return question


class StudentAnswerSerializer(serializers.ModelSerializer):
    """Serializer for student answers"""
    
    question_text = serializers.CharField(source='question.text', read_only=True)
    question_marks = serializers.DecimalField(source='question.marks', max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = StudentAnswer
        fields = ['id', 'attempt', 'question', 'question_text', 'question_marks',
                  'selected_option', 'answer_text', 'is_correct', 'marks_obtained',
                  'is_graded', 'feedback', 'graded_by', 'graded_at',
                  'is_marked_for_review', 'answered_at']
        read_only_fields = ['id', 'is_correct', 'marks_obtained', 'is_graded', 
                            'feedback', 'graded_by', 'graded_at', 'answered_at']


class StudentAnswerCreateSerializer(serializers.ModelSerializer):
    """Serializer for submitting/updating answers"""
    
    class Meta:
        model = StudentAnswer
        fields = ['attempt', 'question', 'selected_option', 'answer_text', 
                  'is_marked_for_review']
    
    def validate(self, attrs):
        """Validate answer data"""
        attempt = attrs.get('attempt')
        
        # Check if attempt is still in progress
        if attempt.status != 'in_progress':
            raise serializers.ValidationError(f"Cannot modify answers after submission. Current status: {attempt.status}")
        
        # Check if attempt is timed out
        if attempt.is_timed_out:
            raise serializers.ValidationError("Time is up. Cannot submit answers.")
        
        question = attrs.get('question')
        
        # Validate answer based on question type
        if question.question_type in ['mcq', 'true_false']:
            if not attrs.get('selected_option'):
                # Allow empty answers (for saving progress)
                pass
            elif attrs['selected_option'].question != question:
                raise serializers.ValidationError(
                    {"selected_option": "Option does not belong to this question"}
                )
        
        return attrs
    
    def create(self, validated_data):
        """Create or update student answer"""
        attempt = validated_data['attempt']
        question = validated_data['question']
        
        # Update if exists, create if not
        answer, created = StudentAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults=validated_data
        )
        
        return answer