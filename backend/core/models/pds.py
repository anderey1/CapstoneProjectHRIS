import os

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from .employee import Employee


def validate_pds_file(value):
    """Validate PDS upload size and filename before it is persisted."""
    max_size_mb = getattr(settings, 'PDS_UPLOAD_MAX_SIZE_MB', 10)
    max_size = max_size_mb * 1024 * 1024
    if value.size > max_size:
        raise ValidationError("PDS file exceeds the maximum allowed size.")

    extension = os.path.splitext(value.name)[1].lower()
    allowed_extensions = {
        extension.lower()
        for extension in getattr(settings, 'PDS_ALLOWED_EXTENSIONS', ['.pdf'])
    }
    if extension not in allowed_extensions:
        raise ValidationError("PDS file type is not allowed.")


def validate_pds_upload(upload):
    """Validate a request upload, including its declared MIME type."""
    validate_pds_file(upload)

    content_type = getattr(upload, 'content_type', None)
    allowed_content_types = {
        content_type.lower()
        for content_type in getattr(
            settings, 'PDS_ALLOWED_CONTENT_TYPES', ['application/pdf']
        )
    }
    if not content_type or content_type.lower() not in allowed_content_types:
        raise ValidationError("PDS file content type is not allowed.")

class PDSUpload(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='pds_uploads')
    file = models.FileField(upload_to='pds_uploads/', validators=[validate_pds_file])
    uploaded_at = models.DateTimeField(auto_now_add=True)
    confidence_avg = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    raw_response = models.JSONField(null=True, blank=True)
    extracted_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"PDS Upload {self.id} - {self.status} ({self.uploaded_at})"

    class Meta:
        ordering = ['-uploaded_at']
