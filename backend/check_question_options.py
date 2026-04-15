"""
Script to check for questions that are missing required options
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cbt_project.settings')
django.setup()

from questions.models import Question, Option

def check_missing_options():
    """Check for MCQ and True/False questions without options"""
    
    print("=" * 60)
    print("Checking for questions missing required options...")
    print("=" * 60)
    
    # Get all MCQ and True/False questions
    mcq_questions = Question.objects.filter(question_type='mcq')
    tf_questions = Question.objects.filter(question_type='true_false')
    
    total_mcq = mcq_questions.count()
    total_tf = tf_questions.count()
    
    # Check MCQ questions
    mcq_without_options = []
    for question in mcq_questions:
        option_count = question.options.count()
        if option_count == 0:
            mcq_without_options.append(question)
        elif option_count < 2:
            mcq_without_options.append(question)
    
    # Check True/False questions
    tf_without_options = []
    for question in tf_questions:
        option_count = question.options.count()
        if option_count == 0:
            tf_without_options.append(question)
        elif option_count != 2:
            tf_without_options.append(question)
    
    # Report findings
    print(f"\nTotal MCQ questions: {total_mcq}")
    print(f"MCQ questions with insufficient options (<2): {len(mcq_without_options)}")
    
    print(f"\nTotal True/False questions: {total_tf}")
    print(f"True/False questions without exactly 2 options: {len(tf_without_options)}")
    
    if mcq_without_options:
        print("\n" + "=" * 60)
        print("MCQ Questions Missing Options:")
        print("=" * 60)
        for q in mcq_without_options:
            print(f"ID: {q.id} | Text: {q.text[:50]}... | Options: {q.options.count()}")
    
    if tf_without_options:
        print("\n" + "=" * 60)
        print("True/False Questions Missing Options:")
        print("=" * 60)
        for q in tf_without_options:
            print(f"ID: {q.id} | Text: {q.text[:50]}... | Options: {q.options.count()}")
    
    # Check for questions without correct option
    print("\n" + "=" * 60)
    print("Questions without correct answer marked:")
    print("=" * 60)
    
    questions_without_correct = []
    for question in Question.objects.filter(question_type__in=['mcq', 'true_false']):
        correct_count = question.options.filter(is_correct=True).count()
        if correct_count == 0:
            questions_without_correct.append(question)
        elif correct_count > 1:
            questions_without_correct.append(question)
    
    print(f"Questions without exactly 1 correct answer: {len(questions_without_correct)}")
    
    if questions_without_correct:
        for q in questions_without_correct:
            correct_count = q.options.filter(is_correct=True).count()
            print(f"ID: {q.id} | Text: {q.text[:50]}... | Correct answers: {correct_count}")
    
    print("\n" + "=" * 60)
    print("Check complete!")
    print("=" * 60)

if __name__ == '__main__':
    check_missing_options()
