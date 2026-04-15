"""
API views for question pools and exam generation
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from questions.models import QuestionBank
from questions.pool_models import ExamTemplate, TemplateBankRule
from questions.exam_generator import ExamGenerationEngine, QuestionPoolAnalyzer
from exams.models import Exam
from accounts.models import User


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def question_banks(request):
    """Manage question banks"""
    if request.method == 'GET':
        user = request.user
        if user.role not in ['admin', 'examiner']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        banks = QuestionBank.objects.filter(is_active=True).select_related('course', 'created_by')
        
        return Response({
            'banks': [
                {
                    'id': bank.id,
                    'name': bank.name,
                    'description': bank.description,
                    'course': bank.course.name,
                    'course_code': bank.course.code,
                    'course_id': bank.course.id,
                    'total_questions': bank.total_questions,
                    'distribution': bank.question_distribution,
                    'difficulty_targets': {
                        'easy': bank.easy_percentage,
                        'medium': bank.medium_percentage,
                        'hard': bank.hard_percentage
                    },
                    'created_by': bank.created_by.username if bank.created_by else None,
                    'created_at': bank.created_at
                }
                for bank in banks
            ]
        })
    
    elif request.method == 'POST':
        if request.user.role not in ['admin', 'examiner']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        print(f"DEBUG: Creating question bank with data: {data}")
        
        try:
            # Validate required fields
            if not data.get('name'):
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
            if not data.get('course_id'):
                return Response({'error': 'Course ID is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Validate difficulty distribution
            try:
                total_percentage = (
                    int(data.get('easy_percentage', 40)) +
                    int(data.get('medium_percentage', 40)) +
                    int(data.get('hard_percentage', 20))
                )
                if total_percentage != 100:
                    return Response(
                        {'error': 'Difficulty distribution must sum to 100%'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except (ValueError, TypeError):
                return Response({'error': 'Invalid percentage values'}, status=status.HTTP_400_BAD_REQUEST)
            
            from exams.models import Course
            try:
                course = Course.objects.get(id=data['course_id'])
            except Course.DoesNotExist:
                return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
            
            bank = QuestionBank.objects.create(
                name=data['name'],
                description=data.get('description', ''),
                course=course,
                created_by=request.user,
                easy_percentage=data.get('easy_percentage', 40),
                medium_percentage=data.get('medium_percentage', 40),
                hard_percentage=data.get('hard_percentage', 20)
            )
            
            print(f"DEBUG: Successfully created question bank {bank.id}")
            return Response({
                'id': bank.id,
                'message': 'Question bank created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"ERROR creating question bank: {str(e)}")
            return Response(
                {'error': f'Server error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def exam_templates(request):
    """Manage exam templates"""
    if request.method == 'GET':
        templates = ExamTemplate.objects.filter(
            course__created_by=request.user if request.user.role in ['admin', 'examiner'] else None,
            is_active=True
        ).select_related('course', 'created_by')
        
        return Response({
            'templates': [
                {
                    'id': template.id,
                    'name': template.name,
                    'description': template.description,
                    'course': template.course.name,
                    'course_code': template.course.code,
                    'total_questions': template.total_questions,
                    'duration_minutes': template.duration_minutes,
                    'total_marks': float(template.total_marks),
                    'passing_marks': float(template.passing_marks),
                    'randomize_questions': template.randomize_questions,
                    'randomize_options': template.randomize_options,
                    'created_by': template.created_by.username if template.created_by else None,
                    'created_at': template.created_at
                }
                for template in templates
            ]
        })
    
    elif request.method == 'POST':
        if request.user.role not in ['admin', 'examiner']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        
        try:
            from exams.models import Course
            course = Course.objects.get(id=data['course_id'])
            
            with transaction.atomic():
                template = ExamTemplate.objects.create(
                    name=data['name'],
                    description=data.get('description', ''),
                    course=course,
                    created_by=request.user,
                    total_questions=data['total_questions'],
                    duration_minutes=data['duration_minutes'],
                    total_marks=data['total_marks'],
                    passing_marks=data['passing_marks'],
                    randomize_questions=data.get('randomize_questions', True),
                    randomize_options=data.get('randomize_options', True),
                    allow_reuse_in_same_exam=data.get('allow_reuse_in_same_exam', False),
                    prevent_recent_reuse=data.get('prevent_recent_reuse', True),
                    recent_reuse_days=data.get('recent_reuse_days', 7)
                )
                
                # Add bank rules if provided
                if 'bank_rules' in data:
                    for rule_data in data['bank_rules']:
                        bank = QuestionBank.objects.get(id=rule_data['bank_id'])
                        TemplateBankRule.objects.create(
                            template=template,
                            bank=bank,
                            questions_from_bank=rule_data['questions_from_bank'],
                            difficulty_distribution=rule_data.get('difficulty_distribution', {}),
                            question_types=rule_data.get('question_types', []),
                            tags_required=rule_data.get('tags_required', []),
                            tags_excluded=rule_data.get('tags_excluded', [])
                        )
                
                return Response({
                    'id': template.id,
                    'message': 'Exam template created successfully'
                }, status=status.HTTP_201_CREATED)
                
        except Course.DoesNotExist:
            return Response(
                {'error': 'Course not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except QuestionBank.DoesNotExist:
            return Response(
                {'error': 'One or more question banks not found'},
                status=status.HTTP_404_NOT_FOUND
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_exam(request):
    """Generate an exam from a template"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    data = request.data
    
    try:
        template = ExamTemplate.objects.get(id=data['template_id'])
        student_id = data.get('student_id')
        
        student = None
        if student_id:
            student = User.objects.get(id=student_id)
        
        # Generate the exam
        engine = ExamGenerationEngine(template, student, data.get('seed'))
        exam = engine.generate_exam(
            title=data.get('title'),
            description=data.get('description')
        )
        
        # Get generation report
        report = engine.get_generation_report()
        
        return Response({
            'exam_id': exam.id,
            'exam_title': exam.title,
            'generation_report': report,
            'message': 'Exam generated successfully'
        }, status=status.HTTP_201_CREATED)
        
    except ExamTemplate.DoesNotExist:
        return Response(
            {'error': 'Template not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'Student not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bank_analytics(request, bank_id):
    """Get analytics for a question bank"""
    try:
        bank = QuestionBank.objects.get(id=bank_id)
        
        # Check permissions
        if request.user.role not in ['admin', 'examiner'] and bank.course.created_by != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get analytics
        analytics = QuestionPoolAnalyzer.analyze_bank_performance(bank_id)
        
        return Response(analytics)
        
    except QuestionBank.DoesNotExist:
        return Response(
            {'error': 'Question bank not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def template_optimization(request, template_id):
    """Get optimization recommendations for a template"""
    if request.user.role not in ['admin', 'examiner']:
        return Response(
            {'error': 'Permission denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        template = ExamTemplate.objects.get(id=template_id)
        student_id = request.GET.get('student_id')
        
        # Get optimization recommendations
        recommendations = QuestionPoolAnalyzer.optimize_question_selection(
            template_id, student_id
        )
        
        return Response(recommendations)
        
    except ExamTemplate.DoesNotExist:
        return Response(
            {'error': 'Template not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def question_bank_detail(request, bank_id):
    """Manage a specific question bank (Get questions or update metadata)"""
    try:
        bank = QuestionBank.objects.get(id=bank_id)
        
        # Check permissions
        if request.user.role not in ['admin', 'examiner'] and bank.course.created_by != request.user:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            # Get bank questions
            bank_questions = bank.questions.all()
            
            questions_data = []
            for question in bank_questions:
                questions_data.append({
                    'id': question.id,
                    'text': question.text,
                    'question_type': question.question_type,
                    'difficulty': question.difficulty,
                    'marks': float(question.marks),
                    'usage_count': question.usage_count,
                    'tags': question.tags,
                    'last_used': question.last_used
                })
            
            return Response({
                'bank': {
                    'id': bank.id,
                    'name': bank.name,
                    'description': bank.description,
                    'total_questions': len(questions_data),
                    'distribution': bank.question_distribution,
                    'course_id': bank.course.id,
                    'difficulty_targets': {
                        'easy': bank.easy_percentage,
                        'medium': bank.medium_percentage,
                        'hard': bank.hard_percentage
                    }
                },
                'questions': questions_data
            })

        elif request.method in ['PUT', 'PATCH']:
            data = request.data
            
            if 'name' in data:
                bank.name = data['name']
            if 'description' in data:
                bank.description = data['description']
            
            # Update distribution if all 3 are provided or it's a PATCH
            try:
                easy = data.get('easy_percentage', bank.easy_percentage)
                medium = data.get('medium_percentage', bank.medium_percentage)
                hard = data.get('hard_percentage', bank.hard_percentage)
                
                if int(easy) + int(medium) + int(hard) == 100:
                    bank.easy_percentage = int(easy)
                    bank.medium_percentage = int(medium)
                    bank.hard_percentage = int(hard)
                elif request.method == 'PUT':
                    return Response({'error': 'Distribution must sum to 100%'}, status=status.HTTP_400_BAD_REQUEST)
            except (ValueError, TypeError):
                return Response({'error': 'Invalid percentage values'}, status=status.HTTP_400_BAD_REQUEST)
            
            bank.save()
            return Response({'message': 'Question bank updated successfully'})

        elif request.method == 'DELETE':
            bank.is_active = False # Soft delete
            bank.save()
            return Response({'message': 'Question bank deleted successfully'})
        
        
    except QuestionBank.DoesNotExist:
        return Response(
            {'error': 'Question bank not found'},
            status=status.HTTP_404_NOT_FOUND
        )
