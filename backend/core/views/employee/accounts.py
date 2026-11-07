from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from ...models import Employee, Role, AuditLog, Notification, User
from ...services.employee_accounts import rotate_setup, email_employee
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
        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": "Email is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        # Create user and employee via canonical manager
        try:
            user_role = Role.TEACHING if staff_role.upper() == 'TEACHING' else Role.NON_TEACHING
            with transaction.atomic():
                return self._register_employee(request, first_name, last_name, department, position, user_role, username, email, password)
        except Exception:
            import logging
            logging.getLogger(__name__).exception('Registration failed')
            return Response({'error': 'Registration failed. Please contact HR.'}, status=400)

    def _register_employee(self, request, first_name, last_name, department, position, user_role, username, email, password):
        employee = Employee.objects.create_with_user(
            user_data={
                'username': username,
                'email': email,
                'password': password,
                'role': user_role,
                'is_active': False,
            },
            employee_data={
                'registration_status': 'pending',
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

        Notification.objects.bulk_create([
            Notification(recipient=recipient, title=f'Review registration: {first_name} {last_name}', source_type='registration', source_id=employee.pk)
            for recipient in User.objects.filter(role=Role.HR, is_active=True)
        ])
        return Response({"message": "Registration submitted successfully! Please wait for HR approval before logging in."}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrHRorSuperintendent], url_path='pending-registrations')
    def list_pending_registrations(self, request):
        pending_employees = self.get_queryset().filter(registration_status='pending', user__is_active=False)
        return self.paginated_list(pending_employees)

    @action(detail=False, methods=['GET'], url_path='rejected-registrations')
    def rejected_registrations(self, request):
        return self.paginated_list(self.get_queryset().filter(registration_status='rejected'))

    def _review_registration(self, request, rejected=False):
        reason = serializers.CharField(max_length=2000).run_validation(request.data.get('reason')) if rejected else ''
        with transaction.atomic():
            employee = Employee.objects.select_for_update().get(pk=self.get_object().pk)
            if not employee.user_id or employee.registration_status != 'pending':
                return Response({'error': 'Only pending registrations can be reviewed.'}, status=400)
            user = User.objects.select_for_update().get(pk=employee.user_id)
            if user.is_active:
                return Response({'error': 'This account is already active.'}, status=400)
            employee.registration_status = 'rejected' if rejected else 'approved'
            employee.rejection_reason = reason
            employee.reviewed_by = request.user
            employee.reviewed_at = timezone.now()
            employee.save(update_fields=['registration_status', 'rejection_reason', 'reviewed_by', 'reviewed_at'])
            user.is_active = not rejected
            user.save(update_fields=['is_active'])
            AuditLog.objects.create(user=request.user, action=f'{employee.registration_status.title()} registration for employee {employee.pk}')
        delivery = email_employee(employee, employee.registration_status)
        return Response({'message': f'Registration {employee.registration_status}.', 'email_delivery': delivery})

    @action(detail=True, methods=['POST'], url_path='approve-registration')
    def approve_registration(self, request, pk=None):
        return self._review_registration(request)

    @action(detail=True, methods=['POST'], url_path='reject-registration')
    def reject_registration(self, request, pk=None):
        return self._review_registration(request, rejected=True)

    @action(detail=True, methods=['POST'], url_path='resend-setup')
    def resend_setup(self, request, pk=None):
        with transaction.atomic():
            employee = Employee.objects.select_for_update().get(pk=self.get_object().pk)
            if not employee.user_id or not employee.user.is_active or employee.user.has_usable_password():
                return Response({'error': 'Password setup is not pending for this employee.'}, status=400)
            token = rotate_setup(employee)
            AuditLog.objects.create(user=request.user, action=f'Resent password setup for employee {employee.pk}')
        return Response({'message': 'Password setup link renewed.', 'email_delivery': email_employee(employee, 'setup', token)})

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
