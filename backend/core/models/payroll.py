from django.db import models
from .employee import Employee

# -------------------------
# PAYROLL
# -------------------------
class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payrolls')
    cutoff_period = models.CharField(max_length=50, default="May 1-15, 2026")
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Deductions
    sss = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    philhealth = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pagibig = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    loans = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    date_generated = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.total_deductions = self.sss + self.philhealth + self.pagibig + self.tax + self.loans
        self.net_salary = self.basic_salary - self.total_deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee} - {self.cutoff_period}"
