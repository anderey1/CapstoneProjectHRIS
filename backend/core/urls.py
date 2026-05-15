from django.urls import path, include
from rest_framework.routers import DefaultRouter    
from .views import (
    AttendanceViewSet, LoanViewSet, EmployeeViewSet,
    LeaveViewSet, PayrollViewSet, PerformanceReviewViewSet,
    ApplicantViewSet, AuditLogViewSet, SchoolViewSet,
    dashboard_stats, dashboard_ai_summary, analytics_detail
)

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'employees', EmployeeViewSet)
router.register(r'leaves', LeaveViewSet)
router.register(r'payroll', PayrollViewSet)
router.register(r'performance', PerformanceReviewViewSet)
router.register(r'applicants', ApplicantViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'schools', SchoolViewSet)


urlpatterns = [
    # CRUD endpoints via ViewSets
    path('', include(router.urls)),

    # Dashboard & AI
    path('dashboard/', dashboard_stats, name='dashboard_stats'),
    path('dashboard/summary/', dashboard_ai_summary, name='dashboard_ai_summary'),

    # Consolidated Analytics (Replaces individual chart endpoints)
    path('analytics/<str:metric>/', analytics_detail, name='analytics_detail'),
]


