from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum
from ..models import Employee, ProvidentLoan, Attendance, LeaveRequest, Payroll, PerformanceReview
from ..utils import generate_hr_summary

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    return Response({
        "total_employees": Employee.objects.count(),
        "total_loans": ProvidentLoan.objects.count(),
        "approved_loans": ProvidentLoan.objects.filter(status='approved').count(),
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_ai_summary(request):
    """
    Returns an AI-powered summary of system data.
    """
    data_context = {
        "total_employees": Employee.objects.count(),
        "total_loans": ProvidentLoan.objects.count(),
        "approved_loans": ProvidentLoan.objects.filter(status='approved').count(),
        "total_departments": Employee.objects.values('department').distinct().count(),
    }
    
    summary = generate_hr_summary(data_context)
    
    return Response({
        "ai_summary": summary
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_detail(request, metric):
    """
    Generic analytics endpoint that routes to specific chart data.
    """
    if metric == 'attendance':
        data = Attendance.objects.values('status').annotate(count=Count('status'))
    elif metric == 'leave':
        data = LeaveRequest.objects.values('leave_type').annotate(count=Count('leave_type'))
    elif metric == 'payroll':
        data = Payroll.objects.values('cutoff_period').annotate(
            total_net=Sum('net_salary'),
            total_deductions=Sum('total_deductions')
        ).order_by('-cutoff_period')[:6]
    elif metric == 'performance':
        data = PerformanceReview.objects.values('is_promotion_eligible').annotate(count=Count('id'))
    elif metric == 'loans':
        data = ProvidentLoan.objects.values('status').annotate(count=Count('status'))
    elif metric == 'departments':
        data = Employee.objects.values('department').annotate(count=Count('department'))
    else:
        return Response({"detail": "Metric not found. Available: attendance, leave, payroll, performance, loans, departments"}, status=404)
    
    return Response(data)
