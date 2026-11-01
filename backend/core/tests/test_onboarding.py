from unittest.mock import Mock

import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile

from core.models import Applicant, Employee, EmployeeDocument, Role
from core.services.onboarding import onboard_applicant


pytestmark = pytest.mark.django_db


@pytest.fixture
def applicant(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    return Applicant.objects.create(
        first_name='Ana', last_name='Reyes', email='ana.reyes@example.test',
        phone='09123456789', position_applied='Teacher I',
    )


def test_onboarding_preserves_pds_records_documents_and_login(applicant, hr_user):
    applicant.pds_file = SimpleUploadedFile('pds.pdf', b'%PDF-1.7\nPDS')
    applicant.save()
    extractor = Mock(return_value=({
        'middle_name': 'Cruz',
        'family': [{'relationship': 'CHILD', 'first_name': 'Luis'}],
        'education': [{'level': 'COLLEGE', 'school_name': 'Test College'}],
        'eligibilities': [{'service': 'Professional Teacher'}],
        'work_experience': [{'position_title': 'Teacher', 'date_to': 'present'}],
    }, None))

    created, username, password = onboard_applicant(applicant, hr_user, extractor)

    assert created is True
    employee = Employee.objects.get(email=applicant.email)
    assert employee.user.username == username == 'ana.reyes'
    assert employee.user.check_password(password)
    assert employee.user.role == Role.TEACHING
    assert employee.middle_name == 'Cruz'
    assert employee.family.get().first_name == 'Luis'
    assert employee.education.get().school_name == 'Test College'
    assert employee.eligibilities.get().service == 'Professional Teacher'
    assert employee.work_experience.get().is_present is True
    document = EmployeeDocument.objects.get(employee=employee, document_type='pds_file')
    assert document.file.name == applicant.pds_file.name
    assert document.verified is True
    assert document.verified_by == hr_user
    extractor.assert_called_once()


def test_duplicate_hire_does_not_create_another_account(applicant, teacher_employee, hr_user):
    teacher_employee.email = applicant.email
    teacher_employee.save(update_fields=['email'])
    before = get_user_model().objects.count(), Employee.objects.count()
    extractor = Mock()

    assert onboard_applicant(applicant, hr_user, extractor) == (False, '', '')

    assert (get_user_model().objects.count(), Employee.objects.count()) == before
    extractor.assert_not_called()


def test_failed_document_transfer_rolls_back_account_and_employee(applicant, hr_user, monkeypatch):
    before = get_user_model().objects.count(), Employee.objects.count()

    def fail_transfer(*args):
        raise RuntimeError('Document transfer failed')

    monkeypatch.setattr('core.services.onboarding.transfer_applicant_documents', fail_transfer)
    with pytest.raises(RuntimeError, match='Document transfer failed'):
        onboard_applicant(applicant, hr_user, Mock())

    assert (get_user_model().objects.count(), Employee.objects.count()) == before
    assert not Employee.objects.filter(email=applicant.email).exists()
