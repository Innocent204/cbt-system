"""
Management commands for advanced CBT features
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from accounts.models import AuditLog, User
from exams.models import ExamAttempt, Exam
from questions.models import QuestionBank
from questions.pool_models import ExamTemplate
from grading_queue import grading_queue, BatchGradingProcessor


class Command(BaseCommand):
    help = 'Initialize advanced CBT features with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-samples',
            action='store_true',
            help='Create sample question banks and templates'
        )
        parser.add_argument(
            '--start-grading-queue',
            action='store_true',
            help='Start the grading queue workers'
        )
        parser.add_argument(
            '--process-pending',
            action='store_true',
            help='Process all pending exam submissions'
        )

    def handle(self, *args, **options):
        self.stdout.write("🚀 Initializing Advanced CBT Features...")
        
        if options['create_samples']:
            self.create_sample_data()
        
        if options['start_grading_queue']:
            self.start_grading_queue()
        
        if options['process_pending']:
            self.process_pending_submissions()
        
        self.stdout.write("✅ Advanced CBT Features initialization complete!")

    def create_sample_data(self):
        """Create sample question banks and templates"""
        self.stdout.write("📚 Creating sample question banks and templates...")
        
        # Get or create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Create sample course
        from exams.models import Course
        course, created = Course.objects.get_or_create(
            code='ADV101',
            defaults={
                'name': 'Advanced Computer Science',
                'description': 'Sample course for advanced features',
                'created_by': admin_user
            }
        )
        
        # Create sample question banks
        bank1 = QuestionBank.objects.get_or_create(
            name='Programming Fundamentals',
            defaults={
                'description': 'Basic programming concepts and algorithms',
                'course': course,
                'created_by': admin_user,
                'easy_percentage': 50,
                'medium_percentage': 35,
                'hard_percentage': 15
            }
        )[0]
        
        bank2 = QuestionBank.objects.get_or_create(
            name='Data Structures',
            defaults={
                'description': 'Advanced data structures and algorithms',
                'course': course,
                'created_by': admin_user,
                'easy_percentage': 30,
                'medium_percentage': 45,
                'hard_percentage': 25
            }
        )[0]
        
        # Create sample exam template
        template = ExamTemplate.objects.get_or_create(
            name='Comprehensive Programming Assessment',
            defaults={
                'description': 'Template for generating programming exams',
                'course': course,
                'created_by': admin_user,
                'total_questions': 20,
                'duration_minutes': 120,
                'total_marks': 100,
                'passing_marks': 60,
                'randomize_questions': True,
                'randomize_options': True,
                'prevent_recent_reuse': True,
                'recent_reuse_days': 7
            }
        )[0]
        
        self.stdout.write(f"✅ Created sample data: {bank1.name}, {bank2.name}, {template.name}")

    def start_grading_queue(self):
        """Start the grading queue workers"""
        self.stdout.write("⚡ Starting grading queue workers...")
        
        # The queue should auto-start when imported, but we'll ensure it's running
        stats = grading_queue.get_queue_stats()
        
        self.stdout.write(f"✅ Grading queue status: {stats['active_workers']} workers active, {stats['queue_size']} items in queue")

    def process_pending_submissions(self):
        """Process all pending exam submissions"""
        self.stdout.write("📋 Processing pending exam submissions...")
        
        processor = BatchGradingProcessor(batch_size=20)
        results = processor.process_pending_submissions()
        
        self.stdout.write(f"✅ Processed {results['total_processed']} submissions, {results['total_failed']} failed")
