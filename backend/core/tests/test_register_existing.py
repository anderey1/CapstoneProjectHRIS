import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from core.models import Employee, AuditLog, Role

User = get_user_model()

@pytest.mark.django_db
def test_register_existing_employee_success_and_approval():
    client = APIClient()

    data = {
        "first_name": "Jane",
        "last_name": "Doe",
        "department": "Instructional",
        "position": "Teacher I",
        "role": "TEACHING",
        "username": "janedoe",
        "email": "jane.doe@deped.gov.ph",
        "password": "SecurePassword123!"
    }

    # Register (Creates User and Employee)
    response = client.post('/api/employees/register-existing/', data, format='json')
    assert response.status_code == 201
    assert "submitted successfully" in response.data["message"]

    # Verify database updates (user created but inactive, employee created)
    user = User.objects.get(username="janedoe")
    assert user.is_active is False
    
    employee = Employee.objects.get(user=user)
    assert employee.first_name == "Jane"
    assert employee.last_name == "Doe"

    # HR User for approval
    hr_user = User.objects.create_user(username="hr_staff", password="password123", role=Role.HR)
    client.force_authenticate(user=hr_user)

    # List pending
    response_pending = client.get('/api/employees/pending-registrations/')
    assert response_pending.status_code == 200
    assert len(response_pending.data) == 1
    assert response_pending.data[0]['id'] == employee.id

    # Approve
    response_approve = client.post(f'/api/employees/{employee.id}/approve-registration/')
    assert response_approve.status_code == 200
    assert "Successfully approved" in response_approve.data["message"]

    # Verify active
    user.refresh_from_db()
    assert user.is_active is True

@pytest.mark.django_db
def test_register_existing_employee_rejection():
    client = APIClient()

    data = {
        "first_name": "Bob",
        "last_name": "Jones",
        "department": "Instructional",
        "position": "Teacher II",
        "role": "TEACHING",
        "username": "bobjones",
        "email": "bob.jones@deped.gov.ph",
        "password": "SecurePassword123!"
    }

    # Register
    response = client.post('/api/employees/register-existing/', data, format='json')
    assert response.status_code == 201

    user = User.objects.get(username="bobjones")
    employee = Employee.objects.get(user=user)

    # HR User for rejection
    hr_user = User.objects.create_user(username="hr_staff_2", password="password123", role=Role.HR)
    client.force_authenticate(user=hr_user)

    # Reject
    response_reject = client.post(f'/api/employees/{employee.id}/reject-registration/')
    assert response_reject.status_code == 200
    assert "Successfully rejected" in response_reject.data["message"]

    # Verify deleted user and employee
    assert not User.objects.filter(username="bobjones").exists()
    assert not Employee.objects.filter(id=employee.id).exists()

@pytest.mark.django_db
def test_register_existing_employee_failures():
    client = APIClient()

    # 1. Test missing fields
    response = client.post('/api/employees/register-existing/', {}, format='json')
    assert response.status_code == 400
    assert "required" in response.data["error"]

    # 2. Test already registered (username/email conflict)
    User.objects.create_user(username="taken_user", email="taken@deped.gov.ph", password="password")

    # Conflict on username
    data_username_conflict = {
        "first_name": "Alice",
        "last_name": "Smith",
        "department": "Instructional",
        "position": "Teacher II",
        "role": "TEACHING",
        "username": "taken_user",
        "email": "alice@deped.gov.ph",
        "password": "SecurePassword123!"
    }
    response = client.post('/api/employees/register-existing/', data_username_conflict, format='json')
    assert response.status_code == 400
    assert "Username is already taken" in response.data["error"]

    # Conflict on email
    data_email_conflict = {
        "first_name": "Alice",
        "last_name": "Smith",
        "department": "Instructional",
        "position": "Teacher II",
        "role": "TEACHING",
        "username": "alice_smith",
        "email": "taken@deped.gov.ph",
        "password": "SecurePassword123!"
    }
    response = client.post('/api/employees/register-existing/', data_email_conflict, format='json')
    assert response.status_code == 400
    assert "Email is already registered" in response.data["error"]
