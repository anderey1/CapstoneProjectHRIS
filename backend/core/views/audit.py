from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import IsManagement

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsManagement]

    def get_queryset(self):
        user = self.request.user
        if user.is_management:
            return AuditLog.objects.all().order_by('-timestamp')
        return AuditLog.objects.none()
