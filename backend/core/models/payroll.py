from django.db import models
from .employee import Employee
from decimal import Decimal

class Payroll(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('released', 'Released'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    cutoff_period = models.CharField(max_length=50, default="May 1-15, 2026", db_index=True)
    
    # Timekeeping
    days_worked = models.DecimalField(max_digits=4, decimal_places=1, default=Decimal('11.0')) # Standard 11 days per cutoff
    
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2) # This is now the calculated salary based on attendance
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00')) # Total before deductions
    
    # Deductions (Standard DepEd / Civil Service)
    gsis = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="GSIS 9% Life and Retirement")
    sss = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text="Legacy alias for GSIS")
    philhealth = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    pagibig = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('100.00'))
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    loans = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    # Allowances
    pera = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1000.00'), help_text="PERA (₱1,000 semi-monthly cutoff)")

    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft', db_index=True)
    date_generated = models.DateTimeField(auto_now_add=True)
    date_released = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.gsis and self.sss:
            self.gsis = self.sss
        self.sss = self.gsis
        self.total_deductions = self.gsis + self.philhealth + self.pagibig + self.tax + self.loans
        self.gross_salary = self.basic_salary + self.pera
        self.net_salary = self.gross_salary - self.total_deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.cutoff_period}"
