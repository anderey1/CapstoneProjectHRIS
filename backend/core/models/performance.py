# pyrefly: ignore [missing-import]
from django.db import models
from .employee import Employee

# -------------------------
# PERFORMANCE REVIEW
# -------------------------
class PerformanceReview(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='performance_reviews')
    period = models.CharField(max_length=50) # e.g., "Q1 2026"
    
    # Scores (1-5 scale)
    punctuality_score = models.IntegerField(null=True, blank=True)
    quality_score = models.IntegerField(null=True, blank=True)
    behavior_score = models.IntegerField(null=True, blank=True)
    
    ipcrf_file = models.FileField(upload_to='ipcrf_uploads/', null=True, blank=True)
    
    ai_summary = models.TextField(null=True, blank=True)
    is_promotion_eligible = models.BooleanField(default=False)
    date_evaluated = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} - {self.period}"
