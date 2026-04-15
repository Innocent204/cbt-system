"""
Random exam generation engine
"""
import random
import hashlib
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from collections import defaultdict, Counter

from questions.models import Question, Option, QuestionBank
from questions.pool_models import (
    ExamTemplate, TemplateBankRule, 
    GeneratedExam, QuestionUsageHistory
)
from exams.models import Exam
from accounts.models import User


class ExamGenerationEngine:
    """Advanced exam generation with intelligent question selection"""
    
    def __init__(self, template, student=None, seed=None):
        self.template = template
        self.student = student
        self.seed = seed or self.generate_seed()
        self.random = random.Random(self.seed)
        self.selected_questions = []
        self.generation_log = []
        
    def generate_seed(self):
        """Generate a unique seed for this generation"""
        import time
        base_string = f"{self.template.id}_{timezone.now().timestamp()}_{random.random()}"
        return hashlib.md5(base_string.encode()).hexdigest()[:16]
    
    def generate_exam(self, title=None, description=None):
        """Generate a complete exam from the template"""
        with transaction.atomic():
            # Create the exam
            exam = Exam.objects.create(
                title=title or f"Generated Exam - {self.template.name}",
                description=description or self.template.description,
                course=self.template.course,
                created_by=self.template.created_by,
                duration_minutes=self.template.duration_minutes,
                total_marks=self.template.total_marks,
                passing_marks=self.template.passing_marks,
                randomize_questions=self.template.randomize_questions,
                randomize_options=self.template.randomize_options,
                status='published'
            )
            
            # Select questions
            questions = self.select_questions()
            
            # Add questions to exam
            exam_questions = []
            for i, (original_question, order) in enumerate(questions):
                # Create question in exam
                exam_question = Question.objects.create(
                    exam=exam,
                    question_type=original_question.question_type,
                    difficulty=original_question.difficulty,
                    text=original_question.text,
                    image=original_question.image,
                    marks=original_question.marks,
                    order=order,
                    created_by=self.template.created_by
                )
                
                # Copy options if applicable
                if original_question.question_type in ['mcq', 'true_false']:
                    for option in original_question.options.all():
                        Option.objects.create(
                            question=exam_question,
                            text=option.text,
                            is_correct=option.is_correct,
                            order=option.order
                        )
                
                # Track usage
                original_question.usage_count += 1
                original_question.last_used = timezone.now()
                original_question.save()
                
                exam_questions.append({
                    'question_id': exam_question.id,
                    'original_question_id': original_question.id,
                    'bank_id': original_question.bank.id if original_question.bank else None,
                    'order': order
                })
                
                self.generation_log.append({
                    'action': 'question_selected',
                    'question_id': original_question.id,
                    'bank_id': original_question.bank.id if original_question.bank else None,
                    'difficulty': original_question.difficulty,
                    'order': order
                })
            
            # Create generation record
            GeneratedExam.objects.create(
                template=self.template,
                exam=exam,
                generation_seed=self.seed,
                questions_used=exam_questions,
                generated_by=self.template.created_by,
                difficulty_distribution=self.calculate_distribution(exam_questions, 'difficulty'),
                question_type_distribution=self.calculate_distribution(exam_questions, 'type'),
                bank_distribution=self.calculate_distribution(exam_questions, 'bank')
            )
            
            return exam
    
    def select_questions(self):
        """Select questions based on template rules"""
        self.selected_questions = []
        remaining_slots = self.template.total_questions
        
        # Get template bank rules
        rules = TemplateBankRule.objects.filter(template=self.template).order_by('-questions_from_bank')
        
        for rule in rules:
            if remaining_slots <= 0:
                break
                
            questions_to_select = min(rule.questions_from_bank, remaining_slots)
            selected_from_rule = self.select_from_bank_rule(rule, questions_to_select)
            
            self.selected_questions.extend(selected_from_rule)
            remaining_slots -= len(selected_from_rule)
        
        # If still need more questions, fill from available banks
        if remaining_slots > 0:
            self.fill_remaining_slots(remaining_slots)
        
        # Shuffle if randomization is enabled
        if self.template.randomize_questions:
            self.random.shuffle(self.selected_questions)
        
        # Assign final order
        for i, (question, _) in enumerate(self.selected_questions):
            self.selected_questions[i] = (question, i + 1)
        
        return self.selected_questions
    
    def select_from_bank_rule(self, rule, count):
        """Select questions from a specific bank according to rules"""
        # Get eligible questions
        eligible_questions = self.get_eligible_questions(rule)
        
        if len(eligible_questions) < count:
            self.generation_log.append({
                'action': 'insufficient_questions',
                'bank_id': rule.bank.id,
                'requested': count,
                'available': len(eligible_questions)
            })
            count = len(eligible_questions)
        
        # Apply weighted selection
        selected = self.weighted_selection(eligible_questions, count, rule)
        
        return [(q, 0) for q in selected]  # Order will be assigned later
    
    def get_eligible_questions(self, rule):
        """Get questions eligible for selection based on rules"""
        base_queryset = Question.objects.filter(bank=rule.bank)
        
        # Filter by difficulty distribution
        if rule.difficulty_distribution:
            difficulty_targets = rule.difficulty_distribution
            eligible_by_difficulty = []
            
            for difficulty, target_count in difficulty_targets.items():
                difficulty_questions = base_queryset.filter(difficulty=difficulty)
                
                # Exclude recently used questions if enabled
                if self.template.prevent_recent_reuse and self.student:
                    cutoff_date = timezone.now() - timedelta(days=self.template.recent_reuse_days)
                    recent_question_ids = QuestionUsageHistory.objects.filter(
                        student=self.student,
                        used_at__gte=cutoff_date
                    ).values_list('question_id', flat=True)
                    
                    difficulty_questions = difficulty_questions.exclude(
                        id__in=recent_question_ids
                    )
                
                eligible_by_difficulty.extend(list(difficulty_questions))
            
            base_queryset = eligible_by_difficulty
        else:
            base_queryset = list(base_queryset)
        
        # Filter by question types
        if rule.question_types:
            base_queryset = [q for q in base_queryset if q.question_type in rule.question_types]
        
        # Filter by required tags
        if rule.tags_required:
            for tag in rule.tags_required:
                base_queryset = [q for q in base_queryset if tag in q.tags]
        
        # Filter by excluded tags
        if rule.tags_excluded:
            for tag in rule.tags_excluded:
                base_queryset = [q for q in base_queryset if tag not in q.tags]
        
        return base_queryset
    
    def weighted_selection(self, eligible_questions, count, rule):
        """Select questions using weighted random selection"""
        if not eligible_questions:
            return []
        
        # Calculate weights
        weights = []
        for q in eligible_questions:
            # Base weight (could be added back to Question model if needed, using 1.0 for now)
            weight = 1.0
            
            # Adjust weight based on usage (less used questions get higher weight)
            usage_factor = 1.0 / (1.0 + q.usage_count * 0.1)
            weight *= usage_factor
            
            # Adjust weight based on difficulty distribution targets
            if rule.difficulty_distribution:
                difficulty = q.difficulty
                target_percentage = rule.difficulty_distribution.get(difficulty, 0) / 100.0
                current_percentage = self.get_current_difficulty_percentage(rule.bank, difficulty)
                
                if current_percentage > target_percentage:
                    weight *= 0.5  # Reduce weight if we have too many of this difficulty
                elif current_percentage < target_percentage:
                    weight *= 1.5  # Increase weight if we need more of this difficulty
            
            weights.append(weight)
        
        # Normalize weights
        total_weight = sum(weights)
        if total_weight > 0:
            weights = [w / total_weight for w in weights]
        else:
            weights = [1.0 / len(weights)] * len(weights)
        
        # Weighted random selection
        selected = []
        available_indices = list(range(len(eligible_questions)))
        available_weights = weights.copy()
        
        for _ in range(min(count, len(eligible_questions))):
            if not available_indices:
                break
            
            # Select based on weights
            chosen_index = self.random.choices(available_indices, weights=available_weights)[0]
            chosen_question = eligible_questions[chosen_index]
            
            selected.append(chosen_question)
            
            # Remove from available
            idx_pos = available_indices.index(chosen_index)
            available_indices.pop(idx_pos)
            available_weights.pop(idx_pos)
            
            # Renormalize weights
            if available_weights:
                total_weight = sum(available_weights)
                available_weights = [w / total_weight for w in available_weights]
        
        return selected
    
    def get_current_difficulty_percentage(self, bank, difficulty):
        """Calculate current percentage of selected questions by difficulty"""
        selected_from_bank = [q for q, _ in self.selected_questions if q.bank == bank]
        if not selected_from_bank:
            return 0.0
        
        difficulty_count = sum(1 for q in selected_from_bank if q.difficulty == difficulty)
        return (difficulty_count / len(selected_from_bank)) * 100
    
    def fill_remaining_slots(self, remaining_slots):
        """Fill remaining slots from any available questions"""
        available_questions = Question.objects.filter(
            bank__in=self.template.question_banks.all()
        ).exclude(id__in=[q.id for q, _ in self.selected_questions])
        
        # Simple random selection for remaining slots
        if available_questions.exists():
            additional = self.random.sample(
                list(available_questions), 
                min(remaining_slots, available_questions.count())
            )
            self.selected_questions.extend([(q, 0) for q in additional])
    
    def calculate_distribution(self, exam_questions, distribution_type):
        """Calculate distribution statistics"""
        distribution = Counter()
        
        if distribution_type == 'difficulty':
            for eq in exam_questions:
                q = Question.objects.get(id=eq['original_question_id'])
                distribution[q.difficulty] += 1
            
        elif distribution_type == 'type':
            for eq in exam_questions:
                q = Question.objects.get(id=eq['question_id'])
                distribution[q.question_type] += 1
            
        elif distribution_type == 'bank':
            for eq in exam_questions:
                distribution[eq['bank_id']] += 1
        
        # Convert to percentages
        total = sum(distribution.values())
        if total > 0:
            distribution = {k: round((v / total) * 100, 1) for k, v in distribution.items()}
        
        return dict(distribution)
    
    def get_generation_report(self):
        """Get detailed report of the generation process"""
        return {
            'template': {
                'id': self.template.id,
                'name': self.template.name,
                'total_questions_requested': self.template.total_questions
            },
            'generation': {
                'seed': self.seed,
                'student': self.student.username if self.student else None,
                'questions_generated': len(self.selected_questions),
                'generation_log': self.generation_log
            },
            'distributions': {
                'difficulty': self.calculate_distribution(
                    [(q, i) for q, i in self.selected_questions], 
                    'difficulty'
                ),
                'banks': self.calculate_distribution(
                    [(q, i) for q, i in self.selected_questions], 
                    'bank'
                )
            }
        }


class QuestionPoolAnalyzer:
    """Analytics and optimization for question pools"""
    
    @staticmethod
    def analyze_bank_performance(bank_id, days=30):
        """Analyze question performance in a bank"""
        from django.db.models import Avg, Count, StdDev
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Get usage statistics
        usage_stats = BankQuestion.objects.filter(
            bank_id=bank_id,
            last_used__gte=cutoff_date
        ).aggregate(
            total_used=Count('id'),
            avg_usage=Avg('usage_count'),
            max_usage=Max('usage_count')
        )
        
        # Get performance statistics
        questions_used = QuestionUsageHistory.objects.filter(
            selected_from_bank_id=bank_id,
            used_at__gte=cutoff_date
        )
        
        performance_stats = questions_used.aggregate(
            total_attempts=Count('id'),
            avg_correct=Avg('is_correct'),
            avg_time_spent=Avg('time_spent_seconds'),
            avg_marks=Avg('marks_obtained')
        )
        
        # Difficulty distribution
        difficulty_dist = questions_used.values(
            'question__difficulty'
        ).annotate(count=Count('id')).order_by('question__difficulty')
        
        return {
            'usage': usage_stats,
            'performance': performance_stats,
            'difficulty_distribution': list(difficulty_dist),
            'recommendations': QuestionPoolAnalyzer.generate_bank_recommendations(
                usage_stats, performance_stats
            )
        }
    
    @staticmethod
    def generate_bank_recommendations(usage_stats, performance_stats):
        """Generate recommendations for question bank optimization"""
        recommendations = []
        
        if usage_stats['avg_usage'] and usage_stats['avg_usage'] > 10:
            recommendations.append({
                'type': 'overuse',
                'message': 'Some questions are used too frequently',
                'action': 'Consider adding more questions to the bank'
            })
        
        if performance_stats['avg_correct'] and performance_stats['avg_correct'] < 0.3:
            recommendations.append({
                'type': 'difficulty',
                'message': 'Questions may be too difficult',
                'action': 'Review question difficulty or add easier questions'
            })
        
        if performance_stats['avg_correct'] and performance_stats['avg_correct'] > 0.9:
            recommendations.append({
                'type': 'difficulty',
                'message': 'Questions may be too easy',
                'action': 'Consider adding more challenging questions'
            })
        
        return recommendations
    
    @staticmethod
    def optimize_question_selection(template_id, student_id=None):
        """Optimize question selection for a template and student"""
        template = ExamTemplate.objects.get(id=template_id)
        student = User.objects.get(id=student_id) if student_id else None
        
        # Analyze student's past performance
        if student:
            student_history = QuestionUsageHistory.objects.filter(
                student=student
            ).aggregate(
                avg_correct=Avg('is_correct'),
                difficulty_preference=Count('question__difficulty')
            )
            
            # Adjust template based on student performance
            if student_history['avg_correct'] and student_history['avg_correct'] < 0.5:
                # Student struggles, consider easier questions
                pass  # Implementation would adjust template rules
        
        return {
            'optimizations': [],
            'recommended_adjustments': []
        }
