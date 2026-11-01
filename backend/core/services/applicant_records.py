from ..models import EmployeeDocument, FamilyMember, Education, Eligibility, WorkExperience


def create_pds_records(employee, pds_data):
    # Create related PDS records if pds_data is available
    if pds_data:
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


def transfer_applicant_documents(applicant, employee, actor):
    # Copy applicant documents to persistent EmployeeDocument table
    if applicant.pds_file:
        EmployeeDocument.objects.get_or_create(
            employee=employee,
            document_type='pds_file',
            defaults={
                'file': applicant.pds_file,
                'file_name': 'Accomplished_PDS.pdf',
                'verified': True,
                'verified_by': actor
            }
        )
    if applicant.resume:
        EmployeeDocument.objects.get_or_create(
            employee=employee,
            document_type='employment_documents',
            defaults={
                'file': applicant.resume,
                'file_name': 'Resume_CV.pdf',
                'verified': True,
                'verified_by': actor
            }
        )
    for app_doc in applicant.documents.all():
        EmployeeDocument.objects.get_or_create(
            employee=employee,
            document_type=app_doc.document_type,
            defaults={
                'file': app_doc.file,
                'file_name': app_doc.filename or app_doc.document_type,
                'verified': True,
                'verified_by': actor
            }
        )
