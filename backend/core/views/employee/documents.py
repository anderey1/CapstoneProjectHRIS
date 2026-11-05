from rest_framework import viewsets, parsers
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.shortcuts import get_object_or_404
from ...models import Employee, Role, AuditLog, EmployeeDocument
from ...serializers import EmployeeDocumentSerializer
from ...permissions import IsAdminOrHRorSuperintendent
from rest_framework.pagination import PageNumberPagination


class EmployeeDocumentPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100


class EmployeeDocumentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeDocument.objects.all()
    serializer_class = EmployeeDocumentSerializer
    pagination_class = EmployeeDocumentPagination
    permission_classes = [IsAuthenticated]
    parser_classes = (parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser)

    def get_queryset(self):
        user = self.request.user
        qs = EmployeeDocument.objects.all().select_related('employee', 'verified_by').order_by('-uploaded_at', '-pk')

        emp_id = self.request.query_params.get('employee')
        is_management = user.is_superuser or user.role in [Role.HR, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]
        if is_management:
            if emp_id:
                return qs.filter(employee_id=emp_id)
            if self.detail or self.action in ['verify', 'retrieve', 'destroy', 'update', 'partial_update']:
                return qs
            if hasattr(user, 'employee_profile'):
                return qs.filter(employee=user.employee_profile)
            return qs
        if hasattr(user, 'employee_profile'):
            return qs.filter(employee=user.employee_profile)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        file_obj = self.request.FILES.get('file')
        file_name = file_obj.name if file_obj else self.request.data.get('file_name', '')

        emp_id = self.request.data.get('employee')
        if emp_id and (user.is_superuser or user.role in [Role.HR, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]):
            employee = get_object_or_404(Employee, id=emp_id)
        elif hasattr(user, 'employee_profile'):
            employee = user.employee_profile
        else:
            raise ValidationError({"error": "No employee profile found for user."})

        doc_type = self.request.data.get('document_type')
        existing = EmployeeDocument.objects.filter(employee=employee, document_type=doc_type).first()
        if existing:
            existing.file = file_obj
            existing.file_name = file_name
            existing.verified = False
            existing.verified_by = None
            existing.verified_at = None
            existing.save()
            serializer.instance = existing
            return

        serializer.save(employee=employee, file_name=file_name)
        AuditLog.objects.create(user=user, action=f"Uploaded document '{doc_type}' for {employee.first_name} {employee.last_name}")

    @action(detail=True, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
    def verify(self, request, pk=None):
        doc = self.get_object()
        verified = request.data.get('verified', True)
        doc.verified = verified
        doc.verified_by = request.user if verified else None
        doc.verified_at = timezone.now() if verified else None
        doc.save()
        AuditLog.objects.create(
            user=request.user,
            action=f"{'Verified' if verified else 'Revoked verification of'} document '{doc.document_type}' for {doc.employee}"
        )
        return Response(self.get_serializer(doc).data)
