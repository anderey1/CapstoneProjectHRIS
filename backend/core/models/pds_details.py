from django.db import models
from .employee import Employee

# -------------------------
# II. FAMILY BACKGROUND
# -------------------------
class FamilyMember(models.Model):
    RELATION_CHOICES = [
        ('SPOUSE', 'Spouse'),
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('CHILD', 'Child'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='family')
    relationship = models.CharField(max_length=10, choices=RELATION_CHOICES)
    surname = models.CharField(max_length=50, null=True, blank=True)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True) # Used primarily for Children
    extension = models.CharField(max_length=10, null=True, blank=True)
    
    # For Spouse
    occupation = models.CharField(max_length=100, null=True, blank=True)
    employer = models.CharField(max_length=100, null=True, blank=True)
    
    # For Children
    date_of_birth = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.surname} ({self.relationship})"

# -------------------------
# III. EDUCATIONAL BACKGROUND
# -------------------------
class Education(models.Model):
    LEVEL_CHOICES = [
        ('ELEMENTARY', 'Elementary'),
        ('SECONDARY', 'Secondary'),
        ('VOCATIONAL', 'Vocational/Trade Course'),
        ('COLLEGE', 'College'),
        ('GRADUATE', 'Graduate Studies'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='education')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    school_name = models.CharField(max_length=255, null=True, blank=True)
    degree_course = models.CharField(max_length=255, null=True, blank=True)
    period_from = models.CharField(max_length=10, null=True, blank=True)
    period_to = models.CharField(max_length=10, null=True, blank=True)
    highest_level = models.CharField(max_length=100, null=True, blank=True) # Units earned
    year_graduated = models.CharField(max_length=4, null=True, blank=True)
    honors_received = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.level} - {self.school_name}"

# -------------------------
# IV. CIVIL SERVICE ELIGIBILITY
# -------------------------
class Eligibility(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='eligibilities')
    service = models.CharField(max_length=255, null=True, blank=True) # e.g. Career Service Professional
    rating = models.CharField(max_length=50, null=True, blank=True)
    date_of_exam = models.DateField(null=True, blank=True)
    place_of_exam = models.CharField(max_length=255, null=True, blank=True)
    license_number = models.CharField(max_length=50, null=True, blank=True)
    validity_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.service or "Unnamed Eligibility"

# -------------------------
# V. WORK EXPERIENCE
# -------------------------
class WorkExperience(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='work_experience')
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True) # Null if Present
    is_present = models.BooleanField(default=False)
    position_title = models.CharField(max_length=255, null=True, blank=True)
    agency = models.CharField(max_length=255, null=True, blank=True)
    monthly_salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    salary_grade = models.CharField(max_length=10, null=True, blank=True) # e.g. 11-1
    status_of_appointment = models.CharField(max_length=50, null=True, blank=True) # e.g. Permanent
    is_gov_service = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.position_title} at {self.agency}"
