# pyrefly: ignore [missing-import]
from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from .employee import Employee
from decimal import Decimal
import os


# -------------------------
# PROVIDENT LOAN
# -------------------------
class ProvidentLoan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('released', 'Released'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]

    PURPOSE_CHOICES = [
        ('general', 'General'),
        ('medical', 'Medical / Hospitalization'),
        ('calamity', 'Calamity'),
        ('educational', 'Educational'),
        ('emergency', 'Emergency'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='loans')
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.IntegerField(default=12)

    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    date_applied = models.DateField(auto_now_add=True)

    # --- Loan Application Fields ---
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default='general')
    letter_request = models.TextField(blank=True, help_text="Formal letter stating the purpose of the loan.")

    # Co-maker
    co_maker = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='comaker_loans',
        help_text="Co-maker must have equal or higher salary grade."
    )
    co_maker_name = models.CharField(
        max_length=100, blank=True,
        help_text="Fallback co-maker name if not in the system."
    )

    # Review tracking
    remarks = models.TextField(blank=True, help_text="HR remarks on approval/rejection.")
    reviewed_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_loans'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        """Validate co-maker salary is equal or higher than applicant's."""
        if self.co_maker and self.employee:
            if self.co_maker.salary < self.employee.salary:
                raise ValidationError({
                    'co_maker': "Co-maker's salary must be equal to or higher than the applicant's salary."
                })
            if self.co_maker == self.employee:
                raise ValidationError({
                    'co_maker': "Co-maker cannot be the same as the applicant."
                })

    def save(self, *args, **kwargs):
        if self.term_months <= 0:
            self.term_months = 1

        from decimal import Decimal
        total = Decimal(str(self.loan_amount)) + (Decimal(str(self.loan_amount)) * (Decimal(str(self.interest_rate)) / 100))
        self.total_amount = round(total, 2)
        self.monthly_payment = round(total / self.term_months, 2)

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.loan_amount} ({self.get_purpose_display()})"

    @property
    def current_balance(self):
        """Returns the remaining balance of the loan."""
        from django.db.models import Sum
        payments_sum = self.loanpayment_set.aggregate(Sum('amount_paid'))['amount_paid__sum'] or 0
        return self.total_amount - Decimal(str(payments_sum))


# -------------------------
# LOAN DOCUMENT
# -------------------------
def validate_loan_doc_file(value):
    """Validate file size and extension for loan documents."""
    max_size_mb = getattr(settings, 'LOAN_DOC_MAX_SIZE_MB', 10)
    allowed_ext = getattr(settings, 'LOAN_DOC_ALLOWED_EXTENSIONS', ['.pdf', '.jpg', '.jpeg', '.png'])

    ext = os.path.splitext(value.name)[1].lower()
    if ext not in allowed_ext:
        raise ValidationError(
            f"File type '{ext}' is not allowed. Allowed types: {', '.join(allowed_ext)}"
        )

    max_bytes = max_size_mb * 1024 * 1024
    if value.size > max_bytes:
        raise ValidationError(
            f"File size ({value.size / (1024*1024):.1f} MB) exceeds the {max_size_mb} MB limit."
        )


class LoanDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ('laf', 'Loan Application Form'),
        ('letter_request', 'Letter Request'),
        ('auth_deduct', 'Authorization to Deduct'),
        ('payslip', 'Payslip'),
        ('deped_id', 'DepEd ID'),
        ('appointment', 'Approved Appointment'),
        ('service_record', 'Updated Service Record'),
        ('contract', 'Contract of Service'),
        ('comaker_payslip', 'Co-Maker Payslip'),
        ('medical_abstract', 'Medical Abstract/Certificate'),
        ('calamity_cert', 'Calamity Certificate'),
    ]

    loan = models.ForeignKey(ProvidentLoan, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to='loan_documents/', validators=[validate_loan_doc_file])
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['doc_type', '-uploaded_at']

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.loan}"


# -------------------------
# LOAN PAYMENT
# -------------------------
class LoanPayment(models.Model):
    loan = models.ForeignKey(ProvidentLoan, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.id: # Only for new payments
            # Sum all previous payments for this loan
            previous_payments = LoanPayment.objects.filter(loan=self.loan).aggregate(models.Sum('amount_paid'))['amount_paid__sum'] or 0
            self.remaining_balance = self.loan.total_amount - (previous_payments + self.amount_paid)

            # If fully paid, update loan status
            if self.remaining_balance <= 0.01: # Small epsilon for float precision
                self.loan.status = 'paid'
                self.loan.save()
        super().save(*args, **kwargs)
