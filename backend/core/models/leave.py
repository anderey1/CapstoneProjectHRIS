from django.db import models
from django.conf import settings
from .employee import Employee, Role

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending_checking', 'For Administrative Assistant II checking'),
        ('pending_supervisor', 'Pending Immediate Supervisor / Principal'),
        ('pending_records', 'For Records Unit receiving'),
        ('pending_hr', 'Pending HR Officer'),
        ('pending_superintendent', 'Pending Superintendent'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('returned', 'Returned for correction'),
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
    leave_type = models.CharField(max_length=50, choices=TYPE_CHOICES, db_index=True)
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
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='pending_supervisor', db_index=True)
    rejection_stage = models.CharField(max_length=25, choices=STATUS_CHOICES, null=True, blank=True, help_text="The stage at which the request was rejected")

    workflow = models.CharField(max_length=20, choices=[('standard', 'Standard / existing'), ('teaching', 'Teaching school routing')], default='standard')
    assigned_checker = models.ForeignKey(Employee, on_delete=models.PROTECT, null=True, blank=True, related_name='assigned_leave_checks')
    assigned_principal = models.ForeignKey(Employee, on_delete=models.PROTECT, null=True, blank=True, related_name='assigned_leave_approvals')
    principal_signature = models.ImageField(upload_to='leave_signatures/', null=True, blank=True)
    principal_signed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='signed_leaves')
    principal_signed_at = models.DateTimeField(null=True, blank=True)
    records_reference = models.CharField(max_length=100, blank=True, default='')
    correction_reason = models.TextField(blank=True, default='')
    
    # Documentary Requirements
    supporting_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    travel_authority_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    clearance_document = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    maternity_notice_allocation = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    paternity_marriage_contract = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    vawc_medical_cert = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    rehab_letter_request = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    rehab_police_report = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    rehab_concurrence = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    women_special_histopath = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    women_special_operative_technique = models.FileField(upload_to='leave_documents/', null=True, blank=True)
    
    # 7. Details of Action
    disapproval_reason = models.TextField(null=True, blank=True)
    approved_days_with_pay = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    approved_days_without_pay = models.DecimalField(max_digits=5, decimal_places=1, default=0.0)
    approved_others = models.CharField(max_length=255, null=True, blank=True)

    def can_process(self, user):
        if not user or not user.is_authenticated or self.employee.user_id == user.pk:
            return False
        profile = getattr(user, 'employee_profile', None)
        if self.workflow == 'teaching':
            if self.status == 'pending_supervisor':
                return bool(profile and profile.pk == self.assigned_principal_id)
            if self.status == 'pending_hr':
                return user.role == Role.HR or user.is_superuser
            return False
        if self.status == 'pending_supervisor':
            return bool((profile and self.employee.supervisor_id == profile.pk) or user.role == Role.ADMINISTRATIVE or user.is_superuser)
        if self.status == 'pending_hr':
            return user.role == Role.HR or user.is_superuser
        if self.status == 'pending_superintendent':
            return user.role == Role.SUPERINTENDENT or user.is_superuser
        return False

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.status})"


class LeaveAction(models.Model):
    leave = models.ForeignKey(LeaveRequest, on_delete=models.CASCADE, related_name='actions')
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    actor_name = models.CharField(max_length=160)
    from_status = models.CharField(max_length=25, blank=True)
    to_status = models.CharField(max_length=25)
    note = models.TextField(blank=True)
    signature = models.ImageField(upload_to='leave_signatures/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']
