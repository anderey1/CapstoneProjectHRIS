from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, F, Value, Case, When
from django.utils import timezone
from ..models import Employee, ProvidentLoan, Attendance, LeaveRequest, Payroll, PerformanceReview, Applicant, School, Role
from ..utils import generate_hr_summary
from ..permissions import IsManagement

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagement])
def dashboard_stats(request):
    total_employees = Employee.objects.count()
    teaching_count = Employee.objects.filter(user__role=Role.TEACHING).count()
    non_teaching_count = Employee.objects.filter(user__role=Role.NON_TEACHING).count()
    administrative_count = Employee.objects.filter(user__role=Role.ADMINISTRATIVE).count()

    total_payroll = Payroll.objects.filter(status='released').aggregate(total=Sum('net_salary'))['total'] or 0
    pending_payroll_approval = Payroll.objects.filter(status='draft').count()
    ready_for_release = Payroll.objects.filter(status='approved').count()

    total_loans_disbursed = ProvidentLoan.objects.filter(status__in=['released', 'paid']).aggregate(total=Sum('loan_amount'))['total'] or 0
    approved_loans_pending = ProvidentLoan.objects.filter(status='approved').aggregate(total=Sum('loan_amount'))['total'] or 0
    pending_loan_verification = ProvidentLoan.objects.filter(status='pending').count()
    pending_loan_approval = ProvidentLoan.objects.filter(status='verified').count()
    active_loans_count = ProvidentLoan.objects.filter(status='released').count()
    
    attendance_alerts = Attendance.objects.filter(is_geo_flagged=True).count()
    total_attendance_records = Attendance.objects.count()
    clean_attendance_records = Attendance.objects.filter(is_geo_flagged=False).count()
    geo_compliance_rate = round((clean_attendance_records / total_attendance_records * 100), 1) if total_attendance_records > 0 else 100.0

    leaves_supervisor = LeaveRequest.objects.filter(status='pending_supervisor').count()
    leaves_hr = LeaveRequest.objects.filter(status='pending_hr').count()
    leaves_superintendent = LeaveRequest.objects.filter(status='pending_superintendent').count()
    pending_leaves = leaves_supervisor + leaves_hr + leaves_superintendent
    
    active_applicants = Applicant.objects.exclude(status__in=['hired', 'rejected']).count()
    pending_ipcrf = Employee.objects.exclude(performance_reviews__isnull=False).count()

    # School breakdown
    schools_breakdown = list(
        School.objects.annotate(employee_count=Count('personnel'))
        .filter(employee_count__gt=0)
        .values('name', 'employee_count')
        .order_by('-employee_count')
    )

    # Calculate the most frequently requested leave type
    most_used = LeaveRequest.objects.values('leave_type').annotate(count=Count('id')).order_by('-count').first()
    most_used_leave = "None"
    if most_used:
        type_choices_dict = dict(LeaveRequest.TYPE_CHOICES)
        most_used_leave = type_choices_dict.get(most_used['leave_type'], most_used['leave_type'])

    # Total pending action queue
    pending_action_total = pending_leaves + pending_loan_verification + pending_loan_approval + pending_payroll_approval

    # Executive operational insights
    teaching_pct = round((teaching_count / total_employees * 100), 1) if total_employees > 0 else 0
    insights = {
        "workforce": {
            "title": "Workforce Deployment & School Staffing",
            "summary": f"Teaching personnel account for {teaching_pct}% ({teaching_count} of {total_employees}) across cluster schools (South 1, West 1, North 1, East 1, LCNHS). Administrative support is actively staffed at {administrative_count} division officers.",
            "status": "Optimal Deployment" if teaching_pct >= 50 else "Review Deployment"
        },
        "attendance": {
            "title": "Attendance & Geofencing Integrity",
            "summary": f"Geofence compliance stands at {geo_compliance_rate}%. {attendance_alerts} records were flagged for out-of-boundary time stamps and require school principal/supervisor validation.",
            "status": "Attention Needed" if attendance_alerts > 0 else "Compliant"
        },
        "finance": {
            "title": "Provident Fund & Payroll Disbursement",
            "summary": f"Active loan portfolio has disbursed ₱{total_loans_disbursed:,.2f} with {active_loans_count} active amortizations running on automatic payroll deduction.",
            "status": "Healthy Portfolio"
        },
        "action_items": [
            f"{leaves_supervisor} leave request(s) awaiting School Principal recommendation",
            f"{leaves_hr} leave request(s) awaiting HR certification",
            f"{leaves_superintendent} leave request(s) awaiting Superintendent final sign-off",
            f"{pending_loan_verification} Provident loan application(s) awaiting Accountant verification",
            f"{pending_loan_approval} Provident loan application(s) awaiting Superintendent approval",
            f"{pending_payroll_approval} Payroll cycle(s) in draft status pending review"
        ]
    }

    return Response({
        "total_employees": total_employees,
        "teaching_count": teaching_count,
        "non_teaching_count": non_teaching_count,
        "administrative_count": administrative_count,
        "total_loans": ProvidentLoan.objects.count(),
        "active_loans_count": active_loans_count,
        "approved_loan_count": ProvidentLoan.objects.filter(status='approved').count(),
        "total_payroll_disbursed": f"{total_payroll:,.2f}",
        "pending_payroll_approval": pending_payroll_approval,
        "ready_for_release": ready_for_release,
        "total_loan_portfolio": f"{total_loans_disbursed:,.2f}",
        "total_approved_pending": f"{approved_loans_pending:,.2f}",
        "pending_loan_approvals": pending_loan_approval,
        "pending_loan_verification": pending_loan_verification,
        "attendance_alerts": attendance_alerts,
        "geo_compliance_rate": geo_compliance_rate,
        "pending_leaves": pending_leaves,
        "pending_leaves_supervisor": leaves_supervisor,
        "pending_leaves_hr": leaves_hr,
        "pending_leaves_superintendent": leaves_superintendent,
        "pending_action_total": pending_action_total,
        "active_applicants": active_applicants,
        "pending_ipcrf": pending_ipcrf,
        "most_used_leave": most_used_leave,
        "schools_breakdown": schools_breakdown,
        "insights": insights,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagement])
def dashboard_ai_summary(request):
    """
    Returns an AI-powered summary of system data.
    """
    data_context = {
        "total_employees": Employee.objects.count(),
        "total_loans": ProvidentLoan.objects.count(),
        "approved_loans": ProvidentLoan.objects.filter(status__in=['approved', 'released', 'paid']).count(),
        "total_departments": Employee.objects.values('department').distinct().count(),
    }
    
    summary = generate_hr_summary(data_context)
    
    return Response({
        "ai_summary": summary
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagement])
def analytics_detail(request, metric):
    """
    Generic analytics endpoint that routes to specific chart data.
    """
    if metric == 'attendance':
        data = Attendance.objects.values('status').annotate(count=Count('status'))
    elif metric == 'schools':
        data = School.objects.annotate(count=Count('personnel')).filter(count__gt=0).values('name', 'count').order_by('-count')
    elif metric == 'leave':
        teaching_leaves = LeaveRequest.objects.filter(
            employee__user__role=Role.TEACHING,
            status='approved'
        ).values('leave_type').annotate(count=Count('employee', distinct=True))

        non_teaching_leaves = LeaveRequest.objects.filter(
            employee__user__role=Role.NON_TEACHING,
            status='approved'
        ).values('leave_type').annotate(count=Count('employee', distinct=True))

        data = {
            "teaching": list(teaching_leaves),
            "non_teaching": list(non_teaching_leaves)
        }
    elif metric == 'payroll':
        data = Payroll.objects.filter(status='released').values('cutoff_period').annotate(
            total_net=Sum('net_salary'),
            total_deductions=Sum('total_deductions')
        ).order_by('-cutoff_period')[:6]
    elif metric == 'performance':
        data = PerformanceReview.objects.values('is_promotion_eligible').annotate(count=Count('id'))
    elif metric == 'loans':
        data = ProvidentLoan.objects.values('status').annotate(count=Count('status'))
    elif metric == 'departments':
        data = Employee.objects.values('department').annotate(count=Count('department'))
    elif metric == 'recruitment':
        data = Applicant.objects.values('status').annotate(count=Count('status'))
    else:
        return Response({"detail": "Metric not found. Available: attendance, schools, leave, payroll, performance, loans, departments, recruitment"}, status=404)
    
    return Response(data)
