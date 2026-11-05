from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Applicant, ApplicantDocument, AuditLog
from ..serializers import ApplicantSerializer
from .listing import PaginatedListMixin
from ..permissions import IsAdminOrHRorSuperintendent
from ..notifications import send_applicant_notification
from ..utils import extract_pds_data
from ..services import onboard_applicant

class ApplicantViewSet(PaginatedListMixin, viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-date_applied', '-pk')
    serializer_class = ApplicantSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrHRorSuperintendent()]

    def perform_create(self, serializer):
        applicant = serializer.save()
        for file_key in self.request.FILES:
            clean_type = file_key
            if '[' in clean_type:
                clean_type = clean_type.split('[')[0]
            
            files = self.request.FILES.getlist(file_key)
            for f in files:
                ApplicantDocument.objects.create(
                    applicant=applicant,
                    document_type=clean_type,
                    file=f,
                    filename=f.name
                )


    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        applicant = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')

        if not new_status:
            return Response({"error": "Status is required"}, status=400)

        old_status = applicant.get_status_display()
        applicant.status = new_status
        if notes:
            applicant.notes = f"{applicant.notes}\n[{new_status.upper()}]: {notes}" if applicant.notes else f"[{new_status.upper()}]: {notes}"
        
        employee_created = False
        username_created = ""
        temp_password = ""
        if new_status == 'hired':
            employee_created, username_created, temp_password = onboard_applicant(
                applicant, request.user, extract_pds_data,
            )

        # Actual Notification logic
        new_status_display = applicant.get_status_display()
        if new_status == 'hired' and employee_created:
            email_sent = send_applicant_notification(
                applicant, 
                new_status_display, 
                notes, 
                username=username_created, 
                temp_password=temp_password
            )
        else:
            email_sent = send_applicant_notification(applicant, new_status_display, notes)
        applicant.is_notified = email_sent
        applicant.save()

        # Audit Log
        AuditLog.objects.create(
            user=request.user, 
            action=f"Changed status for {applicant.first_name} {applicant.last_name} from '{old_status}' to '{new_status_display}'"
        )

        msg = f"Status updated to {new_status_display}."
        if employee_created:
            msg += f" An Employee profile has been automatically created (Username: {username_created}, Password: {temp_password})."
        elif new_status == 'hired':
            msg += (
                f" No Employee profile was created: an existing employee already uses"
                f" {applicant.email}. Resolve the duplicate before re-hiring."
            )
        if email_sent:
            msg += " Applicant has been notified via email."
        else:
            msg += " Email notification failed (check SMTP settings)."

        return Response({
            "message": msg,
            "status": applicant.status,
            "email_sent": email_sent
        })
