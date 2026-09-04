from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import IsAdminOrHRorSuperintendent

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHRorSuperintendent]

    def get_queryset(self):
        # Admins, HR and Superintendent can see all audit logs
        return AuditLog.objects.all().order_by('-timestamp')
