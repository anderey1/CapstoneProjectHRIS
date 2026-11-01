"""Convert a hired applicant into personnel records, without changing status or notification behavior."""
import logging
import secrets
import string

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from ..models import Employee, Role
from ..models.recruitment import TEACHING_POSITIONS
from .applicant_records import create_pds_records, transfer_applicant_documents

logger = logging.getLogger(__name__)


def onboard_applicant(applicant, actor, extractor):
    employee_created = False
    username_created = ""
    temp_password = ""
    with transaction.atomic():
        if Employee.objects.filter(email=applicant.email).exists():
            logger.warning(
                "Hire skipped for applicant %s: an employee already uses email %s.",
                applicant.pk,
                applicant.email,
            )
        else:
            # Check and parse PDS file if present
            pds_data = None
            if applicant.pds_file:
                try:
                    applicant.pds_file.seek(0)
                    file_bytes = applicant.pds_file.read()
                    extracted, err = extractor(file_bytes)
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
                'date_hired': timezone.localdate(),
            }

            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            temp_password = ''.join(secrets.choice(alphabet) for _ in range(14))

            employee = Employee.objects.create_with_user(
                user_data={
                    'username': username,
                    'email': applicant.email,
                    'password': temp_password,
                    'role': role
                },
                employee_data=emp_data
            )

            create_pds_records(employee, pds_data)
            transfer_applicant_documents(applicant, employee, actor)

            employee_created = True
            username_created = username


    return employee_created, username_created, temp_password
