from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from ..models import AuditLog, Notification, NotificationTaskDismissal
from ..services.notification_tasks import task_sources, render_task


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'source_type', 'source_id', 'created_at', 'read_at']
        read_only_fields = fields


class NotificationDismissalSerializer(serializers.Serializer):
    notification_id = serializers.IntegerField(min_value=1, required=False)
    task_key = serializers.CharField(max_length=255, required=False)

    def validate(self, attrs):
        if ('notification_id' in attrs) == ('task_key' in attrs):
            raise serializers.ValidationError('Provide either notification_id or task_key.')
        return attrs


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(recipient=self.request.user)
        if self.action == 'list':
            queryset = queryset.filter(dismissed_at__isnull=True)
        return queryset

    @action(detail=False, methods=['post'])
    def dismiss(self, request):
        serializer = NotificationDismissalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            if 'notification_id' in data:
                notification = get_object_or_404(self.get_queryset().select_for_update(), pk=data['notification_id'])
                if notification.dismissed_at is None:
                    notification.dismissed_at = timezone.now()
                    notification.read_at = notification.read_at or notification.dismissed_at
                    notification.save(update_fields=['dismissed_at', 'read_at'])
                    AuditLog.objects.create(user=request.user, action=f'Dismissed notification {notification.pk}')
            else:
                task_key = data['task_key']
                dismissals = NotificationTaskDismissal.objects.filter(recipient=request.user, task_key=task_key)
                if not dismissals.exists():
                    if not any(qs.filter(notification_key=task_key).exists()
                               for _, qs, _ in task_sources(request, include_dismissed=True)):
                        return Response({'detail': 'Task not found.'}, status=404)
                    _, created = NotificationTaskDismissal.objects.get_or_create(recipient=request.user, task_key=task_key)
                    if created:
                        AuditLog.objects.create(user=request.user, action=f'Dismissed notification task {task_key}')
        return Response(status=204)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=['read_at'])
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        return Response({'unread_updates': self.get_queryset().filter(read_at__isnull=True, dismissed_at__isnull=True).count(),
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
