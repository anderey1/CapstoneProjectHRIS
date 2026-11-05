from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from ...models import Employee, Role, AuditLog
from ...permissions import IsAdminOrHRorSuperintendent


class EmployeeAccountActions:
    @action(detail=False, methods=['POST'], permission_classes=[AllowAny], url_path='register-existing')
    def register_existing(self, request):
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        department = request.data.get('department') # Area
        position = request.data.get('position') # Role
        staff_role = request.data.get('role') # 'TEACHING' or 'NON_TEACHING'
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([first_name, last_name, department, position, staff_role, username, email, password]):
            return Response({"error": "All fields are required (first_name, last_name, department, position, role, username, email, password)."}, status=status.HTTP_400_BAD_REQUEST)

        # Check user availability
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username is already taken."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=email).exists():
            return Response({"error": "Email is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user and employee via canonical manager
        try:
            user_role = Role.TEACHING if staff_role.upper() == 'TEACHING' else Role.NON_TEACHING
            employee = Employee.objects.create_with_user(
                user_data={
                    'username': username,
                    'email': email,
                    'password': password,
                    'role': user_role,
                    'is_active': False,
                },
                employee_data={
                    'first_name': first_name,
                    'last_name': last_name,
                    'department': department,
                    'position': position,
                    'email': email,
                }
            )

            AuditLog.objects.create(
                user=employee.user,
                action=f"Registered pending user account '{username}' for new employee '{first_name} {last_name}'"
            )

            return Response({"message": "Registration submitted successfully! Please wait for HR approval before logging in."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Registration error: {e}", exc_info=True)
            return Response(
                {"error": "An unexpected error occurred during registration. Please check your inputs or contact HR."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrHRorSuperintendent], url_path='pending-registrations')
    def list_pending_registrations(self, request):
        pending_employees = self.get_queryset().filter(user__is_active=False)
        return self.paginated_list(pending_employees)

    @action(detail=True, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent], url_path='approve-registration')
    def approve_registration(self, request, pk=None):
        employee = self.get_object()
        if not employee.user:
            return Response({"error": "This employee does not have a user account request."}, status=status.HTTP_400_BAD_REQUEST)
        if employee.user.is_active:
            return Response({"error": "This employee account is already active."}, status=status.HTTP_400_BAD_REQUEST)

        user = employee.user
        user.is_active = True
        user.save()

        AuditLog.objects.create(
            user=request.user,
            action=f"Approved user account registration for employee: {employee.first_name} {employee.last_name} ({user.username})"
        )
        return Response({"message": f"Successfully approved and activated account for {employee.first_name} {employee.last_name}."})

    @action(detail=True, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent], url_path='reject-registration')
    def reject_registration(self, request, pk=None):
        employee = self.get_object()
        if not employee.user:
            return Response({"error": "This employee does not have a user account request."}, status=status.HTTP_400_BAD_REQUEST)
        if employee.user.is_active:
            return Response({"error": "Active accounts cannot be rejected. Please disable them instead."}, status=status.HTTP_400_BAD_REQUEST)

        user = employee.user
        username = user.username
        employee_name = f"{employee.first_name} {employee.last_name}"

        # Delete both Employee and User created during registration
        employee.delete()
        user.delete()

        AuditLog.objects.create(
            user=request.user,
            action=f"Rejected and deleted user account registration request for employee: {employee_name} ({username})"
        )
        return Response({"message": f"Successfully rejected and deleted registration request for {employee_name}."})

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated], url_path='change-password')
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({"error": "Both old_password and new_password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"error": "Incorrect old password."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"error": "New password must be at least 8 characters long."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        AuditLog.objects.create(user=user, action="Changed password.")
        return Response({"message": "Password changed successfully."})
