from datetime import timedelta
from io import BytesIO

import pytest
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Employee, LeaveAction, LeaveRequest, Role


pytestmark = pytest.mark.django_db


@pytest.fixture
def client(settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    return APIClient()


@pytest.fixture
def checker(non_teaching_employee, teacher_employee):
    non_teaching_employee.leave_duty = 'checker'
    non_teaching_employee.save(update_fields=['leave_duty'])
    teacher_employee.leave_checker = non_teaching_employee
    teacher_employee.save(update_fields=['leave_checker'])
    return non_teaching_employee


@pytest.fixture
def records(mock_school):
    return Employee.objects.create_with_user(
        {'username': 'records_staff', 'password': 'password123', 'role': Role.NON_TEACHING},
        {'first_name': 'Records', 'last_name': 'Staff', 'school': mock_school, 'leave_duty': 'records'},
    )


def image_upload(image_format='PNG', extra_bytes=0):
    stream = BytesIO()
    Image.new('RGB', (120, 40), color='white').save(stream, format=image_format)
    extension = 'jpg' if image_format == 'JPEG' else image_format.lower()
    return SimpleUploadedFile(f'signature.{extension}', stream.getvalue() + b'x' * extra_bytes, content_type=f'image/{extension}')


def application_data():
    today = timezone.localdate()
    monday = today - timedelta(days=today.weekday() + 7)
    return {'leave_type': 'sick', 'start_date': str(monday), 'end_date': str(monday + timedelta(days=1)), 'illness_details': 'Flu'}


def file_leave(client, employee):
    client.force_authenticate(employee.user)
    response = client.post('/api/leaves/', application_data(), format='json')
    assert response.status_code == 201, response.data
    return LeaveRequest.objects.get(pk=response.data['id'])


def process(client, user, leave, **data):
    client.force_authenticate(user)
    return client.post(f'/api/leaves/{leave.pk}/approve/', data, format='multipart')


def test_complete_teaching_route_and_signature(client, teacher_employee, checker, supervisor_user, records, hr_user):
    balance = teacher_employee.sick_leave_balance
    leave = file_leave(client, teacher_employee)
    assert leave.workflow == 'teaching'
    assert leave.status == 'pending_supervisor'
    assert leave.assigned_checker is None
    assert leave.assigned_principal == supervisor_user.employee_profile

    assert process(client, hr_user, leave).status_code == 403
    assert process(client, checker.user, leave).status_code == 404
    response = process(client, supervisor_user, leave, signature=image_upload(), signature_confirmed='true')
    assert response.status_code == 200, response.data
    assert response.data['status'] == 'pending_hr'
    leave.refresh_from_db()
    assert leave.principal_signature
    assert leave.principal_signed_by == supervisor_user
    assert leave.principal_signed_at
    teacher_employee.refresh_from_db()
    assert teacher_employee.sick_leave_balance == balance

    assert process(client, records.user, leave).status_code == 404
    assert process(client, hr_user, leave).data['status'] == 'approved'
    assert process(client, hr_user, leave).status_code == 400
    teacher_employee.refresh_from_db()
    leave.refresh_from_db()
    assert teacher_employee.sick_leave_balance == balance - 2
    assert leave.records_reference == ''
    assert list(leave.actions.values_list('to_status', flat=True)) == [
        'pending_supervisor', 'pending_hr', 'approved',
    ]
    client.force_authenticate(teacher_employee.user)
    result = client.get(f'/api/leaves/{leave.pk}/').data
    assert result['principal_signer_name'] == 'Juan Principal'
    assert result['principal_signature']
    assert len(result['actions']) == 3


@pytest.mark.parametrize('upload,consent', [
    ('missing', True), ('png', False), ('text', True), ('gif', True), ('oversize', True),
])
def test_principal_must_supply_valid_signature_and_consent(client, teacher_employee, checker, supervisor_user, upload, consent):
    leave = file_leave(client, teacher_employee)
    data = {'signature_confirmed': str(consent).lower()}
    if upload == 'png':
        data['signature'] = image_upload()
    elif upload == 'text':
        data['signature'] = SimpleUploadedFile('signature.png', b'not an image', content_type='image/png')
    elif upload == 'gif':
        data['signature'] = image_upload('GIF')
    elif upload == 'oversize':
        data['signature'] = image_upload(extra_bytes=2 * 1024 * 1024)
    response = process(client, supervisor_user, leave, **data)
    assert response.status_code == 400, response.data
    leave.refresh_from_db()
    assert leave.status == 'pending_supervisor'
    assert not leave.principal_signature
    assert leave.actions.count() == 1


def test_jpeg_signature_is_accepted(client, teacher_employee, checker, supervisor_user):
    leave = file_leave(client, teacher_employee)
    assert process(client, supervisor_user, leave, signature=image_upload('JPEG'), signature_confirmed='true').status_code == 200


def test_return_for_correction_and_resubmit(client, teacher_employee, supervisor_user, hr_user):
    leave = file_leave(client, teacher_employee)
    process(client, supervisor_user, leave, signature=image_upload(), signature_confirmed='true')
    client.force_authenticate(hr_user)
    response = client.post(f'/api/leaves/{leave.pk}/return-for-correction/', {'reason': 'Correct the illness details.'}, format='json')
    assert response.status_code == 200
    leave.refresh_from_db()
    assert leave.status == 'returned'
    assert not leave.principal_signature
    assert leave.principal_signed_by is None
    assert leave.principal_signed_at is None
    client.force_authenticate(teacher_employee.user)
    response = client.patch(f'/api/leaves/{leave.pk}/', {'illness_details': 'Corrected details'}, format='json')
    assert response.status_code == 200, response.data
    leave.refresh_from_db()
    assert leave.status == 'pending_supervisor'
    assert leave.illness_details == 'Corrected details'
    assert leave.correction_reason == ''
    assert leave.actions.count() == 4


def test_filed_application_cannot_be_changed_or_deleted(client, teacher_employee, checker):
    leave = file_leave(client, teacher_employee)
    assert client.patch(f'/api/leaves/{leave.pk}/', {'illness_details': 'Changed'}, format='json').status_code == 403
    assert client.delete(f'/api/leaves/{leave.pk}/').status_code == 403
    leave.refresh_from_db()
    assert leave.illness_details == 'Flu'


def test_removed_processing_duties_cannot_access_application(client, teacher_employee, checker, records):
    leave = file_leave(client, teacher_employee)
    for user in (checker.user, records.user):
        client.force_authenticate(user)
        assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
        assert client.post(f'/api/leaves/{leave.pk}/reject/', {'disapproval_reason': 'No'}, format='json').status_code == 404
        assert client.post(f'/api/leaves/{leave.pk}/return-for-correction/', {'reason': 'Correct details'}, format='json').status_code == 404


def test_principal_can_disapprove_with_reason(client, teacher_employee, checker, supervisor_user):
    leave = file_leave(client, teacher_employee)
    client.force_authenticate(supervisor_user)
    assert client.post(f'/api/leaves/{leave.pk}/reject/', {}, format='json').status_code == 400
    assert client.post(f'/api/leaves/{leave.pk}/reject/', {'disapproval_reason': 'Staffing conflict'}, format='json').status_code == 200
    leave.refresh_from_db()
    teacher_employee.refresh_from_db()
    assert leave.rejection_stage == 'pending_supervisor'
    assert leave.disapproval_reason == 'Staffing conflict'
    assert teacher_employee.sick_leave_balance == 15


def test_teacher_files_without_checker_and_school_staff_cannot_process(client, teacher_employee, non_teaching_employee):
    leave = file_leave(client, teacher_employee)
    assert leave.status == 'pending_supervisor'
    assert leave.assigned_checker is None
    non_teaching_employee.leave_duty = 'checker'
    non_teaching_employee.save(update_fields=['leave_duty'])
    client.force_authenticate(non_teaching_employee.user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
    response = process(client, non_teaching_employee.user, leave)
    assert response.status_code == 404
    leave.refresh_from_db()
    assert leave.assigned_checker is None
    assert leave.status == 'pending_supervisor'


def test_school_queue_does_not_expose_other_schools(client, teacher_employee, non_teaching_employee):
    leave = file_leave(client, teacher_employee)
    non_teaching_employee.leave_duty = 'checker'
    non_teaching_employee.school = None
    non_teaching_employee.save(update_fields=['leave_duty', 'school'])
    client.force_authenticate(non_teaching_employee.user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
    assert process(client, non_teaching_employee.user, leave).status_code == 404


def test_request_scope_and_assignment_snapshot(client, teacher_employee, checker, records, supervisor_user):
    leave = file_leave(client, teacher_employee)
    client.force_authenticate(records.user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
    assert client.get('/api/employees/leave-staff/').status_code == 403
    # Reassigning a teacher does not move an already filed application to another principal.
    teacher_employee.supervisor = records
    teacher_employee.save(update_fields=['supervisor'])
    client.force_authenticate(records.user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404
    assert process(client, supervisor_user, leave, signature=image_upload(), signature_confirmed='true').status_code == 200
    client.force_authenticate(records.user)
    assert client.get(f'/api/leaves/{leave.pk}/').status_code == 404


def test_staff_cannot_assign_themselves_processing_duties(client, teacher_employee):
    client.force_authenticate(teacher_employee.user)
    response = client.patch('/api/employees/me/', {'leave_duty': 'records'}, format='json')
    assert response.status_code == 400
    teacher_employee.refresh_from_db()
    assert teacher_employee.leave_duty == ''


def test_non_teaching_keeps_existing_route(client, non_teaching_employee, hr_user, superintendent_user):
    leave = file_leave(client, non_teaching_employee)
    assert leave.workflow == 'standard'
    assert leave.status == 'pending_hr'
    assert process(client, hr_user, leave).data['status'] == 'pending_superintendent'
    assert process(client, superintendent_user, leave).data['status'] == 'approved'


def test_hr_completion_rolls_back_balance_on_failure(client, teacher_employee, checker, supervisor_user, records, hr_user, monkeypatch):
    leave = file_leave(client, teacher_employee)
    process(client, supervisor_user, leave, signature=image_upload(), signature_confirmed='true')
    original_save = LeaveRequest.save

    def fail_save(instance, *args, **kwargs):
        if instance.pk == leave.pk and instance.status == 'approved':
            raise RuntimeError('Simulated save failure')
        return original_save(instance, *args, **kwargs)

    monkeypatch.setattr(LeaveRequest, 'save', fail_save)
    with pytest.raises(RuntimeError):
        process(client, hr_user, leave)
    teacher_employee.refresh_from_db()
    leave.refresh_from_db()
    assert teacher_employee.sick_leave_balance == 15
    assert leave.status == 'pending_hr'
    assert not LeaveAction.objects.filter(leave=leave, to_status='approved').exists()


def test_dashboard_counts_principal_and_hr_queues(client, teacher_employee, supervisor_user, hr_user):
    leave = file_leave(client, teacher_employee)
    client.force_authenticate(hr_user)
    response = client.get('/api/dashboard/')
    assert response.status_code == 200
    assert response.data['pending_leaves'] == 1
    assert response.data['pending_leaves_supervisor'] == 1
    assert response.data['pending_leaves_checking'] == 0
    process(client, supervisor_user, leave, signature=image_upload(), signature_confirmed='true')
    client.force_authenticate(hr_user)
    response = client.get('/api/dashboard/')
    assert response.data['pending_leaves'] == 1
    assert response.data['pending_leaves_hr'] == 1
    assert response.data['pending_leaves_records'] == 0


def test_hr_configures_processing_duties_without_changing_account_role(client, hr_user, non_teaching_employee):
    client.force_authenticate(hr_user)
    response = client.patch(f'/api/employees/{non_teaching_employee.pk}/', {'leave_duty': 'checker'}, format='json')
    assert response.status_code == 200, response.data
    response = client.get('/api/employees/leave-staff/')
    assert any(person['id'] == non_teaching_employee.pk and person['leave_duty'] == 'checker' for person in response.data)
    non_teaching_employee.refresh_from_db()
    assert non_teaching_employee.user.role == Role.NON_TEACHING
