from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    """Permission for admin users only"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class IsExaminerUser(permissions.BasePermission):
    """Permission for examiner users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_examiner or request.user.is_admin
        )


class IsStudentUser(permissions.BasePermission):
    """Permission for student users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_student


class IsOwnerOrAdmin(permissions.BasePermission):
    """Permission for object owner or admin"""
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        
        # Check if object has user or student field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'student'):
            return obj.student == request.user
        elif hasattr(obj, 'id'):
            return obj.id == request.user.id
        
        return False