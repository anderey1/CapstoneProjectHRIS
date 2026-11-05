from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django.shortcuts import get_object_or_404
from datetime import time
from ..permissions import IsAdminOrHR, IsAdminOrHRorSuperintendent
from ..models import Attendance, Employee, AuditLog
from ..serializers import AttendanceSerializer
from .listing import PaginatedListMixin
from ..utils.pdf_generator import generate_form_48
from django.http import HttpResponse

class AttendanceViewSet(PaginatedListMixin, viewsets.ModelViewSet):
    lookup_value_regex = r'\d+'
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('import_preview', 'import_commit', 'import_template', 'biometric_mappings'):
            return [IsAdminOrHR()]
        if self.action == 'approve_dtr':
            return [IsAdminOrHRorSuperintendent()]
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminOrHR()]

    def get_queryset(self):
        user = self.request.user
        if user.is_management and self.request.query_params.get('scope') != 'mine':
            return Attendance.objects.select_related('employee', 'employee__user').order_by('-date', '-pk')
        return Attendance.objects.select_related('employee', 'employee__user').filter(employee__user=user).order_by('-date', '-pk')

    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
    def approve_dtr(self, request):
        """Approves all attendance records for an employee within a specific month."""
        employee_id = request.data.get('employee_id')
        month = request.data.get('month') # Expected format: YYYY-MM
        
        if not employee_id or not month:
            return Response({"detail": "employee_id and month (YYYY-MM) are required."}, status=400)
            
        try:
            year, month_num = map(int, month.split('-'))
        except ValueError:
            return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=400)
            
        records = Attendance.objects.filter(
            employee_id=employee_id,
            date__year=year,
            date__month=month_num
        )
        
        if not records.exists():
            return Response({"detail": "No attendance records found for this month."}, status=404)
            
        count = records.update(
            is_dtr_approved=True,
            dtr_approved_by=request.user,
            dtr_approved_at=timezone.now()
        )

        AuditLog.objects.create(
            user=request.user,
            action=f"Approved DTR for employee #{employee_id} for period {month} ({count} records)"
        )
        
        return Response({
            "message": f"Successfully approved {count} DTR records.",
            "employee_id": employee_id,
            "month": month
        })

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def dtr_pdf(self, request):
        """Generates a Form 48 compliant DTR PDF for a specific month."""
        user = request.user
        employee_id = request.query_params.get('employee_id')
        month = request.query_params.get('month') # YYYY-MM
        
        if not month:
            return Response({"detail": "month (YYYY-MM) is required."}, status=400)
            
        # Allow HR/admin to export for a selected employee when provided;
        # otherwise fall back to the logged-in user's own profile.
        if employee_id:
            is_privileged = user.is_management
            target_employee = get_object_or_404(Employee, id=employee_id)
            is_own_profile = hasattr(user, 'employee_profile') and target_employee.id == user.employee_profile.id
            is_supervisor = hasattr(user, 'employee_profile') and target_employee.supervisor_id == user.employee_profile.id

            if not (is_privileged or is_own_profile or is_supervisor):
                return Response({"detail": "You do not have permission to view this employee's DTR."}, status=403)
            employee = target_employee
        else:
            employee = getattr(user, 'employee_profile', None)
            if not employee:
                return Response(
                    {"detail": "No employee profile is linked to this account."},
                    status=400
                )
            
        try:
            year, month_num = map(int, month.split('-'))
        except ValueError:
            return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=400)
            
        records = Attendance.objects.filter(
            employee=employee,
            date__year=year,
            date__month=month_num
        ).order_by('date')
        
        cutoff = request.query_params.get('cutoff') # '1', '2', or 'split'
        
        pdf_content = generate_form_48(employee, month, records, cutoff=cutoff)
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"DTR_{employee.last_name}_{month}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


    @action(detail=False, methods=['get'])
    def import_template(self, request):
        from io import BytesIO
        from openpyxl import Workbook
        from ..services.attendance_import import HEADERS
        file_type = request.query_params.get('file_type', 'xlsx')
        if file_type == 'csv':
            import csv
            from io import StringIO
            output = StringIO(newline='')
            csv.writer(output).writerow(HEADERS)
            response = HttpResponse(output.getvalue().encode('utf-8-sig'), content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="attendance-template.csv"'
            return response
        if file_type != 'xlsx':
            return Response({'detail': 'Template type must be xlsx or csv.'}, status=400)
        book = Workbook()
        sheet = book.active
        sheet.title = 'Attendance'
        sheet.append(HEADERS)
        sheet.freeze_panes = 'A2'
        for column in sheet.columns:
            sheet.column_dimensions[column[0].column_letter].width = 25
        output = BytesIO()
        book.save(output)
        response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="attendance-template.xlsx"'
        return response

    @action(detail=False, methods=['get', 'post'])
    def biometric_mappings(self, request):
        from ..models import BiometricEmployeeMapping
        from rest_framework.exceptions import ValidationError
        if request.method == 'GET':
            return Response(list(BiometricEmployeeMapping.objects.select_related('employee').order_by('source_id', 'biometric_id').values('id', 'source_id', 'biometric_id', 'employee_id', 'employee__first_name', 'employee__last_name')))
        source = str(request.data.get('source_id', '')).strip()
        external = str(request.data.get('biometric_id', '')).strip()
        if not source or not external or len(source) > 100 or len(external) > 100:
            raise ValidationError({'detail': 'Source and biometric ID are required (maximum 100 characters). All IDs are text.'})
        from rest_framework import serializers
        employee_id = serializers.IntegerField(min_value=1).run_validation(request.data.get('employee_id'))
        employee = get_object_or_404(Employee, pk=employee_id)
        from django.db import IntegrityError
        try:
            with transaction.atomic():
                mapping, created = BiometricEmployeeMapping.objects.get_or_create(source_id=source, biometric_id=external, defaults={'employee': employee})
                if mapping.employee_id != employee.pk:
                    raise ValidationError({'detail': 'This source/biometric ID already belongs to another employee.'})
                if created:
                    AuditLog.objects.create(user=request.user, action=f'Attendance biometric mapping {mapping.pk} linked to employee #{employee.pk}')
        except IntegrityError:
            raise ValidationError({'detail': 'Mapping changed concurrently. Refresh and retry.'})
        return Response({'id': mapping.pk, 'created': created})

    @action(detail=False, methods=['post'])
    def import_preview(self, request):
        from django.core import signing
        from ..services.attendance_import import read_upload, preview_rows
        checksum, rows = read_upload(request.FILES.get('file'))
        result, _ = preview_rows(rows)
        result['checksum'] = checksum
        result['preview_token'] = signing.dumps({'checksum': checksum, 'user': request.user.pk}, salt='attendance-import')
        return Response(result)

    @action(detail=False, methods=['post'])
    def import_commit(self, request):
        from django.core import signing
        from django.db import IntegrityError
        from rest_framework.exceptions import ValidationError
        from ..services.attendance_import import read_upload, preview_rows
        from ..models import AttendanceImportBatch
        checksum, rows = read_upload(request.FILES.get('file'))
        try:
            preview = signing.loads(request.data.get('preview_token', ''), salt='attendance-import', max_age=1800)
        except signing.BadSignature:
            raise ValidationError({'detail': 'Preview expired or invalid. Preview the file again.'})
        if preview != {'checksum': checksum, 'user': request.user.pk}:
            raise ValidationError({'detail': 'The file changed. Preview it again.'})
        try:
            with transaction.atomic():
                if AttendanceImportBatch.objects.filter(checksum=checksum).exists():
                    return Response({'imported': 0, 'already_imported': True})
                result, groups = preview_rows(rows, lock=True)
                if not result['can_import']:
                    return Response(result, status=400)
                for group in groups.values():
                    if not group['changes']:
                        continue
                    record = group['current'] or Attendance(employee=group['employee'], date=group['date'])
                    for slot, stamp in group['changes'].items():
                        setattr(record, slot, stamp)
                    record.status = ('present' if record.am_in <= time(8) else 'late') if record.am_in else ('late' if record.pm_in else 'incomplete')
                    record.is_dtr_approved = False
                    record.dtr_approved_by = None
                    record.dtr_approved_at = None
                    record.save()
                dates = [group['date'] for group in groups.values()]
                batch = AttendanceImportBatch.objects.create(checksum=checksum, uploaded_by=request.user, imported_rows=result['new_punches'], duplicate_rows=result['duplicates'], start_date=min(dates), end_date=max(dates))
                AuditLog.objects.create(user=request.user, action=f'Attendance import #{batch.pk}: {batch.imported_rows} new punches, {batch.duplicate_rows} duplicates, rejected=0, period={batch.start_date}..{batch.end_date}, sha256={checksum}')
        except IntegrityError:
            raise ValidationError({'detail': 'Attendance changed concurrently. Preview again.'})
        return Response({'imported': batch.imported_rows, 'duplicates': batch.duplicate_rows, 'warnings': result['warnings']})
