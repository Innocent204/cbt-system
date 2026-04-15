import os
import django
from django.contrib.auth import get_user_model

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cbt_project.settings')
django.setup()

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin', 
        email='admin@example.com', 
        password='adminpassword123',
        role='admin'
    )
    print('Admin superuser "admin" created with password: adminpassword123')
else:
    user = User.objects.get(username='admin')
    if user.role != 'admin':
        user.role = 'admin'
        user.save()
        print('Existing "admin" user updated to "admin" role.')
    else:
        print('Admin superuser "admin" already exists.')
