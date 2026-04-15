"""
Async grading queue system for scalable result processing
"""
import json
import time
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from collections import deque
import threading
import queue

from exams.models import ExamAttempt
from questions.models import StudentAnswer
from results.models import Result
from security_utils import log_security_event


class GradingTask:
    """Individual grading task in the queue"""
    
    def __init__(self, attempt_id, priority='normal'):
        self.attempt_id = attempt_id
        self.priority = priority
        self.created_at = timezone.now()
        self.status = 'pending'
        self.result = None
        self.error = None
        self.retry_count = 0
        self.max_retries = 3
        
    def to_dict(self):
        """Convert task to dictionary for storage"""
        return {
            'attempt_id': self.attempt_id,
            'priority': self.priority,
            'created_at': self.created_at.isoformat(),
            'status': self.status,
            'result': self.result,
            'error': self.error,
            'retry_count': self.retry_count
        }


class GradingQueue:
    """High-performance grading queue with priority support"""
    
    def __init__(self, max_workers=4, queue_size=1000):
        self.max_workers = max_workers
        self.queue_size = queue_size
        self.task_queue = queue.PriorityQueue(maxsize=queue_size)
        self.active_tasks = {}
        self.completed_tasks = deque(maxlen=1000)
        self.failed_tasks = deque(maxlen=100)
        self.workers = []
        self.is_running = False
        self.stats = {
            'total_processed': 0,
            'total_failed': 0,
            'avg_processing_time': 0.0,
            'queue_size': 0,
            'active_workers': 0
        }
        
    def start(self):
        """Start the grading queue workers"""
        if self.is_running:
            return
            
        self.is_running = True
        self.workers = []
        
        for i in range(self.max_workers):
            worker = threading.Thread(
                target=self._worker_loop,
                name=f"GradingWorker-{i}",
                daemon=True
            )
            worker.start()
            self.workers.append(worker)
        
        # Start stats collector
        stats_thread = threading.Thread(
            target=self._stats_collector,
            name="StatsCollector",
            daemon=True
        )
        stats_thread.start()
        
        print(f"Grading queue started with {self.max_workers} workers")
    
    def stop(self):
        """Stop the grading queue workers"""
        self.is_running = False
        
        # Wait for workers to finish
        for worker in self.workers:
            worker.join(timeout=5)
        
        self.workers = []
        print("Grading queue stopped")
    
    def submit_task(self, attempt_id, priority='normal'):
        """Submit a grading task to the queue"""
        if not self.is_running:
            raise RuntimeError("Grading queue is not running")
        
        task = GradingTask(attempt_id, priority)
        
        # Priority mapping: high=1, normal=2, low=3
        priority_map = {'high': 1, 'normal': 2, 'low': 3}
        priority_value = priority_map.get(priority, 2)
        
        try:
            self.task_queue.put((priority_value, task), timeout=1)
            return task
        except queue.Full:
            raise RuntimeError("Grading queue is full")
    
    def get_task_status(self, attempt_id):
        """Get status of a specific task"""
        # Check active tasks
        if attempt_id in self.active_tasks:
            return self.active_tasks[attempt_id].to_dict()
        
        # Check completed tasks
        for task in self.completed_tasks:
            if task.attempt_id == attempt_id:
                return task.to_dict()
        
        # Check failed tasks
        for task in self.failed_tasks:
            if task.attempt_id == attempt_id:
                return task.to_dict()
        
        return None
    
    def get_queue_stats(self):
        """Get current queue statistics"""
        return {
            **self.stats,
            'queue_size': self.task_queue.qsize(),
            'active_workers': len([w for w in self.workers if w.is_alive()]),
            'is_running': self.is_running
        }
    
    def _worker_loop(self):
        """Main worker loop for processing grading tasks"""
        while self.is_running:
            try:
                # Get task from queue
                priority_value, task = self.task_queue.get(timeout=1)
                
                # Add to active tasks
                self.active_tasks[task.attempt_id] = task
                task.status = 'processing'
                
                start_time = time.time()
                
                try:
                    # Process the grading task
                    result = self._process_grading_task(task.attempt_id)
                    task.result = result
                    task.status = 'completed'
                    
                    # Move to completed
                    self.completed_tasks.append(task)
                    self.stats['total_processed'] += 1
                    
                except Exception as e:
                    task.error = str(e)
                    task.retry_count += 1
                    
                    if task.retry_count <= task.max_retries:
                        # Retry the task
                        task.status = 'retrying'
                        priority_map = {'high': 1, 'normal': 2, 'low': 3}
                        priority_value = priority_map.get(task.priority, 2)
                        self.task_queue.put((priority_value, task), timeout=0.1)
                    else:
                        # Max retries exceeded
                        task.status = 'failed'
                        self.failed_tasks.append(task)
                        self.stats['total_failed'] += 1
                        
                        # Log the failure
                        try:
                            attempt = ExamAttempt.objects.get(id=task.attempt_id)
                            log_security_event(
                                user=attempt.student,
                                action='grading_failed',
                                description=f"Grading failed for attempt {task.attempt_id}: {str(e)}",
                                severity='high',
                                model_name='ExamAttempt',
                                object_id=task.attempt_id
                            )
                        except:
                            pass
                
                finally:
                    # Remove from active tasks
                    self.active_tasks.pop(task.attempt_id, None)
                    
                    # Update processing time stats
                    processing_time = time.time() - start_time
                    self._update_processing_time_stats(processing_time)
                    
                    # Mark task as done
                    self.task_queue.task_done()
                    
            except queue.Empty:
                continue
            except Exception as e:
                print(f"Worker error: {e}")
                continue
    
    def _process_grading_task(self, attempt_id):
        """Process a single grading task"""
        with transaction.atomic():
            # Lock the attempt for grading
            attempt = ExamAttempt.objects.select_for_update().get(id=attempt_id)
            
            if attempt.status != 'submitted':
                raise ValueError(f"Attempt {attempt_id} is not in submitted status")
            
            # Get all answers for this attempt
            answers = StudentAnswer.objects.filter(attempt=attempt).select_related('question', 'selected_option')
            
            # Grade the answers
            total_marks = 0
            marks_obtained = 0
            correct_answers = 0
            incorrect_answers = 0
            unanswered = 0
            
            for answer in answers:
                question = answer.question
                total_marks += question.marks
                
                # Auto-grade objective questions
                if question.question_type in ['mcq', 'true_false']:
                    marks = answer.auto_grade()
                    marks_obtained += marks
                    
                    if marks > 0:
                        correct_answers += 1
                    else:
                        incorrect_answers += 1
                else:
                    # Subjective questions need manual grading
                    unanswered += 1
            
            # Calculate percentage
            percentage = (marks_obtained / total_marks * 100) if total_marks > 0 else 0
            
            # Update attempt with scores
            attempt.score = marks_obtained
            attempt.percentage = percentage
            attempt.save()
            
            # Create or update result
            result, created = Result.objects.update_or_create(
                attempt=attempt,
                defaults={
                    exam: attempt.exam,
                    student: attempt.student,
                    total_marks: total_marks,
                    marks_obtained: marks_obtained,
                    percentage: percentage,
                    is_passed: percentage >= attempt.exam.passing_marks,
                    total_questions: answers.count(),
                    correct_answers: correct_answers,
                    incorrect_answers: incorrect_answers,
                    unanswered: unanswered,
                    time_taken_minutes: int((attempt.submit_time - attempt.start_time).total_seconds() / 60) if attempt.submit_time else 0
                }
            )
            
            return {
                'attempt_id': attempt_id,
                'score': float(marks_obtained),
                'percentage': float(percentage),
                'is_passed': percentage >= attempt.exam.passing_marks,
                'result_id': result.id,
                'processed_at': timezone.now().isoformat()
            }
    
    def _update_processing_time_stats(self, processing_time):
        """Update processing time statistics"""
        # Simple moving average
        if self.stats['total_processed'] == 0:
            self.stats['avg_processing_time'] = processing_time
        else:
            alpha = 0.1  # Smoothing factor
            self.stats['avg_processing_time'] = (
                alpha * processing_time + 
                (1 - alpha) * self.stats['avg_processing_time']
            )
    
    def _stats_collector(self):
        """Background thread to collect and update statistics"""
        while self.is_running:
            try:
                self.stats['queue_size'] = self.task_queue.qsize()
                time.sleep(5)  # Update every 5 seconds
            except:
                break


class BatchGradingProcessor:
    """Process multiple exam attempts in batches for efficiency"""
    
    def __init__(self, batch_size=50):
        self.batch_size = batch_size
        
    def process_pending_submissions(self, exam_id=None):
        """Process all pending submissions for an exam or all exams"""
        attempts_query = ExamAttempt.objects.filter(status='submitted')
        
        if exam_id:
            attempts_query = attempts_query.filter(exam_id=exam_id)
        
        # Process in batches
        processed = 0
        failed = 0
        
        while True:
            attempts = attempts_query.order_by('submit_time')[:self.batch_size]
            
            if not attempts:
                break
            
            batch_results = self._process_batch(attempts)
            processed += batch_results['processed']
            failed += batch_results['failed']
            
            print(f"Processed batch: {batch_results['processed']} successful, {batch_results['failed']} failed")
        
        return {
            'total_processed': processed,
            'total_failed': failed
        }
    
    def _process_batch(self, attempts):
        """Process a batch of attempts"""
        processed = 0
        failed = 0
        
        for attempt in attempts:
            try:
                # Use the grading queue for processing
                from .views import grading_queue
                task = grading_queue.submit_task(attempt.id, priority='normal')
                processed += 1
                
            except Exception as e:
                print(f"Failed to submit attempt {attempt.id}: {e}")
                failed += 1
        
        return {'processed': processed, 'failed': failed}


class GradingQueueManager:
    """Singleton manager for the grading queue"""
    
    _instance = None
    _queue = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def get_queue(self):
        """Get or create the grading queue"""
        if self._queue is None:
            max_workers = getattr(settings, 'GRADING_QUEUE_WORKERS', 4)
            queue_size = getattr(settings, 'GRADING_QUEUE_SIZE', 1000)
            self._queue = GradingQueue(max_workers, queue_size)
            self._queue.start()
        return self._queue
    
    def shutdown(self):
        """Shutdown the grading queue"""
        if self._queue:
            self._queue.stop()
            self._queue = None


# Global queue instance
grading_queue_manager = GradingQueueManager()
grading_queue = grading_queue_manager.get_queue()


# Django management command integration
def queue_grading_task(attempt_id, priority='normal'):
    """Queue a grading task (convenience function)"""
    return grading_queue.submit_task(attempt_id, priority)


def get_grading_status(attempt_id):
    """Get grading status for an attempt (convenience function)"""
    return grading_queue.get_task_status(attempt_id)


def get_queue_statistics():
    """Get queue statistics (convenience function)"""
    return grading_queue.get_queue_stats()
