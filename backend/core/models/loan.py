from django.db import models
from .employee import Employee

# -------------------------
# PROVIDENT LOAN
# -------------------------
class ProvidentLoan(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.IntegerField(default=12)

    monthly_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    date_applied = models.DateField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.term_months <= 0:
            self.term_months = 1

        total = self.loan_amount + (self.loan_amount * (self.interest_rate / 100))
        self.total_amount = total
        self.monthly_payment = total / self.term_months

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.loan_amount}"


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
