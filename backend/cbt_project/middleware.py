import json
from django.utils.deprecation import MiddlewareMixin
from accounts.models import AuditLog

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware that automatically logs all mutating API operations
    (POST, PUT, PATCH, DELETE) for authenticated users.
    """
    def process_response(self, request, response):
        # We only care about /api/ paths
        if not request.path.startswith('/api/'):
            return response
            
        # We only log mutating operations
        if request.method not in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return response
            
        # Skip specific auth endpoints because they generate their own explicit logs
        if 'auth/login' in request.path or 'auth/register' in request.path:
            return response

        # DRF populates request.user during view execution
        user = getattr(request, 'user', None)
        
        # We only log for authenticated, non-anonymous users
        if user and user.is_authenticated:
            action_map = {
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete'
            }
            action = action_map.get(request.method)
            
            # Attempt to intelligently parse the targeted model and object ID from the URL
            parts = [p for p in request.path.split('/') if p]
            # typical pattern: /api/exams/exams/4/ -> parts = ['api', 'exams', 'exams', '4']
            model_name = parts[1] if len(parts) > 1 else 'unknown'
            
            if len(parts) > 2 and model_name == parts[2]:
                 # Sometimes its /api/module/module/ -> we want the module clearly
                 pass
            elif len(parts) > 2:
                 model_name = parts[2]
            
            object_id = None
            if len(parts) > 1 and parts[-1].isdigit():
                object_id = int(parts[-1])
            elif len(parts) > 2 and parts[-2].isdigit():
                object_id = int(parts[-2])
                
            # Construct description dynamically
            if action == 'create':
                description = f"Created new {model_name} record via API"
            elif action == 'delete':
                description = f"Deleted {model_name} record (ID: {object_id}) via API"
            else:
                description = f"Updated {model_name} record (ID: {object_id}) via API"
                
            # Get IP and User-Agent
            ip_address = request.META.get('HTTP_X_FORWARDED_FOR')
            if ip_address:
                ip_address = ip_address.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
                
            user_agent = request.META.get('HTTP_USER_AGENT', '')
            
            # We don't want a failing log to crash the request response
            try:
                AuditLog.objects.create(
                    user=user,
                    action=action,
                    model_name=model_name,
                    object_id=object_id,
                    description=description,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception:
                pass # Silently fail if log cannot be created to avoid breaking the core flow
                
        return response
