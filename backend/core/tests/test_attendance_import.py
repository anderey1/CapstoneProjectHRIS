from datetime import date, time
from io import BytesIO
from unittest.mock import patch

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from openpyxl import Workbook
from rest_framework.test import APIClient

from core.models import Attendance, AttendanceImportBatch, AuditLog, BiometricEmployeeMapping
from core.services.attendance_import import HEADERS
from core.services.payroll import PayrollCalculator

pytestmark = pytest.mark.django_db
MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'


def workbook(rows, headers=HEADERS):
    book = Workbook()
    book.active.append(headers)
    for row in rows:
        book.active.append(row)
    output = BytesIO()
    book.save(output)
    return output.getvalue()


@pytest.fixture
def setup_import(hr_user, teacher_employee):
    teacher_employee.agency_employee_no = '000123'
    teacher_employee.save()
    client = APIClient()
    client.force_authenticate(hr_user)
    return client, teacher_employee


def punch(slot='AM_IN', stamp='07:45:00', employee='000123', kind='AGENCY_EMPLOYEE_NO', source=''):
    return [employee, kind, source, '2026-05-04', stamp, slot, 'Display only']


def send(client, endpoint, data, filename='logs.xlsx', content_type=MIME, **kwargs):
    return client.post(f'/api/attendance/{endpoint}/', {'file': SimpleUploadedFile(filename, data, content_type), **kwargs}, format='multipart')


def commit(client, data, **file_options):
    response = send(client, 'import_preview', data, **file_options)
    assert response.status_code == 200, response.data
    return send(client, 'import_commit', data, preview_token=response.data['preview_token'], **file_options)


def test_import_dtr_approval_pdf_and_payroll(setup_import):
    from core.models import User
    accountant_user = User.objects.create_user(username="import_accountant", role="ACCOUNTANT")
    client, employee = setup_import
    data = workbook([punch(), punch('AM_OUT', '12:00:00'), punch('PM_IN', '13:00:00'), punch('PM_OUT', '17:00:00')])
    response = commit(client, data)
    assert response.status_code == 200, response.data
    assert response.data['imported'] == 4
    record = Attendance.objects.get(employee=employee)
    assert record.am_in == time(7, 45) and record.pm_out == time(17)
    assert record.status == 'present' and not record.is_dtr_approved
    client.force_authenticate(accountant_user)
    payload = {'employee_id': employee.pk, 'cutoff_period': 'May 1-15, 2026'}
    assert client.post('/api/payroll/generate/', payload).status_code == 400
    from core.models import User
    client.force_authenticate(User.objects.get(role='HR'))
    assert client.post('/api/attendance/approve_dtr/', {'employee_id': employee.pk, 'month': '2026-05'}).status_code == 200
    assert client.get(f'/api/attendance/dtr_pdf/?employee_id={employee.pk}&month=2026-05').status_code == 200
    client.force_authenticate(accountant_user)
    assert client.post('/api/payroll/generate/', payload).status_code == 201
    assert PayrollCalculator.compute(employee, 'May 1-15, 2026', date(2026, 5, 1), date(2026, 5, 15))['days_worked'] == 1


def test_repeat_and_conflicting_punches(setup_import):
    client, employee = setup_import
    data = workbook([punch()])
    assert commit(client, data).data['imported'] == 1
    assert commit(client, data).data['already_imported']
    assert AttendanceImportBatch.objects.count() == 1
    assert commit(client, workbook([punch(), punch()])).data['imported'] == 0
    response = commit(client, workbook([punch(stamp='08:30:00')]))
    assert response.status_code == 400
    assert Attendance.objects.get(employee=employee).am_in == time(7, 45)


@pytest.mark.parametrize('row', [punch(employee='unknown'), punch(kind='OTHER'), punch(slot='WRONG'), punch(stamp='bad'), punch(employee='=123')])
def test_invalid_row_blocks_whole_import(setup_import, row):
    client, _ = setup_import
    response = commit(client, workbook([punch(), row]))
    assert response.status_code == 400
    assert response.data['errors']
    assert not Attendance.objects.exists()
    assert not AttendanceImportBatch.objects.exists()


def test_preview_checksum_authorization_and_missing_logs(setup_import):
    client, employee = setup_import
    data = workbook([punch()])
    preview = send(client, 'import_preview', data)
    assert preview.data['warnings'][0]['missing'] == ['AM_OUT', 'PM_IN', 'PM_OUT']
    assert not Attendance.objects.exists()
    assert send(client, 'import_commit', workbook([punch(stamp='08:10:00')]), preview_token=preview.data['preview_token']).status_code == 400
    client.force_authenticate(employee.user)
    for endpoint in ['import_preview', 'import_commit', 'biometric_mappings']:
        assert send(client, endpoint, data).status_code == 403
    assert client.get('/api/attendance/import_template/').status_code == 403
    assert client.post('/api/attendance/scan/', {}).status_code == 404


def test_device_mapping_and_approved_lock(setup_import):
    client, employee = setup_import
    assert client.post('/api/attendance/biometric_mappings/', {'employee_id': employee.pk, 'source_id': 'school-1', 'biometric_id': '007'}).status_code == 200
    data = workbook([punch(employee='007', kind='BIOMETRIC_ID', source='school-1', stamp='08:30:00')])
    assert commit(client, data).status_code == 200
    record = Attendance.objects.get(employee=employee)
    assert record.status == 'late'
    record.is_dtr_approved = True
    record.save()
    assert commit(client, workbook([punch('PM_OUT', '17:00:00')])).status_code == 400
    assert BiometricEmployeeMapping.objects.count() == 1


def test_audit_failure_rolls_back(setup_import):
    client, _ = setup_import
    data = workbook([punch()])
    with patch.object(AuditLog.objects, 'create', side_effect=RuntimeError('audit unavailable')):
        with pytest.raises(RuntimeError):
            commit(client, data)
    assert not Attendance.objects.exists()
    assert not AttendanceImportBatch.objects.exists()


def test_bad_workbook_and_chronology(setup_import):
    client, _ = setup_import
    assert send(client, 'import_preview', b'invalid').status_code == 400
    assert send(client, 'import_preview', workbook([], headers=['wrong'])).status_code == 400
    assert commit(client, workbook([punch(), punch('AM_OUT', '07:00:00')])).status_code == 400


def test_exit_only_is_incomplete_and_excluded_from_payroll(setup_import):
    client, employee = setup_import
    assert commit(client, workbook([punch('PM_OUT', '17:00:00')])).status_code == 200
    assert Attendance.objects.get(employee=employee).status == 'incomplete'
    assert PayrollCalculator.compute(employee, 'May 1-15, 2026', date(2026, 5, 1), date(2026, 5, 15))['days_worked'] == 0
    assert client.get('/api/attendance/?scope=mine').data['count'] == 0
    assert client.get('/api/attendance/import_template/').status_code == 200


@pytest.mark.parametrize('delimiter,encoding', [(',', 'utf-8-sig'), (';', 'cp1252'), ('\t', 'utf-16')])
def test_csv_preview_and_commit_preserve_ids(setup_import, delimiter, encoding):
    import csv
    from io import StringIO
    client, employee = setup_import
    output = StringIO(newline='')
    writer = csv.writer(output, delimiter=delimiter)
    writer.writerow(HEADERS)
    row = punch()
    row[-1] = 'Pe\u00f1a, Maria'
    writer.writerow(row)
    writer.writerow([])
    writer.writerow(punch('PM_OUT', '17:00:00'))
    data = output.getvalue().encode(encoding)
    response = commit(client, data, filename='logs.CSV', content_type='text/csv')
    assert response.status_code == 200, response.data
    record = Attendance.objects.get(employee=employee)
    assert record.am_in == time(7, 45) and record.pm_out == time(17)
    assert response.data['imported'] == 2
    assert commit(client, data, filename='logs.csv', content_type='text/csv').data['already_imported']


def test_legacy_excel_native_dates_and_times(setup_import):
    from pathlib import Path
    client, employee = setup_import
    data = (Path(__file__).parent / 'fixtures' / 'attendance-legacy.xls').read_bytes()
    response = commit(client, data, filename='logs.xls', content_type='application/vnd.ms-excel')
    assert response.status_code == 200, response.data
    record = Attendance.objects.get(employee=employee, date=date(2026, 5, 4))
    assert record.am_in == time(7, 45) and record.pm_out == time(17)
    assert response.data['imported'] == 4


@pytest.mark.parametrize('filename,content_type,data', [
    ('logs.xls', 'application/vnd.ms-excel', b'not excel'),
    ('logs.csv', 'text/csv', b'\x00binary'),
    ('logs.csv', 'text/csv', b'wrong,headers\n1,2'),
    ('logs.csv', 'text/html', b'<html></html>'),
    ('logs.exe', 'application/octet-stream', b'not allowed'),
])
def test_invalid_file_formats_rejected(filename, content_type, data):
    from core.services.attendance_files import read_upload
    from rest_framework.exceptions import ValidationError
    with pytest.raises(ValidationError):
        read_upload(SimpleUploadedFile(filename, data, content_type))


def test_csv_template_download_and_file_limits(setup_import, monkeypatch):
    import csv
    from core.services import attendance_files
    from rest_framework.exceptions import ValidationError
    client, _ = setup_import
    response = client.get('/api/attendance/import_template/?file_type=csv')
    assert response.status_code == 200
    assert next(csv.reader(response.content.decode('utf-8-sig').splitlines())) == HEADERS
    assert client.get('/api/attendance/import_template/?file_type=other').status_code == 400
    monkeypatch.setattr(attendance_files, 'MAX_ROWS', 1)
    data = response.content + b'000123,AGENCY_EMPLOYEE_NO,,2026-05-04,07:45,AM_IN,\n' * 2
    with pytest.raises(ValidationError):
        attendance_files.read_upload(SimpleUploadedFile('logs.csv', data, 'text/csv'))
