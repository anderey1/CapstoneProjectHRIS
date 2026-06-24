from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Applicant, AuditLog
from ..serializers import ApplicantSerializer
from ..permissions import IsAdminOrHRorSuperintendent
from ..notifications import send_applicant_notification

class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-date_applied')
    serializer_class = ApplicantSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHRorSuperintendent]

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
        
        # Actual Notification logic
        new_status_display = applicant.get_status_display()
        email_sent = send_applicant_notification(applicant, new_status_display, notes)
        applicant.is_notified = email_sent
        applicant.save()

        # Audit Log
        AuditLog.objects.create(
            user=request.user, 
            action=f"Changed status for {applicant.first_name} {applicant.last_name} from '{old_status}' to '{new_status_display}'"
        )

        msg = f"Status updated to {new_status_display}."
        if email_sent:
            msg += " Applicant has been notified via email."
        else:
            msg += " Email notification failed (check SMTP settings)."

        return Response({
            "message": msg,
            "status": applicant.status,
            "email_sent": email_sent
        })
