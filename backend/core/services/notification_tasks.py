from django.db.models import Count, Q

from ..models import Applicant, Employee, EmployeeDocument, LeaveRequest, Payroll, ProvidentLoan, Role
from ..views.leave.viewset import LeaveViewSet


def task_sources(request):
    user = request.user
    profile = getattr(user, 'employee_profile', None)
    leave_view = LeaveViewSet()
    leave_view.request = request
    visible = leave_view.get_queryset()
    eligible = Q(workflow='teaching', status='returned', employee__user=user)
    if profile:
        eligible |= Q(workflow='teaching', status='pending_supervisor', assigned_principal=profile)
        eligible |= Q(workflow='standard', status='pending_supervisor', employee__supervisor=profile)
    if user.is_superuser or user.role == Role.ADMINISTRATIVE:
        eligible |= Q(workflow='standard', status='pending_supervisor')
    if user.is_superuser or user.role == Role.HR:
        eligible |= Q(status='pending_hr')
    if user.is_superuser or user.role == Role.SUPERINTENDENT:
        eligible |= Q(workflow='standard', status='pending_superintendent')
    leaves = visible.filter(eligible).exclude(~Q(status='returned') & Q(employee__user=user)).order_by('pk')
    sources = [('leave', leaves, '/my-leaves')]
    manager = user.is_superuser or user.role in (Role.HR, Role.SUPERINTENDENT, Role.ADMINISTRATIVE)
    finance = manager or user.role == Role.ACCOUNTANT
    if finance:
        sources.append(('loan', ProvidentLoan.objects.filter(status__in=['pending', 'verified', 'approved']).order_by('pk'), '/loan-management'))
    if user.is_superuser or user.role == Role.SUPERINTENDENT:
        sources.append(('payroll_approval', Payroll.objects.filter(status='draft').order_by().values('cutoff_period').annotate(total=Count('pk')).order_by('cutoff_period'), '/payroll-management'))
    if user.is_superuser or user.role == Role.ACCOUNTANT:
        sources.append(('payroll_release', Payroll.objects.filter(status='approved').order_by().values('cutoff_period').annotate(total=Count('pk')).order_by('cutoff_period'), '/payroll-management'))
    if manager:
        sources.extend([
            ('registration', Employee.objects.filter(user__is_active=False).order_by('pk'), '/employees'),
            ('document', EmployeeDocument.objects.filter(verified=False).order_by('pk'), '/employees'),
            ('recruitment', Applicant.objects.exclude(status__in=['hired', 'disqualified', 'rejected']).order_by('pk'), '/recruitment'),
        ])
    return sources


def render_task(module, row, path):
    if module.startswith('payroll_'):
        return {'key': f'{module}:{row["cutoff_period"]}', 'module': 'payroll', 'title': f'{"Approve" if module == "payroll_approval" else "Release"} payroll: {row["cutoff_period"]} ({row["total"]} records)', 'path': path}
    titles = {'leave': 'Review leave application', 'loan': 'Review loan', 'registration': 'Review registration', 'document': 'Verify document', 'recruitment': 'Review application'}
    if module == 'leave' and row.status == 'returned':
        title = 'Correct and resubmit leave application'
    else:
        title = titles[module]
    return {'key': f'{module}:{row.pk}', 'module': module, 'title': f'{title} #{row.pk}', 'path': path}
