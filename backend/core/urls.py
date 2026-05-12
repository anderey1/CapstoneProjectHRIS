from django.urls import path, include
from rest_framework.routers import DefaultRouter    
from .views import (
    AttendanceViewSet, LoanViewSet,
    dashboard_stats, loan_status_chart, employee_department_chart,
    generate_payroll, EmployeeViewSet
)

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet)
router.register(r'loans', LoanViewSet)
router.register(r'employees', EmployeeViewSet)

urlpatterns = [
    # CRUD endpoints via ViewSets
    path('', include(router.urls)),

    # Dashboard
    path('dashboard/', dashboard_stats),

    # Charts
    path('charts/loan-status/', loan_status_chart),
    path('charts/department/', employee_department_chart),

    # Payroll Generation
    path('payroll/generate/<int:employee_id>/', generate_payroll),
]
