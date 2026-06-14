from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from ..models import PerformanceReview, Role, AuditLog
from ..serializers import PerformanceReviewSerializer
from ..utils import generate_performance_summary

class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all().order_by('-date_evaluated')
    serializer_class = PerformanceReviewSerializer
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Allow all authenticated users to create (employees can upload their own IPCRF)
            if self.action == 'create':
                permission_classes = [IsAuthenticated]
            else:
                from ..permissions import IsAdmin, IsHR, IsSuperintendent
                permission_classes = [IsAuthenticated, (IsAdmin | IsHR | IsSuperintendent)]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.ADMIN, Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]:
            return PerformanceReview.objects.all().order_by('-date_evaluated')
        return PerformanceReview.objects.filter(employee__user=user).order_by('-date_evaluated')

    def perform_create(self, serializer):
        user = self.request.user
        employee = serializer.validated_data.get('employee')
        
        # Security: Employees can only create records for themselves
        if not (user.is_superuser or user.role in [Role.ADMIN, Role.HR, Role.SUPERINTENDENT]):
            from ..models import Employee
            try:
                user_employee = Employee.objects.get(user=user)
                if employee and employee != user_employee:
                    raise ValidationError("You can only create performance records for yourself.")
                employee = user_employee
            except Employee.DoesNotExist:
                raise ValidationError("Employee profile not found.")
        
        # If admin/hr didn't provide an employee, it's an error unless they have a profile too
        if not employee:
            from ..models import Employee
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                raise ValidationError("Please select an employee.")
        
        # Extract scores if provided
        punctuality = serializer.validated_data.get('punctuality_score')
        quality = serializer.validated_data.get('quality_score')
        behavior = serializer.validated_data.get('behavior_score')
        
        summary = "File Uploaded"
        eligible = False
        
        # Only generate AI summary if all scores are present and are valid numbers
        try:
            if all(v is not None for v in [punctuality, quality, behavior]):
                scores = {
                    'punctuality_score': float(punctuality),
                    'quality_score': float(quality),
                    'behavior_score': float(behavior)
                }
                summary = generate_performance_summary(scores, f"Period: {serializer.validated_data['period']}")
                eligible = (sum(scores.values()) / 3) >= 4.0
        except (ValueError, TypeError):
            # Fallback if scores are not valid numbers
            pass
        
        save_kwargs = {
            'employee': employee,
            'ai_summary': summary,
            'is_promotion_eligible': eligible
        }
        
        instance = serializer.save(**save_kwargs)
        
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Created Rating/Upload: {instance.employee} ({instance.period})"
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Deleted Rating: {instance.employee} ({instance.period})"
        )
        instance.delete()
