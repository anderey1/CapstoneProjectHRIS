from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ...models import School, AuditLog, SalaryGrade
from ...serializers import SchoolSerializer, SalaryGradeSerializer
from ...permissions import IsAdminOrHRorSuperintendent


class SalaryGradeViewSet(viewsets.ModelViewSet):
    queryset = SalaryGrade.objects.all()
    serializer_class = SalaryGradeSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]


class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrHRorSuperintendent()]

    def perform_create(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Created School: {instance.name}")

    def perform_update(self, serializer):
        instance = serializer.save()
        AuditLog.objects.create(user=self.request.user, action=f"Updated School: {instance.name}")

    def perform_destroy(self, instance):
        AuditLog.objects.create(user=self.request.user, action=f"Deleted School: {instance.name}")
        instance.delete()
