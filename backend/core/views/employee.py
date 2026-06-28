from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from ..models import Employee, School, Role, AuditLog, SalaryGrade
from ..serializers import EmployeeSerializer, SchoolSerializer, SalaryGradeSerializer
from ..permissions import IsAdminOrHR, IsSuperintendent, IsAdminOrHRorSuperintendent

class SalaryGradeViewSet(viewsets.ModelViewSet):
    queryset = SalaryGrade.objects.all()
    serializer_class = SalaryGradeSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Created School: {instance.name}")

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Updated School: {instance.name}")

    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted School: {instance.name}")
        instance.delete()

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action == 'register_existing':
            return [AllowAny()]
        if self.action in ['list', 'retrieve', 'me', 'change_password']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Employee.objects.none()
        if user.is_superuser or user.role in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]:
            return Employee.objects.all()
        return Employee.objects.filter(user=user)

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Created employee record: {instance}")
            
    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Updated Employee: {instance}")

    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted Employee: {instance}")
        instance.delete()

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

        # Create user and employee directly
        from django.db import transaction
        try:
            with transaction.atomic():
                user_role = Role.TEACHING if staff_role.upper() == 'TEACHING' else Role.NON_TEACHING

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    role=user_role,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=False # Pending HR Approval
                )

                employee = Employee.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    department=department,
                    position=position,
                    email=email
                )

                AuditLog.objects.create(
                    user=user,
                    action=f"Registered pending user account '{username}' for new employee '{first_name} {last_name}'"
                )

            return Response({"message": "Registration submitted successfully! Please wait for HR approval before logging in."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"An error occurred during registration: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['GET'], permission_classes=[IsAdminOrHRorSuperintendent], url_path='pending-registrations')
    def list_pending_registrations(self, request):
        pending_employees = Employee.objects.filter(user__is_active=False)
        serializer = self.get_serializer(pending_employees, many=True)
        return Response(serializer.data)

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

    @action(detail=False, methods=['GET', 'PATCH'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        
        # Ensure profile exists
        if not hasattr(user, 'employee_profile'):
            if request.method == 'PATCH':
                # Auto-create profile for system users so they can have biometrics/contact info
                employee = Employee.objects.create(
                    user=user,
                    first_name=user.first_name or user.username,
                    last_name=user.last_name or ""
                )
            else:
                # GET fallback for system users (Admin)
                is_admin = user.is_superuser or user.role in [Role.ADMINISTRATIVE]
                return Response({
                    "id": None,
                    "first_name": user.first_name or user.username,
                    "last_name": user.last_name or "(No Profile)",
                    "position": "System User" if is_admin else "Unassigned",
                    "department": "Management" if is_admin else "General",
                    "user_details": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "first_name": user.first_name,
                        "last_name": user.last_name
                    },
                    "salary": 0,
                    "leave_balance": 0,
                    "date_hired": None,
                    "school_details": None
                })
        else:
            employee = user.employee_profile
        
        if request.method == 'PATCH':
            # Security: Whitelist fields for self-update (allowing all personal / PDS details, but excluding employment details like position, salary, leave balance)
            allowed_fields = [
                'first_name', 'last_name', 'middle_name', 'name_extension',
                'date_of_birth', 'place_of_birth', 'sex', 'civil_status',
                'umid_id', 'pagibig_id', 'philhealth_no', 'philsys_id', 'tin_no', 'agency_employee_no',
                'mobile_no', 'residential_address', 'permanent_address',
                'face_descriptor', 'e_signature',
                'family', 'education', 'eligibilities', 'work_experience'
            ]
            update_data = {k: v for k, v in request.data.items() if k in allowed_fields}
            
            if not update_data:
                return Response({"detail": "No valid fields provided for update."}, status=status.HTTP_400_BAD_REQUEST)
                
            serializer = self.get_serializer(employee, data=update_data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            AuditLog.objects.create(user=user, action=f"Self-updated profile: {employee}")
            return Response(serializer.data)

        # Default GET
        serializer = self.get_serializer(employee)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
    def award_yearly_credits(self, request):
        from decimal import Decimal
        # Award +15.0 to vacation and sick leave balances of all employees
        employees = Employee.objects.all()
        count = employees.count()
        for emp in employees:
            emp.vacation_leave_balance += Decimal('15.0')
            emp.sick_leave_balance += Decimal('15.0')
            emp.save()
        
        AuditLog.objects.create(user=request.user, action=f"Awarded yearly leave credits (+15 days) to all {count} employees.")
        return Response({"message": f"Successfully awarded 15 leave credits to {count} employees."})

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
