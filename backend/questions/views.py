from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
import csv
import json
import io
from .models import Question, Option, StudentAnswer
from .serializers import (QuestionSerializer, QuestionStudentSerializer, 
                          QuestionCreateSerializer, StudentAnswerSerializer, 
                          StudentAnswerCreateSerializer)
from exams.models import Exam

from accounts.permissions import IsAdminUser, IsExaminerUser, IsStudentUser, IsOwnerOrAdmin
from accounts.views import send_notification

class QuestionViewSet(viewsets.ModelViewSet):
    """Viewset for questions"""
    queryset = Question.objects.all()
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsExaminerUser()]
    
    def get_serializer_class(self):
        user = self.request.user
        if self.action in ['create', 'update', 'partial_update']:
            return QuestionCreateSerializer
        if user.is_student:
            return QuestionStudentSerializer
        return QuestionSerializer
    
    def get_queryset(self):
        user = self.request.user
        exam_id = self.request.query_params.get('exam_id')
        course_id = self.request.query_params.get('course_id')
        
        queryset = Question.objects.all().select_related('course', 'exam', 'created_by')
        if exam_id:
            queryset = queryset.filter(exam_id=exam_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        if user.is_admin or user.is_examiner:
            return queryset
        else:
            # Students only see questions for exams they are currently taking
            from exams.models import ExamAttempt
            active_attempts = ExamAttempt.objects.filter(student=user, status='in_progress').values_list('exam_id', flat=True)
            return queryset.filter(exam_id__in=active_attempts)

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        """Bulk import questions from CSV or JSON"""
        file = request.FILES.get('file')
        course_id = request.data.get('course_id')
        exam_id = request.data.get('exam_id')
        bank_id = request.data.get('bank_id')
        
        print(f"Bulk import started. course_id: {course_id}, exam_id: {exam_id}, bank_id: {bank_id}, file: {file.name if file else 'None'}")
        
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        course = None
        exam = None
        bank = None
        
        if bank_id:
            try:
                from .models import QuestionBank
                bank = QuestionBank.objects.get(id=bank_id)
                course = bank.course
            except QuestionBank.DoesNotExist:
                return Response({'error': 'Question bank not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not course and course_id:
            try:
                from exams.models import Course
                course = Course.objects.get(id=course_id)
            except Course.DoesNotExist:
                return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if exam_id:
            try:
                from exams.models import Exam
                exam = Exam.objects.get(id=exam_id)
                if not course:
                    course = exam.course
            except Exam.DoesNotExist:
                return Response({'error': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)
        
        if not course:
            return Response({'error': 'Either course_id, exam_id, or bank_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        filename = file.name.lower()
        if filename.endswith('.json'):
            try:
                data = json.load(file)
            except Exception as e:
                return Response({'error': f'Invalid JSON formatting: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        elif filename.endswith('.csv'):
            try:
                decoded_file = file.read().decode('utf-8')
                io_string = io.StringIO(decoded_file)
                data = list(csv.DictReader(io_string))
            except Exception as e:
                return Response({'error': f'Invalid CSV formatting: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({'error': 'Unsupported file format. Please use .csv or .json'}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        errors = []
        
        # Mapping for common frontend/CSV labels to backend values
        TYPE_MAPPING = {
            'multiple_choice': 'mcq',
            'multiple choice': 'mcq',
            'mcq': 'mcq',
            'true_false': 'true_false',
            'true/false': 'true_false',
            'true false': 'true_false',
            'short_answer': 'short_answer',
            'short answer': 'short_answer',
            'essay': 'essay'
        }

        with transaction.atomic():
            for index, item in enumerate(data):
                try:
                    # Helper to find a value in a dictionary with flexible key matching
                    def get_flex(d, keys, default=None):
                        # Normalize all keys in the dict for comparison
                        norm_dict = {str(k).lower().replace(' ', '').replace('_', ''): v for k, v in d.items()}
                        for k in keys:
                            norm_k = str(k).lower().replace(' ', '').replace('_', '')
                            if norm_k in norm_dict:
                                return norm_dict[norm_k]
                        return default

                    # Support multiple naming conventions and flexible headers
                    text = get_flex(item, ['text', 'question', 'question_text', 'questionText', 'description', 'body'])
                    q_type = str(get_flex(item, ['type', 'question_type', 'questionType', 'kind'], 'mcq')).lower().strip()
                    q_type = TYPE_MAPPING.get(q_type, q_type)
                    
                    difficulty = str(get_flex(item, ['difficulty', 'level', 'diff'], 'medium')).lower().strip()
                    if difficulty not in ['easy', 'medium', 'hard']:
                        difficulty = 'medium'
                        
                    raw_marks = get_flex(item, ['marks', 'points', 'score', 'weight'], 1)
                    try:
                        marks = float(raw_marks)
                    except (ValueError, TypeError):
                        marks = 1.0
                        
                    raw_order = get_flex(item, ['order', 'position', 'seq'], index)
                    try:
                        order = int(raw_order)
                    except (ValueError, TypeError):
                        order = index
                    
                    if not text:
                        errors.append(f"Row {index + 1}: Question text missing")
                        continue

                    question = Question.objects.create(
                        course=course,
                        exam=exam,
                        bank=bank,
                        text=text,
                        question_type=q_type,
                        difficulty=difficulty,
                        marks=marks,
                        order=order,
                        created_by=request.user
                    )

                    # Handle related options
                    if q_type in ['mcq', 'true_false']:
                        options = get_flex(item, ['options', 'choices', 'answers'], [])
                        correct = get_flex(item, ['correct_answer', 'correctAnswer', 'correct', 'answer'])
                        
                        # Handle CSV string format for options "Opt1 | Opt2 | Opt3"
                        if isinstance(options, str):
                            options = [o.strip() for o in options.split('|') if o.strip()]
                        
                        # Default options for true/false if none provided
                        if not options and q_type == 'true_false':
                            options = ['True', 'False']
                        
                        # Validation: MCQ must have at least 2 options
                        if q_type == 'mcq' and len(options) < 2:
                            errors.append(f"Row {index + 1}: MCQ question must have at least 2 options. Found: {options}")
                            question.delete()
                            continue
                        
                        # Validation: Must have a correct answer specified
                        if not correct:
                            errors.append(f"Row {index + 1}: Question must specify a correct_answer. Expected column names: correct_answer, correctAnswer, correct, or answer")
                            question.delete()
                            continue
                            
                        for i, opt_text in enumerate(options):
                            is_correct = str(opt_text).strip().lower() == str(correct).strip().lower()
                            Option.objects.create(
                                question=question,
                                text=opt_text,
                                is_correct=is_correct,
                                order=i
                            )
                        
                        # Validation: At least one option must be marked as correct
                        correct_count = question.options.filter(is_correct=True).count()
                        if correct_count == 0:
                            errors.append(f"Row {index + 1}: No option matches the correct answer '{correct}'. Options: {options}")
                            question.delete()
                            continue
                    elif q_type == 'short_answer':
                        question.correct_answer_text = item.get('correct_answer') or item.get('correctAnswer') or ''
                        question.save()

                    created_count += 1
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")

        response_status = status.HTTP_201_CREATED if created_count > 0 else status.HTTP_400_BAD_REQUEST
        return Response({
            'message': f'Successfully imported {created_count} questions',
            'created_count': created_count,
            'errors': errors if errors else None,
            'error': errors[0] if (created_count == 0 and errors) else None
        }, status=response_status)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'], permission_classes=[IsExaminerUser])
    def distractor_analysis(self, request, pk=None):
        """Analyze the performance of distractors for a specific question"""
        question = self.get_object()
        
        if question.question_type not in ['mcq', 'true_false']:
            return Response(
                {'error': 'Distractor analysis is only available for MCQ and True/False questions'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        total_responses = StudentAnswer.objects.filter(question=question).count()
        options = question.options.all()
        
        analysis = []
        for option in options:
            selection_count = StudentAnswer.objects.filter(question=question, selected_option=option).count()
            percentage = (selection_count / total_responses * 100) if total_responses > 0 else 0
            
            analysis.append({
                'option_id': option.id,
                'option_text': option.text,
                'is_correct': option.is_correct,
                'selection_count': selection_count,
                'percentage': round(percentage, 2)
            })
            
        return Response({
            'question_text': question.text,
            'total_responses': total_responses,
            'analysis': analysis
        })

class StudentAnswerViewSet(viewsets.ModelViewSet):
    """Viewset for student answers"""
    queryset = StudentAnswer.objects.all()
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsStudentUser()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StudentAnswerCreateSerializer
        return StudentAnswerSerializer
    
    def get_queryset(self):
        user = self.request.user
        attempt_id = self.request.query_params.get('attempt_id')
        exam_id = self.request.query_params.get('exam_id')
        
        queryset = StudentAnswer.objects.all()
        if attempt_id:
            queryset = queryset.filter(attempt_id=attempt_id)
        if exam_id:
            queryset = queryset.filter(question__exam_id=exam_id)
            
        if user.is_admin or user.is_examiner:
            return queryset
        return queryset.filter(attempt__student=user)
    
    def create(self, request, *args, **kwargs):
        """Override create to provide better error handling"""
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error saving answer: {str(e)}", exc_info=True)
            
            # Return a more detailed error response
            from rest_framework.response import Response
            from rest_framework import status
            return Response({
                'error': str(e),
                'detail': str(e),
                'message': 'Failed to save answer'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsExaminerUser])
    def pending_grading(self, request):
        """List answers that require manual grading (essays/short answers not yet graded)"""
        exam_id = request.query_params.get('exam_id')
        
        # Filter for essay questions and short answers where is_graded is false
        # For this system, we focus on questions that aren't auto-gradable or need review
        queryset = StudentAnswer.objects.filter(
            models.Q(question__question_type='essay') | 
            models.Q(question__question_type='short_answer'),
            is_graded=False,
            attempt__status__in=['submitted', 'auto_submitted']
        )
        
        if exam_id:
            queryset = queryset.filter(question__exam_id=exam_id)
            
        serializer = StudentAnswerSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsExaminerUser])
    def submit_grade(self, request, pk=None):
        """Submit internal grade for an essay or short answer"""
        answer = self.get_object()
        marks = request.data.get('marks_obtained')
        feedback = request.data.get('feedback', '')
        
        if marks is None:
            return Response({'error': 'marks_obtained is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            marks = float(marks)
            if marks < 0 or marks > float(answer.question.marks):
                return Response({'error': f'Marks must be between 0 and {answer.question.marks}'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'Invalid marks value'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            answer.marks_obtained = marks
            answer.feedback = feedback
            answer.is_graded = True
            answer.graded_by = request.user
            from django.utils import timezone
            answer.graded_at = timezone.now()
            answer.is_correct = marks >= (float(answer.question.marks) / 2) # Arbitrary logic for "correctness"
            answer.save()
            
            # Recalculate attempt score
            attempt = answer.attempt
            total_score = StudentAnswer.objects.filter(attempt=attempt).aggregate(models.Sum('marks_obtained'))['marks_obtained__sum'] or 0
            attempt.score = total_score
            if attempt.exam.total_marks > 0:
                attempt.percentage = (total_score / attempt.exam.total_marks) * 100
            attempt.save()

            # Notify the student
            send_notification(
                recipient=attempt.student,
                actor=request.user,
                type='success',
                title='Question Graded',
                message=f'Your answer for "{answer.question.text[:30]}..." in {attempt.exam.title} has been graded.',
                related_model='ExamAttempt',
                related_id=attempt.id
            )

        return Response({
            'message': 'Grade submitted successfully',
            'marks_obtained': answer.marks_obtained,
            'is_graded': answer.is_graded
        })
