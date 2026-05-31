from django.db import models
from .employee import Employee

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
        ('vacation', 'Vacation Leave'),
        ('forced', 'Mandatory/Forced Leave'),
        ('sick', 'Sick Leave'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
        ('special_privilege', 'Special Privilege Leave'),
        ('solo_parent', 'Solo Parent Leave'),
        ('study', 'Study Leave'),
        ('vawc', '10-Day VAWC Leave'),
        ('rehabilitation', 'Rehabilitation Privilege'),
        ('women_special', 'Special Leave Benefits for Women'),
        ('emergency', 'Special Emergency (Calamity) Leave'),
        ('adoption', 'Adoption Leave'),
        ('others', 'Others'),
    ]

    COMMUTATION_CHOICES = [
        ('not_requested', 'Not Requested'),
        ('requested', 'Requested'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    other_type_details = models.CharField(max_length=255, null=True, blank=True)
    
    # 6.B Details of Leave
    # For Vacation/Special Privilege
    is_within_philippines = models.BooleanField(default=True)
    location_details = models.CharField(max_length=255, null=True, blank=True) # Abroad (Specify) or Within PH (Specify)
    
    # For Sick Leave / Women Special / Others
    illness_details = models.CharField(max_length=255, null=True, blank=True)
    is_in_hospital = models.BooleanField(null=True, blank=True)
    
    # For Study Leave
    study_type = models.CharField(max_length=100, choices=[
        ('masters', "Completion of Master's Degree"),
        ('board_exam', "BAR/Board Examination Review"),
    ], null=True, blank=True)
    
    # For Others
    is_monetization = models.BooleanField(default=False)
    is_terminal_leave = models.BooleanField(default=False)
    
    # Dates
    start_date = models.DateField()
    end_date = models.DateField()
    working_days_applied = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    
    # Commutation
    commutation = models.CharField(max_length=20, choices=COMMUTATION_CHOICES, default='not_requested')
    
    # Application Info
    date_applied = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Documentary Requirements
    supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    
    # 7. Details of Action
    disapproval_reason = models.TextField(null=True, blank=True)
    approved_days_with_pay = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    approved_days_without_pay = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    approved_others = models.CharField(max_length=255, null=True, blank=True)

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.status})"
