import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cbt_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_users():
    users = [
        {
            'username': 'admin_user',
            'email': 'admin@example.com',
            'password': 'password123',
            'role': 'admin',
            'first_name': 'System',
            'last_name': 'Administrator',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'username': 'examiner_user',
            'email': 'examiner@example.com',
            'password': 'password123',
            'role': 'examiner',
            'first_name': 'John',
            'last_name': 'Examiner'
        },
        {
            'username': 'student_user',
            'email': 'student@example.com',
            'password': 'password123',
            'role': 'student',
            'first_name': 'Jane',
            'last_name': 'Student'
        }
    ]

    for user_data in users:
        username = user_data['username']
        email = user_data['email']
        password = user_data.pop('password')
        
        user, created = User.objects.get_or_create(
            username=username,
            defaults=user_data
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"Successfully created {user_data['role']}: {username}")
        else:
            print(f"User {username} already exists.")

if __name__ == '__main__':
    create_sample_users()
