from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import IsManagement
from .listing import PaginatedListMixin

class AuditLogViewSet(PaginatedListMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp', '-pk')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsManagement]

    def get_queryset(self):
        user = self.request.user
        if user.is_management:
            return AuditLog.objects.select_related('user', 'user__employee_profile').order_by('-timestamp', '-pk')
        return AuditLog.objects.none()
