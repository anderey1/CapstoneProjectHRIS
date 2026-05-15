from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import AuditLog
from ..serializers import AuditLogSerializer
from ..permissions import IsAdminOrHR

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        # Admins and HR can see everything
        return AuditLog.objects.all().order_by('-timestamp')
