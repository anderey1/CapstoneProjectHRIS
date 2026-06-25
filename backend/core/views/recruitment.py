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

    def get_permissions(self):
        if self.action == 'create':
            from rest_framework.permissions import AllowAny
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminOrHRorSuperintendent()]

    def perform_create(self, serializer):
        applicant = serializer.save()
        from ..models import ApplicantDocument
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
        from ..models import Employee, Role
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
        if new_status == 'hired':
            if not Employee.objects.filter(email=applicant.email).exists():
                from django.contrib.auth import get_user_model
                from django.utils import timezone
                from ..models.recruitment import TEACHING_POSITIONS
                from ..utils import extract_pds_data
                import logging
                logger = logging.getLogger(__name__)
                
                # Check and parse PDS file if present
                pds_data = None
                if applicant.pds_file:
                    try:
                        applicant.pds_file.seek(0)
                        file_bytes = applicant.pds_file.read()
                        extracted, err = extract_pds_data(file_bytes)
                        if not err and extracted:
                            pds_data = extracted
                            logger.info(f"Successfully auto-extracted PDS data for hired applicant {applicant.id}")
                        else:
                            logger.warning(f"PDS file present but extraction failed: {err}")
                    except Exception as e:
                        logger.error(f"Error auto-extracting hired applicant's PDS: {e}")
                
                User_model = get_user_model()
                base_username = applicant.email.split('@')[0].lower()
                base_username = "".join(c for c in base_username if c.isalnum() or c in ['.', '_'])
                username = base_username
                counter = 1
                while User_model.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                    
                is_teaching = any(applicant.position_applied == item[0] for item in TEACHING_POSITIONS)
                role = Role.TEACHING if is_teaching else Role.NON_TEACHING
                
                emp_data = {
                    'first_name': applicant.first_name,
                    'last_name': applicant.last_name,
                    'middle_name': pds_data.get('middle_name') if pds_data else '',
                    'name_extension': pds_data.get('name_extension') if pds_data else '',
                    'date_of_birth': pds_data.get('date_of_birth') if (pds_data and pds_data.get('date_of_birth')) else None,
                    'place_of_birth': pds_data.get('place_of_birth') if pds_data else '',
                    'sex': pds_data.get('sex') if pds_data else '',
                    'civil_status': pds_data.get('civil_status') if pds_data else '',
                    'umid_id': pds_data.get('umid_id') if pds_data else '',
                    'pagibig_id': pds_data.get('pagibig_id') if pds_data else '',
                    'philhealth_no': pds_data.get('philhealth_no') if pds_data else '',
                    'philsys_id': pds_data.get('philsys_id') if pds_data else '',
                    'tin_no': pds_data.get('tin_no') if pds_data else '',
                    'agency_employee_no': pds_data.get('agency_employee_no') if pds_data else '',
                    'mobile_no': (pds_data.get('mobile_no') or applicant.phone or '') if pds_data else applicant.phone,
                    'email': applicant.email,
                    'residential_address': pds_data.get('residential_address') if pds_data else '',
                    'permanent_address': pds_data.get('permanent_address') if pds_data else '',
                    'position': applicant.position_applied,
                    'department': 'Operations',
                    'date_hired': timezone.now().date(),
                }
                
                employee = Employee.objects.create_with_user(
                    user_data={
                        'username': username,
                        'email': applicant.email,
                        'password': 'WelcomeDepEd2026!',
                        'role': role
                    },
                    employee_data=emp_data
                )
                
                # Create related PDS records if pds_data is available
                if pds_data:
                    from ..models.pds_details import FamilyMember, Education, Eligibility, WorkExperience
                    
                    family_list = pds_data.get('family', [])
                    if isinstance(family_list, list):
                        for item in family_list:
                            FamilyMember.objects.create(
                                employee=employee,
                                relationship=item.get('relationship', ''),
                                surname=item.get('surname', ''),
                                first_name=item.get('first_name', ''),
                                middle_name=item.get('middle_name', ''),
                                full_name=item.get('full_name', ''),
                                extension=item.get('extension', ''),
                                occupation=item.get('occupation', ''),
                                employer=item.get('employer', ''),
                                date_of_birth=item.get('date_of_birth') if item.get('date_of_birth') else None
                            )
                    
                    education_list = pds_data.get('education', [])
                    if isinstance(education_list, list):
                        for item in education_list:
                            Education.objects.create(
                                employee=employee,
                                level=item.get('level', ''),
                                school_name=item.get('school_name', ''),
                                degree_course=item.get('degree_course', ''),
                                period_from=item.get('period_from', ''),
                                period_to=item.get('period_to', ''),
                                highest_level=item.get('highest_level', ''),
                                year_graduated=item.get('year_graduated', ''),
                                honors_received=item.get('honors_received', '')
                            )
                            
                    eligibility_list = pds_data.get('eligibilities', [])
                    if isinstance(eligibility_list, list):
                        for item in eligibility_list:
                            Eligibility.objects.create(
                                employee=employee,
                                service=item.get('service', ''),
                                rating=item.get('rating', ''),
                                date_of_exam=item.get('date_of_exam') if item.get('date_of_exam') else None,
                                place_of_exam=item.get('place_of_exam', ''),
                                license_number=item.get('license_number', ''),
                                validity_date=item.get('validity_date') if item.get('validity_date') else None
                            )
                            
                    work_list = pds_data.get('work_experience', [])
                    if isinstance(work_list, list):
                        for item in work_list:
                            date_to_val = item.get('date_to')
                            is_present = False
                            if date_to_val == 'present' or not date_to_val:
                                date_to_val = None
                                is_present = True
                            
                            WorkExperience.objects.create(
                                employee=employee,
                                date_from=item.get('date_from') if item.get('date_from') else None,
                                date_to=date_to_val if date_to_val else None,
                                is_present=is_present,
                                position_title=item.get('position_title', ''),
                                agency=item.get('agency', ''),
                                monthly_salary=item.get('monthly_salary') if item.get('monthly_salary') else None,
                                salary_grade=item.get('salary_grade', ''),
                                status_of_appointment=item.get('status_of_appointment', ''),
                                is_gov_service=item.get('is_gov_service', True)
                            )
                
                employee_created = True
                username_created = username

        # Actual Notification logic
        new_status_display = applicant.get_status_display()
        if new_status == 'hired' and employee_created:
            email_sent = send_applicant_notification(
                applicant, 
                new_status_display, 
                notes, 
                username=username_created, 
                temp_password='WelcomeDepEd2026!'
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
            msg += f" An Employee profile has been automatically created (Username: {username_created}, Password: WelcomeDepEd2026!)."
        if email_sent:
            msg += " Applicant has been notified via email."
        else:
            msg += " Email notification failed (check SMTP settings)."

        return Response({
            "message": msg,
            "status": applicant.status,
            "email_sent": email_sent
        })
