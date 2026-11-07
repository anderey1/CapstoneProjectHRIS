from django.db.models import CharField, Count, Q, Value
from django.db.models.functions import Cast, Concat

from ..models import Applicant, Employee, EmployeeDocument, LeaveRequest, NotificationTaskDismissal, Payroll, ProvidentLoan, Role
from ..views.leave.viewset import LeaveViewSet


def task_sources(request, include_dismissed=False):
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
    sources = [('leave', leaves, '/my-leaves?tab=approvals' if user.role == Role.PRINCIPAL else '/my-leaves')]
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
            ('registration', Employee.objects.filter(registration_status='pending', user__is_active=False).order_by('pk'), '/employees?tab=pending'),
            ('document', EmployeeDocument.objects.filter(verified=False).order_by('pk'), '/employees'),
            ('recruitment', Applicant.objects.exclude(status__in=['hired', 'disqualified', 'rejected']).order_by('pk'), '/recruitment'),
        ])
    dismissed = NotificationTaskDismissal.objects.filter(recipient=user).values('task_key')
    visible_sources = []
    for module, queryset, path in sources:
        field = 'cutoff_period' if module.startswith('payroll_') else 'pk'
        queryset = queryset.alias(notification_key=Concat(Value(f'{module}:'), Cast(field, CharField())))
        if not include_dismissed:
            queryset = queryset.exclude(notification_key__in=dismissed)
        visible_sources.append((module, queryset, path))
    return visible_sources


def render_task(module, row, path):
    if module.startswith('payroll_'):
        return {'key': f'{module}:{row["cutoff_period"]}', 'module': 'payroll', 'title': f'{"Approve" if module == "payroll_approval" else "Release"} payroll: {row["cutoff_period"]} ({row["total"]} records)', 'path': path}
    titles = {'leave': 'Review leave application', 'loan': 'Review loan', 'registration': 'Review registration', 'document': 'Verify document', 'recruitment': 'Review application'}
    if module == 'leave' and row.status == 'returned':
        title = 'Correct and resubmit leave application'
    else:
        title = titles[module]
    return {'key': f'{module}:{row.pk}', 'module': module, 'title': f'{title} #{row.pk}', 'path': path}
