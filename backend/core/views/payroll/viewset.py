from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ...models import Payroll, AuditLog
from ...serializers import PayrollSerializer
from ..listing import PaginatedListMixin
from ...permissions import IsAccountant, IsSuperintendent

from .generation import PayrollGenerationActions
from .processing import PayrollProcessingActions
from .exports import PayrollExportActions


class PayrollViewSet(
    PaginatedListMixin,
    PayrollGenerationActions,
    PayrollProcessingActions,
    PayrollExportActions,
    viewsets.ModelViewSet,
):
    queryset = Payroll.objects.all().order_by('-date_generated', '-pk')

    serializer_class = PayrollSerializer

    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [(IsAccountant | IsSuperintendent)()]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        base_qs = Payroll.objects.select_related(
            'employee',
            'employee__user',
            'employee__school'
        ).order_by('-date_generated', '-pk')

        if user.is_management:
            return base_qs.all()
        return base_qs.filter(employee__user=user)

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            action=f"Deleted payroll: {instance.employee} ({instance.cutoff_period})"
        )
        instance.delete()
