# pyrefly: ignore [missing-import]
from django.db import models
from .employee import Employee

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
    
    # DTR Time Slots (Civil Service Form 48)
    am_in = models.TimeField(null=True, blank=True)
    am_out = models.TimeField(null=True, blank=True)
    pm_in = models.TimeField(null=True, blank=True)
    pm_out = models.TimeField(null=True, blank=True)
    ot_in = models.TimeField(null=True, blank=True)
    ot_out = models.TimeField(null=True, blank=True)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    
    # DTR Approval (HR Gatekeeper)
    is_dtr_approved = models.BooleanField(default=False)
    dtr_approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_dtrs')
    dtr_approved_at = models.DateTimeField(null=True, blank=True)
    
    # Geo-Validation Data
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_geo_flagged = models.BooleanField(default=False)

    class Meta:
        unique_together = ('employee', 'date')

    def __str__(self):
        return f"{self.employee} - {self.date} ({self.status})"

