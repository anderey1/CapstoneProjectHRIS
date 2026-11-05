"""Small aggregate responses keep table metrics independent of the current page."""
from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, F, Q, Sum
from django.utils import timezone


def status_counts(queryset):
    return {row['status']: row['count'] for row in
            queryset.order_by().values('status').annotate(count=Count('pk'))}


def list_summary(resource, queryset, user):
    total = queryset.count()
    summary = {'total': total}
    if resource == 'employee':
        teaching = queryset.filter(user__role='TEACHING').count()
        summary.update(
            teaching=teaching, non_teaching=queryset.filter(user__role__isnull=False).exclude(user__role='TEACHING').count(),
            roles=list(queryset.exclude(user__role__isnull=True).exclude(user__role='').order_by('user__role').values_list('user__role', flat=True).distinct()),
            departments=list(queryset.exclude(department__isnull=True).exclude(department='').order_by('department').values_list('department', flat=True).distinct()),
        )
    elif resource in ('providentloan', 'applicant', 'leaverequest', 'attendance'):
        summary['statuses'] = status_counts(queryset)
        if resource == 'providentloan':
            active = queryset.filter(status__in=['approved', 'released'])
            summary.update(
                released_value=queryset.filter(status__in=['released', 'paid']).aggregate(value=Sum('loan_amount'))['value'] or Decimal('0'),
                active_disbursed=active.aggregate(value=Sum('loan_amount'))['value'] or Decimal('0'),
                monthly_amortization=active.aggregate(value=Sum('monthly_payment'))['value'] or Decimal('0'),
            )
        elif resource == 'leaverequest':
            pending = queryset.filter(status__in=['pending_supervisor', 'pending_hr', 'pending_superintendent'])
            summary.update(pending=pending.count(), action_required=sum(leave.can_process(user) for leave in pending))
        elif resource == 'attendance':
            summary.update(present=queryset.filter(status='present').count(),
                           late=queryset.filter(status='late').count(),
                           flagged=queryset.filter(is_geo_flagged=True).count())
    elif resource == 'performancereview':
        scored = queryset.annotate(score=F('quality_score') * 0.4 + F('behavior_score') * 0.3 + F('punctuality_score') * 0.3)
        summary.update(
            outstanding=scored.filter(score__gte=4.5).count(),
            verySatisfactory=scored.filter(score__gte=3.5, score__lt=4.5).count(),
            eligible=queryset.filter(is_promotion_eligible=True).count(),
            periods=list(queryset.order_by('period').values_list('period', flat=True).distinct()),
        )
    elif resource == 'auditlog':
        summary.update(
            operators=queryset.exclude(user=None).order_by().values('user').distinct().count(),
            recent=queryset.filter(timestamp__gte=timezone.now() - timedelta(days=1)).count(),
            critical=queryset.filter(Q(action__icontains='delete') | Q(action__icontains='reject') | Q(action__icontains='cancel')).count(),
        )
    return {key: str(value) if isinstance(value, Decimal) else value for key, value in summary.items()}
