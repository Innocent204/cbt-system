from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction, models
from django.contrib.auth import get_user_model
from .models import Course, Exam, ExamAttempt
from .serializers import (CourseSerializer, ExamListSerializer, ExamDetailSerializer, 
                          ExamCreateUpdateSerializer, ExamAttemptSerializer, 
                          ExamAttemptCreateSerializer)
from accounts.permissions import IsAdminUser, IsExaminerUser, IsStudentUser, IsOwnerOrAdmin
from accounts.views import create_audit_log, send_notification

User = get_user_model()

class CourseViewSet(viewsets.ModelViewSet):
    """Viewset for courses"""
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsExaminerUser()]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin or user.is_examiner:
            return Course.objects.all()
        return Course.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        course = serializer.save(created_by=self.request.user)
        # Notify admins about new course
        admins = User.objects.filter(role='admin')
        for admin in admins:
            send_notification(
                recipient=admin,
                actor=self.request.user,
                type='info',
                title='New Course Created',
                message=f'A new course "{course.name}" has been created by {self.request.user.username}.',
                related_model='Course',
                related_id=course.id
            )

class ExamViewSet(viewsets.ModelViewSet):
    """Viewset for exams"""
    queryset = Exam.objects.all()
    
    def get_permissions(self):
        if self.action == 'available':
            return [IsStudentUser()]
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsExaminerUser()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ExamListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return ExamCreateUpdateSerializer
        return ExamDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Exam.objects.all()
        
        # Filter by course if provided
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        if user.is_admin:
            pass
        elif user.is_examiner:
            queryset = queryset.filter(created_by=user)
        else:
            # Students only see published and active exams
            queryset = queryset.filter(status='published', is_active=True)
            
        # Filter for upcoming exams if requested
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(start_time__gt=timezone.now())
            
        return queryset

    def perform_create(self, serializer):
        exam = serializer.save(created_by=self.request.user)
        # Notify admins about new exam
        admins = User.objects.filter(role='admin')
        for admin in admins:
            send_notification(
                recipient=admin,
                actor=self.request.user,
                type='info',
                title='New Exam Published',
                message=f'A new exam "{exam.title}" has been published by {self.request.user.username}.',
                related_model='Exam',
                related_id=exam.id
            )

    @action(detail=False, methods=['get'], permission_classes=[IsStudentUser])
    def available(self, request):
        """Get exams currently available for the student to take"""
        now = timezone.now()
        queryset = Exam.objects.filter(
            (models.Q(start_time__lte=now) | models.Q(start_time__isnull=True)),
            (models.Q(end_time__gte=now) | models.Q(end_time__isnull=True)),
            status='published',
            is_active=True
        )
        
        # Optionally filter by course
        course_id = self.request.query_params.get('course_id')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
            
        serializer = ExamListSerializer(queryset, many=True)
        return Response(serializer.data)

class ExamAttemptViewSet(viewsets.ModelViewSet):
    """Viewset for exam attempts"""
    queryset = ExamAttempt.objects.all()
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsStudentUser()]
        if self.action in ['submit', 'active']:
            return [IsStudentUser()]
        if self.action == 'destroy':
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ExamAttemptCreateSerializer
        return ExamAttemptSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return ExamAttempt.objects.all()
        return ExamAttempt.objects.filter(student=user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get currently in-progress attempt"""
        attempt = ExamAttempt.objects.filter(
            student=request.user,
            status='in_progress'
        ).first()
        
        if not attempt:
            return Response({'detail': 'No active attempt found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ExamAttemptSerializer(attempt)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit the exam attempt"""
        attempt = self.get_object()
        if attempt.status != 'in_progress':
            return Response({'error': 'Attempt already submitted'}, status=status.HTTP_400_BAD_REQUEST)
            
        attempt.status = 'submitted'
        attempt.submit_time = timezone.now()
        attempt.end_time = timezone.now()
        
        # Auto-score MCQ and True/False questions
        with transaction.atomic():
            answers = attempt.answers.all()
            for answer in answers:
                if answer.question.question_type in ['mcq', 'true_false']:
                    correct_opt = answer.question.options.filter(is_correct=True).first()
                    if correct_opt and answer.selected_option == correct_opt:
                        answer.is_correct = True
                        answer.marks_obtained = answer.question.marks
                    else:
                        answer.is_correct = False
                        answer.marks_obtained = 0
                    answer.is_graded = True
                    answer.save()
            
            # Update total attempt score
            total_score = attempt.answers.aggregate(models.Sum('marks_obtained'))['marks_obtained__sum'] or 0
            attempt.score = total_score
            if attempt.exam.total_marks > 0:
                attempt.percentage = (total_score / attempt.exam.total_marks) * 100
            
            # Create Result record
            from results.models import Result
            
            # Calculate statistics
            total_questions = attempt.exam.questions.count()
            correct_answers = attempt.answers.filter(is_correct=True).count()
            incorrect_answers = attempt.answers.filter(is_correct=False).count()
            unanswered = total_questions - attempt.answers.count()
            
            # Calculate time taken
            from datetime import timedelta
            time_taken = attempt.submit_time - attempt.start_time if attempt.submit_time else timedelta(0)
            time_taken_minutes = int(time_taken.total_seconds() / 60)
            
            # Calculate grade
            grade = Result.calculate_grade(attempt.percentage or 0)
            
            # Create or update Result
            Result.objects.update_or_create(
                attempt=attempt,
                defaults={
                    'exam': attempt.exam,
                    'student': attempt.student,
                    'total_marks': attempt.exam.total_marks,
                    'marks_obtained': attempt.score or 0,
                    'percentage': attempt.percentage or 0,
                    'is_passed': (attempt.percentage or 0) >= attempt.exam.passing_marks,
                    'grade': grade,
                    'total_questions': total_questions,
                    'correct_answers': correct_answers,
                    'incorrect_answers': incorrect_answers,
                    'unanswered': unanswered,
                    'time_taken_minutes': time_taken_minutes
                }
            )
        
        attempt.save()
        
        create_audit_log(
            request.user, 'exam_submit', 
            f'Submitted exam: {attempt.exam.title}', 
            request, 'Exam', attempt.exam.id
        )
        
        # Notify the exam creator (Examiner/Admin)
        send_notification(
            recipient=attempt.exam.created_by,
            actor=request.user,
            type='success',
            title='Exam Submitted',
            message=f'Student {request.user.username} has submitted: {attempt.exam.title}',
            related_model='Exam',
            related_id=attempt.exam.id
        )
        
        # Notify the student
        send_notification(
            recipient=request.user,
            type='success',
            title='Exam Completed',
            message=f'You have successfully submitted your attempt for: {attempt.exam.title}',
            related_model='Exam',
            related_id=attempt.exam.id
        )
        
        return Response({'message': 'Exam submitted successfully'})

    def perform_create(self, serializer):
        attempt = serializer.save()
        create_audit_log(
            self.request.user, 'exam_start', 
            f'Started exam: {attempt.exam.title}', 
            self.request, 'Exam', attempt.exam.id
        )
        
        # Notify the student
        send_notification(
            recipient=self.request.user,
            type='info',
            title='Exam Started',
            message=f'You have started the exam: {attempt.exam.title}. Good luck!',
            related_model='Exam',
            related_id=attempt.exam.id
        )
