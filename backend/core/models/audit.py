# pyrefly: ignore [missing-import]
from django.db import models    
from .employee import User

# -------------------------
# AUDIT LOG
# -------------------------
class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action}"
