from rest_framework import viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from ..models import Employee, School, Role, AuditLog
from ..serializers import EmployeeSerializer
from ..permissions import IsAdminOrHR

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrHR]
        return [permission() for permission in permission_classes]

    def get_queryset(self): 
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Employee.objects.all()
        return Employee.objects.filter(user=user)

    def perform_create(self, serializer):
        try:
            instance = serializer.save()
            AuditLog.objects.create(user=self.request.user, action=f"Created Employee: {instance}")
        except Exception as e:
            print(f"DEBUG: perform_create error: {e}")
            raise
            
    def perform_update(self, serializer):
        try:
            instance = serializer.save()
            AuditLog.objects.create(user=self.request.user, action=f"Updated Employee: {instance}")
        except Exception as e:
            print(f"DEBUG: perform_update error: {e}")
            raise


    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted Employee: {instance}")
        instance.delete()


    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user
        if hasattr(user, 'employee_profile'):
            serializer = self.get_serializer(user.employee_profile)
            return Response(serializer.data)
        
        # Fallback for users without an employee profile
        is_admin = user.is_superuser or user.role == Role.ADMIN
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
            "sick_leave_balance": 0,
            "vacation_leave_balance": 0,
            "date_hired": None,
            "school_details": None
        })
