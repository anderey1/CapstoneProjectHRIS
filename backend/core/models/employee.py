# pyrefly: ignore [missing-import]
from django.db import models
# pyrefly: ignore [missing-import]
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
# MANAGERS
# -------------------------
class EmployeeManager(models.Manager):
    def create_with_user(self, user_data, employee_data):
        """
        Atomsically creates a User and its corresponding Employee profile.
        """
        from django.db import transaction
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        with transaction.atomic():
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data.get('email', ''),
                password=user_data['password'],
                role=user_data.get('role', Role.EMPLOYEE),
                first_name=employee_data.get('first_name', ''),
                last_name=employee_data.get('last_name', '')
            )
            employee = self.create(user=user, **employee_data)
            return employee

# -------------------------
# EMPLOYEE
# -------------------------
class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile', null=True, blank=True)
    objects = EmployeeManager()
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
