from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import Notification
from ..services.notification_tasks import task_sources, render_task


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'source_type', 'source_id', 'created_at', 'read_at']
        read_only_fields = fields


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=['read_at'])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        return Response({'unread_updates': self.get_queryset().filter(read_at__isnull=True).count(),
                         'action_required': sum(qs.count() for _, qs, _ in task_sources(request))})

    @action(detail=False, methods=['get'])
    def tasks(self, request):
        try:
            page = int(request.query_params.get('page', 1))
            if page < 1 or page > 1000:
                raise ValueError
        except ValueError:
            return Response({'detail': 'Invalid page.'}, status=400)
        sources = task_sources(request)
        total = sum(qs.count() for _, qs, _ in sources)
        offset, remaining, result = (page - 1) * 10, 10, []
        for module, qs, path in sources:
            count = qs.count()
            if offset >= count:
                offset -= count
                continue
            rows = qs[offset:offset + remaining]
            result.extend(render_task(module, row, path) for row in rows)
            remaining = 10 - len(result)
            offset = 0
            if not remaining:
                break
        return Response({'count': total, 'results': result, 'page': page})
