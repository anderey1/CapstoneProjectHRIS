import pytest
from decimal import Decimal
from rest_framework.test import APIRequestFactory, force_authenticate
from core.models import ProvidentLoan
from core.views.loan import LoanViewSet

@pytest.mark.django_db
class TestLoanRules:
    def test_cannot_apply_duplicate_loan_when_active_released(self, teacher_employee):
        """Applying for a loan while having a released active loan is rejected."""
        ProvidentLoan.objects.create(
            employee=teacher_employee,
            loan_amount=Decimal("30000.00"),
            interest_rate=Decimal("6.0"),
            term_months=12,
            status='released'
        )

        factory = APIRequestFactory()
        request = factory.post('/api/loans/', {
            'loan_amount': '20000.00',
            'interest_rate': '6.0',
            'term_months': 12,
            'purpose': 'emergency'
        }, format='json')
        force_authenticate(request, user=teacher_employee.user)
        view = LoanViewSet.as_view({'post': 'create'})
        response = view(request)

        assert response.status_code == 400
        assert "already exists" in str(response.data)

    def test_cannot_apply_duplicate_loan_when_verified(self, teacher_employee):
        """Applying for a loan while having a verified loan pending superintendent approval is rejected."""
        ProvidentLoan.objects.create(
            employee=teacher_employee,
            loan_amount=Decimal("30000.00"),
            interest_rate=Decimal("6.0"),
            term_months=12,
            status='verified'
        )

        factory = APIRequestFactory()
        request = factory.post('/api/loans/', {
            'loan_amount': '20000.00',
            'interest_rate': '6.0',
            'term_months': 12,
            'purpose': 'medical'
        }, format='json')
        force_authenticate(request, user=teacher_employee.user)
        view = LoanViewSet.as_view({'post': 'create'})
        response = view(request)

        assert response.status_code == 400
        assert "already exists" in str(response.data)

    def test_can_apply_loan_when_previous_loan_paid(self, teacher_employee):
        """Applying for a loan after fully paying off a previous loan is permitted."""
        ProvidentLoan.objects.create(
            employee=teacher_employee,
            loan_amount=Decimal("30000.00"),
            interest_rate=Decimal("6.0"),
            term_months=12,
            status='paid'
        )

        factory = APIRequestFactory()
        request = factory.post('/api/loans/', {
            'loan_amount': '20000.00',
            'interest_rate': '6.0',
            'term_months': 12,
            'purpose': 'general'
        }, format='json')
        force_authenticate(request, user=teacher_employee.user)
        view = LoanViewSet.as_view({'post': 'create'})
        response = view(request)

        assert response.status_code == 201
        assert response.data['status'] == 'pending'
