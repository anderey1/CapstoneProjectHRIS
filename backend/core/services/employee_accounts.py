"""Account emails and short-lived, single-use password setup links."""
import logging
import uuid
from django.conf import settings
from django.core import signing
from django.core.mail import send_mail

logger = logging.getLogger(__name__)
SETUP_SALT = 'employee-password-setup'

def rotate_setup(employee):
    employee.setup_nonce = uuid.uuid4()
    employee.save(update_fields=['setup_nonce'])
    return signing.dumps({'id': employee.pk, 'nonce': str(employee.setup_nonce)}, salt=SETUP_SALT)

def email_employee(employee, event, token=None):
    user = employee.user
    address = user.email or employee.email
    text = f'Dear {employee.first_name} {employee.last_name},\n\n'
    if event == 'setup':
        text += f'Your HRIS account is ready. Username: {user.username}\nSet your password within 24 hours: {settings.PORTAL_URL}/setup-password?token={token}\nContact HR if the link expires.'
    elif event == 'approved':
        text += f'Your HRIS registration is approved. Username: {user.username}\nLog in: {settings.PORTAL_URL}/login'
    else:
        text += f'Your HRIS registration was rejected.\nReason: {employee.rejection_reason}\nContact HR for assistance.'
    try:
        sent = send_mail('DepEd Lucena HRIS account update', text, settings.DEFAULT_FROM_EMAIL, [address], fail_silently=False)
        if not sent:
            return 'failed'
        return 'console' if settings.EMAIL_BACKEND.endswith('console.EmailBackend') else 'sent'
    except Exception:
        logger.exception('Account email failed for employee %s', employee.pk)
        return 'failed'
