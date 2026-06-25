from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, F, Value, Case, When
from django.db.models.functions import Coalesce
from ..models import Employee, ProvidentLoan, Attendance, LeaveRequest, Payroll, PerformanceReview, Applicant
from ..utils import generate_hr_summary
from ..permissions import IsManagement

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsManagement])
def dashboard_stats(request):
    total_payroll = Payroll.objects.filter(status='released').aggregate(total=Sum('net_salary'))['total'] or 0
    pending_payroll_approval = Payroll.objects.filter(status='draft').count()
    ready_for_release = Payroll.objects.filter(status='approved').count()

    total_loans_disbursed = ProvidentLoan.objects.filter(status__in=['released', 'paid']).aggregate(total=Sum('loan_amount'))['total'] or 0
    approved_loans_pending = ProvidentLoan.objects.filter(status='approved').aggregate(total=Sum('loan_amount'))['total'] or 0
    pending_loan_count = ProvidentLoan.objects.filter(status='verified').count()
    
    attendance_alerts = Attendance.objects.filter(is_geo_flagged=True).count()
    pending_leaves = LeaveRequest.objects.filter(status__in=['pending_supervisor', 'pending_hr', 'pending_superintendent']).count()
    active_applicants = Applicant.objects.exclude(status__in=['hired', 'rejected']).count()
    pending_ipcrf = Employee.objects.exclude(performance_reviews__isnull=False).count()

    return Response({
        "total_employees": Employee.objects.count(),
        "total_loans": ProvidentLoan.objects.count(),
        "approved_loan_count": ProvidentLoan.objects.filter(status='approved').count(),
        "total_payroll_disbursed": f"{total_payroll:,.2f}",
        "pending_payroll_approval": pending_payroll_approval,
        "ready_for_release": ready_for_release,
        "total_loan_portfolio": f"{total_loans_disbursed:,.2f}",
        "total_approved_pending": f"{approved_loans_pending:,.2f}",
        "pending_loan_approvals": pending_loan_count,
        "attendance_alerts": attendance_alerts,
        "pending_leaves": pending_leaves,
        "active_applicants": active_applicants,
        "pending_ipcrf": pending_ipcrf,
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
    elif metric == 'leave':
        from ..models import Role
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
        return Response({"detail": "Metric not found. Available: attendance, leave, payroll, performance, loans, departments, recruitment"}, status=404)
    
    return Response(data)
