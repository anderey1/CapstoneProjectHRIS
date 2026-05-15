from django.db import models

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
