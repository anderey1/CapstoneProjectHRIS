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
        if self.action in ['list', 'retrieve', 'me']:
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
            # Security: Whitelist fields for self-update
            allowed_fields = ['face_descriptor', 'mobile_no', 'residential_address', 'permanent_address', 'e_signature']
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
