import pytest
from unittest.mock import patch, MagicMock
from core.models import Role, Employee, School
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "dummy_key")

@pytest.fixture(autouse=True)
def mock_gemini(mock_env):
    """Mocks Gemini API to avoid real network calls during tests."""
    with patch('core.utils.genai.Client') as mock_client:
        mock_instance = MagicMock()
        mock_instance.models.generate_content.return_value = MagicMock(text="AI summary content.")
        mock_client.return_value = mock_instance
        yield mock_client

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()

@pytest.fixture
def school(db):
    return School.objects.create(
        name="Lucena City Division Office",
        latitude=13.937,
        longitude=121.615,
        radius_meters=100
    )

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(username='admin', password='password123', role=Role.ADMIN)
    return user

@pytest.fixture
def admin_client(admin_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client

@pytest.fixture
def hr_user(db, school):
    user_data = {
        "username": "hr_staff",
        "password": "password123",
        "role": Role.HR
    }
    employee_data = {
        "first_name": "HR",
        "last_name": "Manager",
        "position": "HR Officer",
        "department": "HR",
        "school": school,
        "salary": 45000
    }
    employee = Employee.objects.create_with_user(user_data, employee_data)
    return employee.user

@pytest.fixture
def hr_client(hr_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=hr_user)
    return client

@pytest.fixture
def staff_user(db, school):
    user_data = {
        "username": "teacher1",
        "password": "password123",
        "role": Role.EMPLOYEE
    }
    employee_data = {
        "first_name": "Juan",
        "last_name": "Dela Cruz",
        "position": "Teacher I",
        "department": "Instructional",
        "school": school,
        "salary": 30000
    }
    employee = Employee.objects.create_with_user(user_data, employee_data)
    return employee.user

@pytest.fixture
def supervisor_user(db, school):
    user_data = {
        "username": "supervisor",
        "password": "password123",
        "role": Role.SUPERVISOR
    }
    employee_data = {
        "first_name": "Supervisor",
        "last_name": "User",
        "position": "Supervisor",
        "department": "Instructional",
        "school": school,
        "salary": 50000
    }
    employee = Employee.objects.create_with_user(user_data, employee_data)
    return employee.user

@pytest.fixture
def supervisor_client(supervisor_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=supervisor_user)
    return client

@pytest.fixture
def accountant_user(db, school):
    user_data = {
        "username": "accountant",
        "password": "password123",
        "role": Role.ACCOUNTANT
    }
    employee_data = {
        "first_name": "Accountant",
        "last_name": "User",
        "position": "Accountant",
        "department": "Finance",
        "school": school,
        "salary": 40000
    }
    employee = Employee.objects.create_with_user(user_data, employee_data)
    return employee.user

@pytest.fixture
def accountant_client(accountant_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=accountant_user)
    return client

@pytest.fixture
def staff_client(staff_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client

@pytest.fixture
def another_staff_user(db, school):
    user_data = {
        "username": "teacher2",
        "password": "password123",
        "role": Role.EMPLOYEE
    }
    employee_data = {
        "first_name": "Maria",
        "last_name": "Clara",
        "position": "Teacher II",
        "department": "Instructional",
        "school": school,
        "salary": 35000
    }
    employee = Employee.objects.create_with_user(user_data, employee_data)
    return employee.user
