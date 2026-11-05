from django.db import transaction
from django.db.models.deletion import ProtectedError
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ...models import School, AuditLog, SalaryGrade
from ...serializers import SchoolSerializer, SalaryGradeSerializer
from ...permissions import IsAdminOrHRorSuperintendent, IsSuperuser


class SalaryGradeViewSet(viewsets.ModelViewSet):
    queryset = SalaryGrade.objects.all()
    serializer_class = SalaryGradeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all().order_by('name', 'pk')
    serializer_class = SchoolSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsSuperuser()]

    @transaction.atomic
    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Created School: {instance.name}")

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Updated School: {instance.name}")

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({'detail': 'Reassign all personnel before deleting this school.'}, status=409)

    @transaction.atomic
    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted School: {instance.name}")
        instance.delete()
