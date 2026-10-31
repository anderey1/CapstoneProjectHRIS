import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Employee, Role, EmployeeDocument, Applicant, ApplicantDocument

User = get_user_model()

@pytest.mark.django_db
def test_employee_document_upload_and_verify():
    user = User.objects.create_user(username="test_emp", password="password123", role=Role.TEACHING)
    employee = Employee.objects.create(
        user=user,
        first_name="Maria",
        last_name="Santos",
        email="maria.santos@deped.gov.ph"
    )
    client = APIClient()
    client.force_authenticate(user=user)

    dummy_pdf = SimpleUploadedFile("tor.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")
    data = {
        'file': dummy_pdf,
        'document_type': 'tor',
        'file_name': 'TOR_2026.pdf',
        'employee': employee.id
    }

    response = client.post('/api/employee-documents/', data, format='multipart')
    assert response.status_code == 201
    assert response.data['document_type'] == 'tor'
    assert response.data['file_name'] == 'tor.pdf'

    doc_id = response.data['id']
    doc = EmployeeDocument.objects.get(id=doc_id)
    assert doc.verified is False

    # HR User verifies document
    hr_user = User.objects.create_user(username="hr_staff", password="password123", role=Role.HR)
    client.force_authenticate(user=hr_user)

    verify_res = client.post(f'/api/employee-documents/{doc_id}/verify/', {'verified': True}, format='json')
    assert verify_res.status_code == 200
    assert verify_res.data['verified'] is True
    assert verify_res.data['verified_by_name'] == "hr_staff"

@pytest.mark.django_db
def test_document_list_is_paginated_envelope_with_every_document_present():
    """
    Regression: the list endpoint is globally paginated, so the frontend must unwrap
    `{count, results}`. Guards against dropping uploads from the checklist.
    """
    user = User.objects.create_user(username="list_owner", password="password123", role=Role.TEACHING)
    employee = Employee.objects.create(
        user=user,
        first_name="Ana",
        last_name="Dela Cruz",
        email="ana.dela.cruz@deped.gov.ph",
    )

    client = APIClient()
    client.force_authenticate(user=user)

    for doc_type, filename in (("tor", "tor.pdf"), ("pds_file", "pds.pdf")):
        response = client.post(
            '/api/employee-documents/',
            {
                'file': SimpleUploadedFile(filename, b"%PDF-1.4 dummy", content_type="application/pdf"),
                'document_type': doc_type,
                'file_name': filename,
                'employee': employee.id,
            },
            format='multipart',
        )
        assert response.status_code == 201

    list_response = client.get(f'/api/employee-documents/?employee={employee.id}')
    assert list_response.status_code == 200
    assert 'results' in list_response.data
    assert list_response.data['count'] == 2
    assert {item['document_type'] for item in list_response.data['results']} == {"tor", "pds_file"}


@pytest.mark.django_db
def test_applicant_hired_transfers_documents_to_employee():
    applicant = Applicant.objects.create(
        first_name="Carlos",
        last_name="Reyes",
        email="carlos.reyes@deped.gov.ph",
        phone="09171112233",
        position_applied="Teacher I",
        status="interviewed"
    )
    ApplicantDocument.objects.create(
        applicant=applicant,
        document_type="letter_of_intent",
        file=SimpleUploadedFile("letter.pdf", b"letter content"),
        filename="letter.pdf"
    )

    hr_user = User.objects.create_user(username="hr_admin", password="password123", role=Role.HR)
    client = APIClient()
    client.force_authenticate(user=hr_user)

    response = client.post(f'/api/applicants/{applicant.id}/change-status/', {'status': 'hired'}, format='json')
    assert response.status_code == 200

    employee = Employee.objects.get(email="carlos.reyes@deped.gov.ph")
    assert employee.documents.filter(document_type="letter_of_intent").exists()
    doc = employee.documents.get(document_type="letter_of_intent")
    assert doc.verified is True
