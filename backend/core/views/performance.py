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
            from ..permissions import IsAdmin, IsHR, IsSupervisor
            permission_classes = [IsAuthenticated, (IsAdmin | IsHR | IsSupervisor)]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.ADMIN, Role.HR, Role.SUPERVISOR]:
            return PerformanceReview.objects.all().order_by('-date_evaluated')
        return PerformanceReview.objects.filter(employee__user=user).order_by('-date_evaluated')

    def perform_create(self, serializer):
        scores = {
            'punctuality_score': serializer.validated_data['punctuality_score'],
            'quality_score': serializer.validated_data['quality_score'],
            'behavior_score': serializer.validated_data['behavior_score']
        }
        
        # AI Summary & Promotion Logic
        summary = generate_performance_summary(scores, f"Period: {serializer.validated_data['period']}")
        eligible = (sum(scores.values()) / 3) >= 4.0

        instance = serializer.save(ai_summary=summary, is_promotion_eligible=eligible)
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Created Rating: {instance.employee} ({instance.period})"
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Deleted Rating: {instance.employee} ({instance.period})"
        )
        instance.delete()

