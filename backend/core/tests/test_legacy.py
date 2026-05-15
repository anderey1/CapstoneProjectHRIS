from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from core.models import Role, Employee, School, ProvidentLoan, Attendance, LeaveRequest, PerformanceReview, Applicant, Payroll
from django.utils import timezone
from decimal import Decimal
import datetime

User = get_user_model()

class HRISCRUDTests(APITestCase):

    def setUp(self):
        # 1. Create School
        self.school = School.objects.create(
            name="Lucena City Division Office",
            latitude=13.937,
            longitude=121.615,
            radius_meters=100
        )

        # 2. Create Admin User
        self.admin_user = User.objects.create_user(
            username='admin', password='password123', role=Role.ADMIN
        )
        self.admin_employee = Employee.objects.create(
            user=self.admin_user, first_name="Admin", last_name="User",
            position="Admin", department="IT", school=self.school, salary=50000
        )

        # 3. Create HR User
        self.hr_user = User.objects.create_user(
            username='hr_staff', password='password123', role=Role.HR
        )
        self.hr_employee = Employee.objects.create(
            user=self.hr_user, first_name="HR", last_name="Staff",
            position="HR Officer", department="HR", school=self.school, salary=40000
        )

        # 4. Create Regular Employee User
        self.emp_user = User.objects.create_user(
            username='employee1', password='password123', role=Role.EMPLOYEE
        )
        self.employee = Employee.objects.create(
            user=self.emp_user, first_name="Juan", last_name="Dela Cruz",
            position="Teacher I", department="Acad", school=self.school, salary=30000
        )

    def login(self, username, password):
        url = reverse('token_obtain_pair')
        response = self.client.post(url, {'username': username, 'password': password})
        if response.status_code == status.HTTP_200_OK:
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {response.data["access"]}')
        return response

    # --- EMPLOYEE TESTS ---
    def test_employee_list_as_admin(self):
        self.login('admin', 'password123')
        url = reverse('employee-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_employee_list_as_employee(self):
        self.login('employee1', 'password123')
        url = reverse('employee-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see themselves
        self.assertEqual(len(response.data['results']), 1)

    def test_create_employee_as_hr(self):
        self.login('hr_staff', 'password123')
        url = reverse('employee-list')
        data = {
            "username": "new_emp",
            "email": "new@example.com",
            "password": "password123",
            "role": "EMPLOYEE",
            "first_name": "Maria",
            "last_name": "Clara",
            "position": "Teacher II",
            "department": "Acad",
            "salary": 35000,
            "school": self.school.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="new_emp").exists())

    # --- LOAN TESTS ---
    def test_loan_application_and_approval(self):
        # 1. Apply as Employee
        self.login('employee1', 'password123')
        url = reverse('providentloan-list')
        data = {
            "loan_amount": 10000,
            "interest_rate": 5,
            "term_months": 12
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        loan_id = response.data['id']

        # 2. Approve as Admin
        self.login('admin', 'password123')
        approve_url = reverse('providentloan-approve', args=[loan_id])
        response = self.client.post(approve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        loan = ProvidentLoan.objects.get(id=loan_id)
        self.assertEqual(loan.status, 'approved')

    # --- ATTENDANCE TESTS ---
    def test_attendance_scan_success(self):
        # Mocking QR token generation
        from core.utils import generate_daily_qr_token
        token = generate_daily_qr_token()

        self.login('employee1', 'password123')
        url = reverse('attendance-scan')
        # Correct coordinates (same as school)
        data = {
            "qr_token": token,
            "lat": 13.937,
            "lng": 121.615
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Time In recorded successfully", response.data['message'])

    def test_attendance_scan_outside_geo(self):
        from core.utils import generate_daily_qr_token
        token = generate_daily_qr_token()

        self.login('employee1', 'password123')
        url = reverse('attendance-scan')
        # Far away coordinates
        data = {
            "qr_token": token,
            "lat": 14.000,
            "lng": 122.000
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Workstation check-in failed", response.data['detail'])

    # --- LEAVE TESTS ---
    def test_leave_request_overlap(self):
        self.login('employee1', 'password123')
        url = reverse('leaverequest-list')
        
        today = timezone.now().date()
        # 1. First Leave
        data1 = {
            "leave_type": "vacation",
            "start_date": today + datetime.timedelta(days=5),
            "end_date": today + datetime.timedelta(days=7),
            "reason": "Family vacation"
        }
        self.client.post(url, data1)

        # 2. Overlapping Leave
        data2 = {
            "leave_type": "sick",
            "start_date": today + datetime.timedelta(days=6),
            "end_date": today + datetime.timedelta(days=8),
            "reason": "Checkup"
        }
        response = self.client.post(url, data2)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("overlapping", response.data[0].lower())

    # --- PAYROLL TESTS ---
    def test_payroll_generation(self):
        self.login('hr_staff', 'password123')
        # Need an approved loan to test deduction logic
        loan = ProvidentLoan.objects.create(
            employee=self.employee, loan_amount=12000, interest_rate=0, term_months=12, status='approved'
        )
        
        # New endpoint: /api/payroll/generate/
        url = reverse('payroll-generate')
        data = {
            "employee_id": self.employee.id,
            "cutoff": "May 1-15, 2026"
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(str(response.data['loans'])), Decimal('500.00')) # 12000 / 12 / 2 (semi-monthly)

    # --- PERFORMANCE TESTS ---
    def test_performance_review_creation(self):
        self.login('admin', 'password123')
        url = reverse('performancereview-list')
        data = {
            "employee": self.employee.id,
            "period": "2026 Mid-Year",
            "punctuality_score": 5,
            "quality_score": 5,
            "behavior_score": 5
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_promotion_eligible'])

    # --- APPLICANT TESTS ---
    def test_applicant_crud_as_hr(self):
        self.login('hr_staff', 'password123')
        url = reverse('applicant-list')
        data = {
            "first_name": "Jane",
            "last_name": "Doe",
            "position_applied": "Accountant",
            "email": "jane@example.com",
            "phone": "09123456789"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        applicant_id = response.data['id']
        detail_url = reverse('applicant-detail', args=[applicant_id])
        
        # Update
        update_data = {"status": "screened"}
        response = self.client.patch(detail_url, update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'screened')

    # --- DASHBOARD TESTS ---
    def test_dashboard_stats(self):
        self.login('employee1', 'password123')
        url = reverse('dashboard_stats')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_employees', response.data)

    def test_me_endpoint_resilience(self):
        # Create a user without an employee profile
        User.objects.create_user(username='noprofile', password='password123', role=Role.ADMIN)
        self.login('noprofile', 'password123')
        
        url = reverse('employee-me')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data['id'])
        self.assertEqual(response.data['user_details']['username'], 'noprofile')
        self.assertEqual(response.data['position'], 'System User')

    def test_analytics_detail(self):
        self.login('admin', 'password123')
        metrics = ['attendance', 'leave', 'payroll', 'performance', 'loans', 'departments']
        for metric in metrics:
            url = reverse('analytics_detail', args=[metric])
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK, f"Metric {metric} failed")

    # --- SCHOOL & AUDIT LOG TESTS ---
    def test_school_list(self):
        self.login('employee1', 'password123')
        url = reverse('school-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Account for DRF pagination (count, next, previous, results)
        self.assertEqual(len(response.data['results']), 1)

    def test_audit_log_tracking(self):
        # 1. Trigger an action as Admin
        self.login('admin', 'password123')
        emp_url = reverse('employee-list')
        self.client.post(emp_url, {
            "username": "audit_test", "email": "audit@test.com", "password": "password123",
            "role": "EMPLOYEE", "first_name": "Audit", "last_name": "Test",
            "position": "Staff", "department": "IT", "salary": 20000, "school": self.school.id
        })

        # 2. Check Audit Logs
        log_url = reverse('auditlog-list')
        response = self.client.get(log_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should have at least one log (the one we just created)
        self.assertTrue(len(response.data['results']) >= 1)
        self.assertIn("Created employee record", response.data['results'][0]['action'])
