"""Run the loan to payroll handoff over HTTP against Django's disposable test server."""
import json
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import pytest
from django.contrib.auth import get_user_model

from core.models import LoanPayment, Role


@pytest.mark.django_db(transaction=True)
def test_loan_and_payroll_handoff_over_http(
    live_server, teacher_employee, hr_user, superintendent_user,
):
    accountant = get_user_model().objects.create_user(
        username='http_accountant', password='password123', role=Role.ACCOUNTANT,
    )

    def request(method, path, data=None, token=None, expected=200):
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        message = Request(
            live_server.url + '/api/' + path, method=method, headers=headers,
            data=json.dumps(data).encode() if data is not None else None,
        )
        try:
            response = urlopen(message, timeout=15)
        except HTTPError as error:
            response = error
        with response:
            body = response.read()
            assert response.status == expected, (method, path, response.status, body)
            print(f'{method} /api/{path} -> {response.status}')
            return body if 'application/pdf' in response.headers.get('Content-Type', '') else json.loads(body)

    def login(user):
        return request('POST', 'token/', {'username': user.username, 'password': 'password123'})['access']

    request('GET', 'loans/', expected=401)
    teacher_token = login(teacher_employee.user)
    hr_token = login(hr_user)
    superintendent_token = login(superintendent_user)
    accountant_token = login(accountant)

    loan = request('POST', 'loans/', {
        'loan_amount': '20000.00', 'interest_rate': '6.00', 'term_months': 12,
        'purpose': 'general',
    }, teacher_token, expected=201)
    assert loan['status'] == 'pending'
    loan_path = f"loans/{loan['id']}/"
    assert request('GET', loan_path + 'checklist/', token=teacher_token)['all_required_submitted'] is False
    request('POST', loan_path + 'verify/', {}, teacher_token, expected=403)
    assert request('POST', loan_path + 'verify/', {}, hr_token)['status'] == 'verified'
    assert request('POST', loan_path + 'approve/', {'remarks': 'Checked'}, superintendent_token)['status'] == 'approved'
    assert request('POST', loan_path + 'release-funds/', {}, accountant_token)['status'] == 'released'
    request('POST', loan_path + 'post-payment/', {'amount_paid': '100.00'}, accountant_token, expected=201)
    assert LoanPayment.objects.filter(loan_id=loan['id']).count() == 1

    payroll = request('POST', 'payroll/generate/', {
        'employee_id': teacher_employee.pk, 'cutoff_period': 'HTTP verification cutoff',
    }, accountant_token, expected=201)
    assert payroll['status'] == 'draft'
    payroll_path = f"payroll/{payroll['id']}/"
    request('POST', payroll_path + 'approve/', {}, accountant_token, expected=403)
    assert request('POST', payroll_path + 'approve/', {}, superintendent_token)['status'] == 'approved'
    assert request('POST', payroll_path + 'release/', {}, accountant_token)['status'] == 'released'
    assert LoanPayment.objects.filter(loan_id=loan['id']).count() == 2
    request('POST', payroll_path + 'release/', {}, accountant_token, expected=400)
    assert LoanPayment.objects.filter(loan_id=loan['id']).count() == 2
    assert request('GET', payroll_path + 'export_payslip/', token=teacher_token).startswith(b'%PDF')
    for export in ('export_payroll_sheet', 'export_disbursement_voucher'):
        path = f'payroll/{export}/?cutoff_period=HTTP%20verification%20cutoff'
        assert request('GET', path, token=accountant_token).startswith(b'%PDF')
