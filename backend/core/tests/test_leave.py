import pytest
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from rest_framework.exceptions import ValidationError
from core.models import LeaveRequest
from core.views.leave import LeaveViewSet

@pytest.mark.django_db
class TestLeaveRules:
    def test_sick_leave_retrospective_filing_allowed(self, teacher_employee):
        """CSC Form 6 allows sick leave to be filed retrospectively up to 30 days."""
        factory = APIRequestFactory()
        today = timezone.localdate()
        # Ensure dates are past weekdays within 30 days regardless of test execution day
        days_back = today.weekday() + 7  # Monday of the previous week
        start_date = today - timedelta(days=days_back)
        end_date = start_date + timedelta(days=1)  # Tuesday of the previous week
        
        request = factory.post('/api/leaves/', {
            'leave_type': 'sick',
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'reason': 'High fever and medical rest',
        }, format='json')
        
        force_authenticate(request, user=teacher_employee.user)
        view = LeaveViewSet.as_view({'post': 'create'})
        response = view(request)
        
        assert response.status_code == 201
        assert response.data['leave_type'] == 'sick'
        assert response.data['status'] == 'pending_supervisor'

    def test_vacation_leave_in_past_raises_validation_error(self, teacher_employee):
        """Vacation leave cannot be filed for past dates."""
        factory = APIRequestFactory()
        today = timezone.localdate()
        start_date = today - timedelta(days=2)
        end_date = today - timedelta(days=1)

        request = factory.post('/api/leaves/', {
            'leave_type': 'vacation',
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }, format='json')

        force_authenticate(request, user=teacher_employee.user)
        view = LeaveViewSet.as_view({'post': 'create'})
        response = view(request)
        assert response.status_code == 400
        assert "Advance filing required" in str(response.data)

    def test_vacation_leave_under_five_days_advance_rejected(self, teacher_employee):
        """Vacation leave must be filed at least 5 days in advance."""
        factory = APIRequestFactory()
        today = timezone.localdate()
        start_date = today + timedelta(days=2)
        end_date = today + timedelta(days=3)

        request = factory.post('/api/leaves/', {
            'leave_type': 'vacation',
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }, format='json')

        force_authenticate(request, user=teacher_employee.user)
        view = LeaveViewSet.as_view({'post': 'create'})
        response = view(request)
        assert response.status_code == 400
        assert "5 days in advance" in str(response.data)

    def test_sick_leave_exceeding_five_days_requires_med_cert(self, teacher_employee):
        """Sick leave > 5 days without medical certificate raises ValidationError."""
        factory = APIRequestFactory()
        today = timezone.localdate()
        # 8 business days in past
        start_date = today - timedelta(days=12)
        end_date = today - timedelta(days=2)

        request = factory.post('/api/leaves/', {
            'leave_type': 'sick',
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }, format='json')

        force_authenticate(request, user=teacher_employee.user)
        view = LeaveViewSet.as_view({'post': 'create'})
        response = view(request)
        assert response.status_code == 400
        assert "Medical Certificate" in str(response.data)

    def test_leave_approval_workflow_and_deduction(self, teacher_employee, supervisor_user, hr_user, superintendent_user):
        """Approval passes through Supervisor -> HR -> Superintendent and deducts balance."""
        today = timezone.localdate()
        start_date = today - timedelta(days=3)
        end_date = today - timedelta(days=2)

        # Create sick leave
        leave = LeaveRequest.objects.create(
            employee=teacher_employee,
            leave_type='sick',
            start_date=start_date,
            end_date=end_date,
            working_days_applied=2,
            status='pending_supervisor',
            illness_details='Flu symptoms'
        )

        initial_sick = teacher_employee.sick_leave_balance
        factory = APIRequestFactory()

        # Step 1: Supervisor recommends -> pending_hr
        req = factory.post(f'/api/leaves/{leave.id}/approve/')
        force_authenticate(req, user=supervisor_user)
        resp = LeaveViewSet.as_view({'post': 'approve'})(req, pk=leave.id)
        assert resp.status_code == 200
        leave.refresh_from_db()
        assert leave.status == 'pending_hr'

        # Step 2: HR endorses -> pending_superintendent
        req = factory.post(f'/api/leaves/{leave.id}/approve/')
        force_authenticate(req, user=hr_user)
        resp = LeaveViewSet.as_view({'post': 'approve'})(req, pk=leave.id)
        assert resp.status_code == 200
        leave.refresh_from_db()
        assert leave.status == 'pending_superintendent'

        # Step 3: Superintendent final approval -> approved & balance deducted
        req = factory.post(f'/api/leaves/{leave.id}/approve/')
        force_authenticate(req, user=superintendent_user)
        resp = LeaveViewSet.as_view({'post': 'approve'})(req, pk=leave.id)
        assert resp.status_code == 200
        leave.refresh_from_db()
        teacher_employee.refresh_from_db()

        assert leave.status == 'approved'
        assert teacher_employee.sick_leave_balance == initial_sick - 2

    def test_special_leave_does_not_deduct_vacation_balance(self, teacher_employee, superintendent_user):
        """Special statutory leaves (e.g. paternity, solo parent) do not consume vacation credits."""
        initial_vl = teacher_employee.vacation_leave_balance
        today = timezone.localdate()
        leave = LeaveRequest.objects.create(
            employee=teacher_employee,
            leave_type='paternity',
            start_date=today + timedelta(days=7),
            end_date=today + timedelta(days=13),
            working_days_applied=5,
            status='pending_superintendent'
        )
        factory = APIRequestFactory()
        req = factory.post(f'/api/leaves/{leave.id}/approve/')
        force_authenticate(req, user=superintendent_user)
        resp = LeaveViewSet.as_view({'post': 'approve'})(req, pk=leave.id)
        assert resp.status_code == 200
        assert resp.data['days_deducted'] == 0
        teacher_employee.refresh_from_db()
        assert teacher_employee.vacation_leave_balance == initial_vl

@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def pending_superintendent_leave(teacher_employee):
    today = timezone.localdate()
    return LeaveRequest.objects.create(
        employee=teacher_employee,
        leave_type='vacation',
        start_date=today + timedelta(days=7),
        end_date=today + timedelta(days=9),
        working_days_applied=3,
        status='pending_superintendent'
    )


@pytest.mark.django_db
def test_leave_approval_balance_deduction_is_atomic(client, superintendent_user, pending_superintendent_leave, monkeypatch):
    """Ensure balance is NOT deducted if an exception occurs while updating the leave request."""
    employee = pending_superintendent_leave.employee
    initial_vacation = employee.vacation_leave_balance
    
    # Simulate unexpected DB failure on leave.save
    from core.models import LeaveRequest
    original_save = LeaveRequest.save
    def fail_on_save(self, *args, **kwargs):
        if self.id == pending_superintendent_leave.id and self.status == 'approved':
            raise RuntimeError("Simulated mid-transaction failure")
        return original_save(self, *args, **kwargs)
    
    monkeypatch.setattr(LeaveRequest, 'save', fail_on_save)
    
    client.force_authenticate(user=superintendent_user)
    try:
        client.post(f'/api/leaves/{pending_superintendent_leave.id}/approve/')
    except RuntimeError:
        pass
        
    employee.refresh_from_db()
    # In an atomic transaction, the deducted balance must roll back
    assert employee.vacation_leave_balance == initial_vacation

