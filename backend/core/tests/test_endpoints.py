import pytest
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from core.models import Role, Employee, School, Attendance, ProvidentLoan, PerformanceReview, Applicant
from decimal import Decimal

@pytest.fixture(autouse=True)
def mock_gemini():
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
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(username='admin', password='password123', role=Role.ADMIN)
    return user

@pytest.fixture
def admin_client(admin_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=admin_user)
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
def staff_client(staff_user):
    from rest_framework.test import APIClient
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client

@pytest.mark.django_db
class TestHRISAPI:
    """
    Comprehensive Pytest-Django suite for all HRIS endpoints.
    """

    # --- AUTH TESTS ---
    def test_login_success(self, api_client, admin_user):
        url = reverse('token_obtain_pair')
        response = api_client.post(url, {'username': 'admin', 'password': 'password123'})
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

    # --- EMPLOYEE TESTS ---
    def test_get_employee_list(self, admin_client, staff_user):
        url = reverse('employee-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Includes admin (if employee) + staff
        assert len(response.data['results']) >= 1

    def test_get_me_endpoint(self, staff_client, staff_user):
        url = reverse('employee-me')
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user_details']['username'] == 'teacher1'

    # --- ATTENDANCE TESTS ---
    def test_attendance_scan(self, staff_client, school):
        from core.utils import generate_daily_qr_token
        token = generate_daily_qr_token()
        url = reverse('attendance-scan')
        data = {
            "qr_token": token,
            "lat": 13.937,
            "lng": 121.615
        }
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "Time In recorded" in response.data['message']

    # --- LOAN TESTS ---
    def test_loan_workflow(self, staff_client, admin_client, staff_user):
        # 1. Apply
        url = reverse('providentloan-list')
        data = {"loan_amount": 5000, "interest_rate": 5, "term_months": 6}
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        loan_id = response.data['id']

        # 2. Approve (Admin)
        approve_url = reverse('providentloan-approve', args=[loan_id])
        response = admin_client.post(approve_url)
        assert response.status_code == status.HTTP_200_OK
        assert ProvidentLoan.objects.get(id=loan_id).status == 'approved'

    # --- PERFORMANCE TESTS ---
    def test_performance_rating(self, admin_client, staff_user):
        employee = staff_user.employee_profile
        url = reverse('performancereview-list')
        data = {
            "employee": employee.id,
            "period": "2026 Q1",
            "punctuality_score": 5,
            "quality_score": 5,
            "behavior_score": 5
        }
        response = admin_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['is_promotion_eligible'] == True

    # --- ANALYTICS TESTS ---
    def test_dashboard_stats(self, admin_client):
        url = reverse('dashboard_stats')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'total_employees' in response.data

    @pytest.mark.parametrize("metric", ["attendance", "payroll", "loans", "performance", "departments"])
    def test_analytics_metrics(self, admin_client, metric):
        url = reverse('analytics_detail', args=[metric])
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    # --- RECRUITMENT TESTS ---
    def test_applicant_tracking(self, admin_client):
        url = reverse('applicant-list')
        data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "position_applied": "Accountant",
            "email": "jane@example.com",
            "phone": "09123456789"
        }
        response = admin_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        applicant_id = response.data['id']
        detail_url = reverse('applicant-detail', args=[applicant_id])
        response = admin_client.patch(detail_url, {"status": "interviewed"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'interviewed'

    # --- AUDIT LOGS ---
    def test_audit_logs(self, admin_client):
        url = reverse('auditlog-list')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        # Should have results if previous tests ran or if we just triggered one
        assert 'results' in response.data

