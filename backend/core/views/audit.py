from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import AuditLog, Role
from ..serializers import AuditLogSerializer
from ..permissions import IsAdminOnly

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == Role.ADMINISTRATIVE:
            return AuditLog.objects.all().order_by('-timestamp')
        return AuditLog.objects.none()
