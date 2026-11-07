from django.db import transaction
from ...services.employee_accounts import rotate_setup, email_employee
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Exists, OuterRef, Q
from ...models import Employee, Role, AuditLog
from ...serializers import EmployeeSerializer
from ...permissions import IsAdminOrHRorSuperintendent
from ..listing import PaginatedListMixin

from .accounts import EmployeeAccountActions
from .leave_credits import EmployeeLeaveCreditActions


class EmployeeViewSet(
    PaginatedListMixin,
    EmployeeAccountActions,
    EmployeeLeaveCreditActions,
    viewsets.ModelViewSet,
):
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
        supervisor_subquery = Employee.objects.filter(supervisor=OuterRef('pk'))
        base_qs = Employee.objects.select_related(
            'user', 'school', 'salary_grade'
        ).order_by('last_name', 'first_name', 'pk').annotate(
            annotated_is_supervisor=Exists(supervisor_subquery)
        )

        if user.is_management:
            return base_qs.all()
        if user.role == Role.PRINCIPAL:
            profile = getattr(user, 'employee_profile', None)
            teachers = Q(pk__in=[])
            if profile and profile.school_id:
                teachers = Q(school_id=profile.school_id, user__role=Role.TEACHING)
            if self.action == 'list':
                return base_qs.filter(teachers)
            return base_qs.filter(Q(user=user) | teachers)
        return base_qs.filter(user=user)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        if request.query_params.get('directory') == 'active':
            queryset = queryset.exclude(registration_status__in=['pending', 'rejected'])
        return self.paginated_list(queryset)

    def create(self, request, *args, **kwargs):
        self.setup_email = None
        with transaction.atomic():
            response = super().create(request, *args, **kwargs)
        if self.setup_email:
            employee, token = self.setup_email
            response.data['email_delivery'] = email_employee(employee, 'setup', token)
        return response

    def perform_create(self, serializer):
        setup = serializer.validated_data.get('send_setup_email', False)
        instance = serializer.save()
        if setup:
            self.setup_email = (instance, rotate_setup(instance))
        AuditLog.objects.create(user=self.request.user, action=f"Created employee record: {instance}")

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Updated Employee: {instance}")

    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted Employee: {instance}")
        instance.delete()

    @action(detail=False, methods=['get'], url_path='leave-staff')
    def leave_staff(self, request):
        staff = Employee.objects.select_related('user').filter(user__is_active=True).order_by('last_name', 'first_name', 'pk')
        page = self.paginate_queryset(staff)
        data = [
            {'id': person.pk, 'name': str(person), 'leave_duty': person.leave_duty,
             'school': person.school_id, 'position': person.position, 'role': person.user.role}
            for person in page
        ]
        return self.get_paginated_response(data)

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
                'e_signature',
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
