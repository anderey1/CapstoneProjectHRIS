from rest_framework import permissions
from core.models import Role

class BaseRolePermission(permissions.BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.role in self.allowed_roles)
        )

class IsAdmin(BaseRolePermission):
    allowed_roles = [Role.ADMIN]

class IsHR(BaseRolePermission):
    allowed_roles = [Role.HR]

class IsSuperintendent(BaseRolePermission):
    allowed_roles = [Role.SUPERINTENDENT]

class IsAccountant(BaseRolePermission):
    allowed_roles = [Role.ACCOUNTANT]

class IsEmployee(BaseRolePermission):
    allowed_roles = [Role.TEACHING, Role.NON_TEACHING, Role.ADMIN, Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT]
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role in [Role.ADMIN, Role.HR]:
            return True
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class IsAdminOrHR(BaseRolePermission):
    allowed_roles = [Role.ADMIN, Role.HR]

class IsAdminOrHRorSuperintendent(BaseRolePermission):
    allowed_roles = [Role.ADMIN, Role.HR, Role.SUPERINTENDENT]

class IsManagement(BaseRolePermission):
    """Matches frontend isManagement check."""
    allowed_roles = [Role.ADMIN, Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT]

class IsEmployeeOrAdminOrHR(BaseRolePermission):
    allowed_roles = [Role.TEACHING, Role.ADMIN, Role.HR, Role.NON_TEACHING]

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.role in [Role.ADMIN, Role.HR]:
            return True
        if hasattr(obj, 'employee'):
            return obj.employee.user == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        return False