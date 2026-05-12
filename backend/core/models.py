from django.db import models
from django.contrib.auth.models import AbstractUser

# -------------------------
# ROLES
# -------------------------
class Role(models.TextChoices):
    ADMIN = 'ADMIN', 'Admin'
    HR = 'HR', 'HR Staff'
    SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    EMPLOYEE = 'EMPLOYEE', 'Employee'


# -------------------------
# USER MODEL
# -------------------------
class User(AbstractUser):
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.EMPLOYEE
    )

    def __str__(self):
        return f"{self.username} ({self.role})"


# -------------------------
# SCHOOL / OFFICE LOCATION
# -------------------------
class School(models.Model):
    name = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    radius_meters = models.IntegerField(default=100) # Geofencing radius

    def __str__(self):
        return self.name


# -------------------------
# EMPLOYEE
# -------------------------
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    position = models.CharField(max_length=50)
    department = models.CharField(max_length=50)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True, blank=True, related_name='personnel')
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    date_hired = models.DateField(null=True, blank=True)

    # Leave Balances
    sick_leave_balance = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)
    vacation_leave_balance = models.DecimalField(max_digits=5, decimal_places=2, default=15.0)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


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


# -------------------------
# LEAVE REQUEST
# -------------------------
class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    TYPE_CHOICES = [
        ('sick', 'Sick Leave'),
        ('vacation', 'Vacation Leave'),
        ('emergency', 'Emergency Leave'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    date_applied = models.DateTimeField(auto_now_add=True)

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.status})"

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


# -------------------------
# ATTENDANCE
# -------------------------
class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(auto_now_add=True)
    time_in = models.TimeField(null=True, blank=True)
    time_out = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    
    # Geo-Validation Data
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_geo_flagged = models.BooleanField(default=False)

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"


# -------------------------
# AUDIT LOG
# -------------------------
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action}"

# -------------------------
# PERFORMANCE REVIEW
# -------------------------
class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    period = models.CharField(max_length=50) # e.g., "Q1 2026"
    
    # Scores (1-5 scale)
    punctuality_score = models.IntegerField()
    quality_score = models.IntegerField()
    behavior_score = models.IntegerField()
    
    ai_summary = models.TextField(null=True, blank=True)
    is_promotion_eligible = models.BooleanField(default=False)
    date_evaluated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.period}"

# -------------------------
# RECRUITMENT APPLICANT
# -------------------------
class Applicant(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('screened', 'Screened'),
        ('interviewed', 'Interviewed'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
    ]

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    position_applied = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied')
    notes = models.TextField(null=True, blank=True)
    date_applied = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.position_applied}"