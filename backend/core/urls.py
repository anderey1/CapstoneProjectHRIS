from django.urls import path, include
from rest_framework.routers import DefaultRouter    
from .views import (
    AttendanceViewSet, LoanViewSet, EmployeeViewSet,
    LeaveViewSet, PayrollViewSet, PerformanceReviewViewSet,
    ApplicantViewSet, AuditLogViewSet, SchoolViewSet,
    dashboard_stats, loan_status_chart, employee_department_chart,
    attendance_trends_chart, leave_rate_chart, payroll_summary_chart,
    performance_dist_chart, dashboard_ai_summary, analytics_detail,
    generate_payroll
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

    # Dashboard
    path('dashboard/', dashboard_stats),
    path('dashboard/summary/', dashboard_ai_summary),

    # Charts (Specific Endpoints)
    path('charts/loan-status/', loan_status_chart),
    path('charts/department/', employee_department_chart),
    path('charts/attendance-trends/', attendance_trends_chart),

    path('charts/leave-rate/', leave_rate_chart),
    path('charts/payroll/', payroll_summary_chart),
    path('charts/performance/', performance_dist_chart),

    # Generic Analytics
    path('analytics/<str:metric>/', analytics_detail),

    # Payroll Generation
    path('payroll/generate/<int:employee_id>/', generate_payroll),
]


