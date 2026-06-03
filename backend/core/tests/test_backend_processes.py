import pytest
from django.urls import reverse
from rest_framework import status
from core.models import Role, Attendance, LeaveRequest, ProvidentLoan, Payroll, PerformanceReview, Applicant, AuditLog, LoanPayment
from django.utils import timezone
import datetime
from decimal import Decimal
from rest_framework.test import APIClient

@pytest.mark.django_db
class TestHRISBackendSuite:
    """
    Comprehensive test suite for all backend processes.
    """

    # --- ATTENDANCE PROCESSES ---
    def test_attendance_full_flow(self, staff_client, school):
        from core.utils import generate_daily_qr_token
        token = generate_daily_qr_token()
        
        # 1. Time In (Valid Geo)
        url = reverse('attendance-scan')
        data = {"qr_token": token, "lat": 13.937, "lng": 121.615}
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert "Time In recorded" in response.data['message']
        
        # 2. Time Out (Fail due to cooldown)
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "Cooldown active" in response.data['detail']

    def test_attendance_geo_fail(self, staff_client, school):
        from core.utils import generate_daily_qr_token
        token = generate_daily_qr_token()
        url = reverse('attendance-scan')
        # Coordinates far from school
        data = {"qr_token": token, "lat": 14.599, "lng": 120.984}
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['is_geo_flagged'] == True

    # --- LEAVE PROCESSES ---
    def test_leave_logic(self, staff_client, hr_client, staff_user):
        url = reverse('leaverequest-list')
        today = timezone.now().date()
        
        # 1. Apply for Sick Leave
        data = {
            "leave_type": "sick",
            "start_date": today + datetime.timedelta(days=1),
            "end_date": today + datetime.timedelta(days=2),
            "reason": "Flu"
        }
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        leave_id = response.data['id']

        # 2. Try to apply for overlapping leave
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "overlapping" in response.data[0].lower()

        # 3. Approve and check balance deduction
        approve_url = reverse('leaverequest-approve', args=[leave_id])
        old_balance = staff_user.employee_profile.leave_balance
        response = hr_client.post(approve_url)
        assert response.status_code == status.HTTP_200_OK
        
        staff_user.employee_profile.refresh_from_db()
        assert staff_user.employee_profile.leave_balance == old_balance - 2

    # --- LOAN PROCESSES ---
    def test_loan_workflow_with_comaker(self, staff_client, hr_client, staff_user, another_staff_user):
        url = reverse('providentloan-list')
        
        # 1. Apply with co-maker (Valid: another_staff_user has 35k salary vs staff_user 30k)
        data = {
            "loan_amount": 20000,
            "interest_rate": 5,
            "term_months": 12,
            "purpose": "medical",
            "co_maker": another_staff_user.employee_profile.id
        }
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        loan_id = response.data['id']

        # 2. Document Checklist and Upload
        checklist_url = reverse('providentloan-checklist', args=[loan_id])
        response = staff_client.get(checklist_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['all_required_submitted'] == False

        # Mock a file upload
        from django.core.files.uploadedfile import SimpleUploadedFile
        upload_url = reverse('providentloan-upload-document', args=[loan_id])
        file_data = SimpleUploadedFile("test_laf.pdf", b"file_content", content_type="application/pdf")
        
        response = staff_client.post(upload_url, {"doc_type": "laf", "file": file_data}, format='multipart')
        assert response.status_code == status.HTTP_201_CREATED

        # Check checklist again
        response = staff_client.get(checklist_url)
        # 'laf' should now be submitted
        laf_item = next(item for item in response.data['checklist'] if item['doc_type'] == 'laf')
        assert laf_item['submitted'] == True

        # 3. Validation: Co-maker cannot be self
        data["co_maker"] = staff_user.employee_profile.id
        response = staff_client.post(url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        # 4. Approve
        approve_url = reverse('providentloan-approve', args=[loan_id])
        response = hr_client.post(approve_url, {"remarks": "Approved after verification"})
        assert response.status_code == status.HTTP_200_OK
        assert ProvidentLoan.objects.get(id=loan_id).status == 'approved'

    # --- PAYROLL PROCESSES ---
    def test_payroll_generation_and_deductions(self, hr_client, staff_user):
        employee = staff_user.employee_profile
        # Create a released loan for the employee to test auto-deduction
        loan = ProvidentLoan.objects.create(
            employee=employee, loan_amount=12000, interest_rate=0, term_months=12, status='released'
        )
        
        url = reverse('payroll-generate')
        data = {
            "employee_id": employee.id,
            "cutoff": "June 1-15, 2026"
        }
        response = hr_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check loan deduction: 12000 / 12 = 1000 monthly, 500 semi-monthly
        assert Decimal(str(response.data['loans'])) == Decimal('500.00')
        
        # Check SSS (4.5% of 30,000 / 2 = 675.00)
        assert Decimal(str(response.data['sss'])) == Decimal('675.00')
        
        # Check Pag-IBIG (Flat 100)
        assert Decimal(str(response.data['pagibig'])) == Decimal('100.00')

    def test_payroll_final_loan_deduction(self, hr_client, staff_user):
        """Verify that payroll only deducts the remaining balance if it's less than the installment."""
        employee = staff_user.employee_profile
        # Loan: 1000 total. Semi-monthly installment: 250.
        # NOTE: Status must be 'released' for payroll deduction to work per requirements.
        loan = ProvidentLoan.objects.create(
            employee=employee, loan_amount=1000, interest_rate=0, term_months=2, status='released'
        )
        
        # Manually add payments totaling 900. Remaining balance: 100.
        LoanPayment.objects.create(loan=loan, amount_paid=Decimal('900.00'))
        
        url = reverse('payroll-generate')
        data = {"employee_id": employee.id, "cutoff": "Final Loan Cutoff"}
        response = hr_client.post(url, data)
        
        assert response.status_code == status.HTTP_201_CREATED
        # Should only deduct the remaining 100, not the 250 installment.
        assert Decimal(str(response.data['loans'])) == Decimal('100.00')
        # Status should remain 'released' until payroll is officially RELEASED
        assert ProvidentLoan.objects.get(id=loan.id).status == 'released'

    # --- LOAN WORKFLOW TESTS ---
    def test_loan_approve_workflow(self, staff_user, supervisor_client):
        # Create pending loan
        loan = ProvidentLoan.objects.create(
            employee=staff_user.employee_profile,
            loan_amount=10000, interest_rate=5, term_months=12, status='pending'
        )
        approve_url = reverse('providentloan-approve', args=[loan.id])

        # 1. Staff cannot approve
        staff_client = APIClient()
        staff_client.force_authenticate(user=staff_user)

        assert staff_client.post(approve_url).status_code == status.HTTP_403_FORBIDDEN

        # 2. Supervisor can approve
        assert supervisor_client.post(approve_url).status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.status == 'approved'

        # 3. Cannot approve already approved
        assert supervisor_client.post(approve_url).status_code == status.HTTP_400_BAD_REQUEST

    def test_loan_release_funds_workflow(self, hr_client, accountant_client, staff_user):
        # Create approved loan
        loan = ProvidentLoan.objects.create(
            employee=staff_user.employee_profile,
            loan_amount=10000, interest_rate=5, term_months=12, status='approved'
        )
        release_url = reverse('providentloan-release-funds', args=[loan.id])

        # 1. HR cannot release funds (only Accountant/Admin)
        assert hr_client.post(release_url).status_code == status.HTTP_403_FORBIDDEN

        # 2. Accountant can release funds
        assert accountant_client.post(release_url).status_code == status.HTTP_200_OK
        loan.refresh_from_db()
        assert loan.status == 'released'

    def test_loan_deduction_only_on_payroll_release(self, accountant_client, hr_client, staff_user):
        # Setup released loan
        loan = ProvidentLoan.objects.create(
            employee=staff_user.employee_profile,
            loan_amount=12000, interest_rate=0, term_months=12, status='released'
        )
        
        # Setup draft payroll
        payroll = Payroll.objects.create(
            employee=staff_user.employee_profile,
            basic_salary=15000,
            loans=500,
            net_salary=14500
        )
        
        # Approve payroll - should not create payment
        hr_client.post(reverse('payroll-approve', args=[payroll.id]))
        assert LoanPayment.objects.filter(loan=loan).count() == 0
        
        # Release payroll - should create payment
        accountant_client.post(reverse('payroll-release', args=[payroll.id]))
        assert LoanPayment.objects.filter(loan=loan).count() == 1

    # --- PAYROLL WORKFLOW TESTS ---
    def test_payroll_approve_workflow(self, staff_user, hr_client):
        payroll = Payroll.objects.create(
            employee=staff_user.employee_profile,
            basic_salary=15000,
            net_salary=15000,
            status='draft'
        )
        approve_url = reverse('payroll-approve', args=[payroll.id])

        # 1. Staff cannot approve
        staff_client = APIClient()
        staff_client.force_authenticate(user=staff_user)

        assert staff_client.post(approve_url).status_code == status.HTTP_403_FORBIDDEN

        # 2. HR can approve
        assert hr_client.post(approve_url).status_code == status.HTTP_200_OK
        payroll.refresh_from_db()
        assert payroll.status == 'approved'

    def test_payroll_release_workflow(self, hr_client, accountant_client, staff_user):
        payroll = Payroll.objects.create(
            employee=staff_user.employee_profile,
            basic_salary=15000,
            net_salary=15000,
            status='approved'
        )
        release_url = reverse('payroll-release', args=[payroll.id])

        # 1. HR cannot release (only Admin/Accountant)
        assert hr_client.post(release_url).status_code == status.HTTP_403_FORBIDDEN

        # 2. Accountant can release
        assert accountant_client.post(release_url).status_code == status.HTTP_200_OK
        payroll.refresh_from_db()
        assert payroll.status == 'released'

    # --- PERFORMANCE PROCESSES ---
    def test_performance_rating_with_ai(self, admin_client, staff_user):
        employee = staff_user.employee_profile
        url = reverse('performancereview-list')
        data = {
            "employee": employee.id,
            "period": "2026 Q2",
            "punctuality_score": 5,
            "quality_score": 4,
            "behavior_score": 5
        }
        response = admin_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert "AI summary content" in response.data['ai_summary']
        assert response.data['is_promotion_eligible'] == True

    # --- RECRUITMENT PROCESSES ---
    def test_recruitment_workflow(self, hr_client):
        url = reverse('applicant-list')
        data = {
            "first_name": "Test",
            "last_name": "Applicant",
            "position_applied": "Teacher I",
            "email": "test@applicant.com",
            "phone": "09123456789"
        }
        response = hr_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        applicant_id = response.data['id']

        # Update status
        detail_url = reverse('applicant-detail', args=[applicant_id])
        response = hr_client.patch(detail_url, {"status": "hired"})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'hired'

    # --- PERMISSIONS & AUDIT ---
    def test_role_based_access(self, staff_client, admin_client):
        # Staff cannot see all audit logs
        url = reverse('auditlog-list')
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

        # Admin can see all audit logs
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_audit_log_creation(self, admin_client, school):
        # Trigger an action that should be logged
        url = reverse('school-list')
        admin_client.post(url, {"name": "New School", "latitude": 0, "longitude": 0, "radius_meters": 100})
        
        # Check if log exists
        logs = AuditLog.objects.filter(action__icontains="Created School: New School")
        assert logs.exists()
        assert logs.first().user.username == 'admin'

    def test_employee_me_fallback(self, admin_client, admin_user):
        # Admin doesn't have an employee profile in some setups, check fallback
        url = reverse('employee-me')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['position'] == "System User"

    # --- ANALYTICS PROCESSES ---
    def test_analytics_endpoints(self, staff_client, admin_client):
        # Dashboard stats accessible by all authenticated users
        url = reverse('dashboard_stats')
        response = staff_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        
        # AI summary accessible
        url = reverse('dashboard_ai_summary')
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert "AI summary content" in response.data['ai_summary']
