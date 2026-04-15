from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, AuditLog, Notification

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'role', 'phone', 'profile_picture', 'is_active', 
                  'password', 'password_confirm', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if 'password' in attrs:
            if attrs.get('password') != attrs.get('password_confirm'):
                raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    actor_username = serializers.CharField(source='actor.username', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'actor', 'actor_username', 'type', 
                  'type_display', 'title', 'message', 'is_read', 
                  'related_object_id', 'related_model_name', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def update(self, instance, validated_data):
        """Update user with optional password change"""
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'last_login', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_username', 'action', 'action_display', 
                  'severity', 'model_name', 'object_id', 'description', 
                  'ip_address', 'user_agent', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class LoginSerializer(serializers.Serializer):
    """Serializer for login"""
    
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({"new_password": "Passwords don't match"})
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration (students only)"""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        
        # Force role to student for public registration
        user = User.objects.create(
            **validated_data,
            role='student',
            is_active=True
        )
        user.set_password(password)
        user.save()
        return user