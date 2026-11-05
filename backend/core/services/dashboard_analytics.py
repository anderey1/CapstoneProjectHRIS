"""Descriptive operational analytics. Counts are records, never inferred compliance."""
from decimal import Decimal
from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncMonth
from django.utils import timezone

from core.models import Employee, Attendance, LeaveRequest, ProvidentLoan, Payroll, PerformanceReview, Applicant, Role


def breakdown(qs, field, choices=None):
    labels = dict(choices or [])
    return [dict(name=labels.get(row[field], row[field] or 'Not recorded'), value=row['value'])
            for row in qs.order_by().values(field).annotate(value=Count('pk')).order_by('-value', field)]


def operational_dashboard(user):
    management = user.is_management
    employees = Employee.objects.all() if management else Employee.objects.filter(user=user)
    scope = {} if management else {'employee__user': user}
    attendance = Attendance.objects.filter(**scope)
    leaves = LeaveRequest.objects.filter(**scope)
    loans = ProvidentLoan.objects.filter(**scope)
    payroll = Payroll.objects.filter(**scope)
    performance = PerformanceReview.objects.filter(**scope)
    charts = []

    def add(key, title, data, unit, action, path, note, period='All recorded history'):
        total = sum((Decimal(str(item['value'])) for item in data), Decimal('0')) if unit == 'PHP' else sum(item['value'] for item in data)
        largest = max(data, key=lambda item: Decimal(str(item['value'])), default=None)
        if unit == 'PHP':
            insight = f"Recorded released net pay totals PHP {total:,.2f} across the months shown."
        elif total:
            insight = f"{int(total):,} {unit} in total. {largest['name']} is the largest group with {int(largest['value']):,} ({float(largest['value']) / total:.0%})."
            tied = sum(item['value'] == largest['value'] for item in data)
            if tied > 1:
                insight = f"{int(total):,} {unit} in total. {tied} groups share the largest count, with {int(largest['value']):,} each."
        else:
            insight = f"No {unit} recorded for this view yet."
        charts.append(dict(key=key, title=title, data=data, unit=unit, total=str(total) if unit == 'PHP' else total,
                           insight=insight, note=note, action=action, path=path, period=period))

    finance_only = management and user.role == Role.ACCOUNTANT
    if management and not finance_only:
        add('workforce', 'Workforce composition', breakdown(employees, 'user__role', Role.choices),
            'personnel', 'Open personnel directory', '/employees',
            'Includes every recorded staff role. Headcount alone does not establish staffing adequacy.', 'Current personnel records')
        add('stations', 'Personnel by station', breakdown(employees, 'school__name'),
            'personnel', 'Review station assignments', '/employees',
            'A larger headcount does not prove a station is overstaffed.', 'Current personnel records')
    if not finance_only:
        add('attendance', 'Attendance review status', [
            dict(name='Approved daily records', value=attendance.filter(is_dtr_approved=True).count()),
            dict(name='Awaiting review', value=attendance.filter(is_dtr_approved=False).count())],
            'daily records', 'Review attendance' if management else 'View my DTR',
            '/attendance-management' if management else '/dtr',
            'Counts daily attendance rows, not employees or monthly DTR forms. Approval is not an attendance-compliance score.')
        add('leaves', 'Leave processing pipeline', breakdown(leaves, 'status', LeaveRequest.STATUS_CHOICES),
            'applications', 'Review leave applications' if management else 'View my leave applications',
            '/leave-management' if management else '/my-leaves',
            'Each application is counted once at its current stage. This does not measure processing time.')
    add('loans', 'Provident loan pipeline', breakdown(loans, 'status', ProvidentLoan.STATUS_CHOICES),
        'applications', 'Review loan applications' if management else 'View my loans',
        '/loan-management' if management else '/my-loans',
        'Shows application status, not outstanding principal or a measure of portfolio health.')
    add('payroll_status', 'Payroll processing pipeline', breakdown(payroll, 'status', Payroll.STATUS_CHOICES),
        'employee payroll records', 'Open payroll' if management else 'View my payslips',
        '/payroll-management' if management else '/my-payslips',
        'Each row is one employee payroll record, not a whole payroll batch. Draft and approved records are not yet released.')
    monthly = list(payroll.filter(status='released').annotate(
        released_month=TruncMonth(Coalesce('date_released', 'date_generated'))
    ).values('released_month').annotate(amount=Sum('net_salary')).order_by('-released_month')[:12])
    add('payroll', 'Released payroll by month', [dict(name=row['released_month'].strftime('%b %Y'), value=str(row['amount'])) for row in reversed(monthly)],
        'PHP', 'Open payroll' if management else 'View my payslips',
        '/payroll-management' if management else '/my-payslips',
        'Only released employee payroll records are included. Release date is used; older records without it use their generation date.',
        'Latest 12 recorded release months')
    if not finance_only:
        scored = Q(quality_score__isnull=False, behavior_score__isnull=False, punctuality_score__isnull=False)
        add('performance', 'Performance record coverage', [
            dict(name='Scored records', value=performance.filter(scored).count()),
            dict(name='Awaiting complete scores', value=performance.exclude(scored).count())],
            'review records', 'Open performance reviews' if management else 'View my performance records',
            '/performance-management' if management else '/my-performance',
            'Multiple review periods for one employee count separately. This does not determine promotion eligibility.')
    if management and not finance_only:
        add('recruitment', 'Recruitment pipeline', breakdown(Applicant.objects.all(), 'status', Applicant.STATUS_CHOICES),
            'applicants', 'Open applicant board', '/recruitment',
            'Shows current application stages, including completed outcomes. It is not a conversion rate.')
    return dict(scope='division' if management else 'personal', as_of=timezone.now().isoformat(), charts=charts)
