from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Employee, School, Attendance, LeaveRequest, 
    ProvidentLoan, LoanPayment, Payroll, 
    PerformanceReview, Applicant, AuditLog
)

# -------------------------
# AUTH & USER
# -------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('role',)}),
    )

# -------------------------
# CORE HR
# -------------------------
@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'position', 'department', 'school')
    search_fields = ('first_name', 'last_name', 'position', 'department')
    list_filter = ('department', 'school')

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name', 'latitude', 'longitude', 'radius_meters')
    search_fields = ('name',)

# -------------------------
# ATTENDANCE & LEAVE
# -------------------------
@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'time_in', 'time_out', 'status', 'is_geo_flagged')
    list_filter = ('status', 'date', 'is_geo_flagged')
    search_fields = ('employee__first_name', 'employee__last_name')

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'leave_type', 'date_applied')
    search_fields = ('employee__first_name', 'employee__last_name')

# -------------------------
# LOANS & PAYROLL
# -------------------------
class LoanPaymentInline(admin.TabularInline):
    model = LoanPayment
    extra = 0

@admin.register(ProvidentLoan)
class ProvidentLoanAdmin(admin.ModelAdmin):
    list_display = ('employee', 'loan_amount', 'status', 'date_applied')
    list_filter = ('status', 'date_applied')
    search_fields = ('employee__first_name', 'employee__last_name')
    inlines = [LoanPaymentInline]

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'cutoff_period', 'net_salary', 'date_generated')
    list_filter = ('cutoff_period', 'date_generated')
    search_fields = ('employee__first_name', 'employee__last_name')

# -------------------------
# PERFORMANCE & RECRUITMENT
# -------------------------
@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ('employee', 'period', 'get_average_score', 'is_promotion_eligible')
    list_filter = ('period', 'is_promotion_eligible')
    search_fields = ('employee__first_name', 'employee__last_name')

    def get_average_score(self, obj):
        avg = (obj.punctuality_score + obj.quality_score + obj.behavior_score) / 3.0
        return round(avg, 2)
    get_average_score.short_description = 'Avg Score'

@admin.register(Applicant)
class ApplicantAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'position_applied', 'status', 'date_applied')
    list_filter = ('status', 'position_applied')
    search_fields = ('first_name', 'last_name', 'position_applied')

# -------------------------
# SYSTEM
# -------------------------
@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'user', 'action')
    list_filter = ('timestamp', 'user')
    search_fields = ('action', 'user__username')
    readonly_fields = ('timestamp', 'user', 'action')