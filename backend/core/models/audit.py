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

    def save(self, *args, **kwargs):
        if not self.user:
            # Skip system actions
            return
        from .employee import Role
        allowed_log_roles = [Role.TEACHING, Role.NON_TEACHING, Role.HR, Role.SUPERINTENDENT, Role.ACCOUNTANT]
        if self.user.is_superuser or getattr(self.user, 'role', None) not in allowed_log_roles:
            # Skip non-target roles
            return
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username if self.user else 'System'} - {self.action}"
