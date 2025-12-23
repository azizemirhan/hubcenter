from rest_framework import permissions

class IsCompanyMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'active_company')

class HasModulePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        module = getattr(view, 'module_name', None)
        action_map = {'GET': 'view', 'POST': 'create', 'PUT': 'edit', 'DELETE': 'delete'}
        action = action_map.get(request.method, 'view')
        return request.user.has_module_permission(module, action) if module else True
