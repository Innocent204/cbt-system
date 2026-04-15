"""
Script to delete questions that are missing required options
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cbt_project.settings')
django.setup()

from questions.models import Question, Option

def delete_questions_missing_options():
    """Delete MCQ and True/False questions without proper options"""
    
    print("=" * 60)
    print("Deleting questions with missing options...")
    print("=" * 60)
    
    # Get MCQ questions with insufficient options
    mcq_questions = Question.objects.filter(question_type='mcq')
    mcq_to_delete = []
    for question in mcq_questions:
        option_count = question.options.count()
        if option_count < 2:
            mcq_to_delete.append(question)
    
    # Get True/False questions without exactly 2 options
    tf_questions = Question.objects.filter(question_type='true_false')
    tf_to_delete = []
    for question in tf_questions:
        option_count = question.options.count()
        if option_count != 2:
            tf_to_delete.append(question)
    
    # Get questions without correct answer marked
    questions_without_correct = []
    for question in Question.objects.filter(question_type__in=['mcq', 'true_false']):
        correct_count = question.options.filter(is_correct=True).count()
        if correct_count != 1:
            questions_without_correct.append(question)
    
    # Combine all unique questions to delete
    all_to_delete = set(mcq_to_delete + tf_to_delete + questions_without_correct)
    
    print(f"\nQuestions to delete: {len(all_to_delete)}")
    print(f"  - MCQ with <2 options: {len(mcq_to_delete)}")
    print(f"  - True/False without 2 options: {len(tf_to_delete)}")
    print(f"  - Without correct answer: {len(questions_without_correct)}")
    
    if all_to_delete:
        # Delete the questions (cascade will delete options and related data)
        for question in all_to_delete:
            print(f"Deleting question {question.id}: {question.text[:50]}...")
            question.delete()
        
        print("\n" + "=" * 60)
        print(f"Successfully deleted {len(all_to_delete)} questions")
        print("=" * 60)
    else:
        print("\nNo questions to delete.")

if __name__ == '__main__':
    delete_questions_missing_options()
