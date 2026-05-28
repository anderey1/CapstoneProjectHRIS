from django.db import models
from .employee import Employee

class PDSUpload(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='pds_uploads')
    file = models.FileField(upload_to='pds_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    confidence_avg = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    raw_response = models.JSONField(null=True, blank=True)
    extracted_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"PDS Upload {self.id} - {self.status} ({self.uploaded_at})"

    class Meta:
        ordering = ['-uploaded_at']
