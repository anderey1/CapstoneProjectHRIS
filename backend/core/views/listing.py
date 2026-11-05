"""List filtering runs after each ViewSet's authorization scope, before DRF paging."""
from datetime import timedelta
from functools import reduce
from operator import or_

from django.db.models import Case, CharField, F, Q, Value, When
from django.utils import timezone
from rest_framework import serializers
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from ..services.list_summaries import list_summary


AUDIT_MODULES = [
    ('CSC Form 6 (Leave)', ('leave', 'form 6')),
    ('CSC Form 48 (DTR)', ('attendance', 'dtr', 'clock')),
    ('RPMS / IPCRF', ('rating', 'ipcrf', 'performance')),
    ('Division Payroll', ('payroll', 'salary', 'voucher')),
    ('Provident Fund', ('loan', 'provident')),
    ('Personnel (201)', ('employee', 'plantilla', 'registration', 'onboard')),
    ('Access / Moderation', ('delete', 'removed', 'reject')),
]
PENDING_LEAVES = ('pending_supervisor', 'pending_hr', 'pending_superintendent')
PERSON_SEARCH = ('employee__first_name', 'employee__last_name', 'employee__middle_name',
                 'employee__department', 'employee__position')
SEARCH_FIELDS = {
    'employee': ('first_name', 'last_name', 'middle_name', 'department', 'position'),
    'attendance': PERSON_SEARCH,
    'providentloan': (*PERSON_SEARCH, '=id'),
    'payroll': PERSON_SEARCH,
    'leaverequest': (*PERSON_SEARCH, 'leave_type', 'location_details', 'illness_details'),
    'performancereview': (*PERSON_SEARCH, 'period'),
    'applicant': ('first_name', 'middle_name', 'last_name', 'position_applied'),
    'auditlog': ('user__username', 'user__employee_profile__first_name',
                 'user__employee_profile__last_name', 'action', '=id', 'audit_module'),
}


def integer_param(params, name, minimum=1, maximum=None):
    return serializers.IntegerField(min_value=minimum, max_value=maximum).run_validation(params[name])


class PaginatedListMixin:
    def list_resource(self):
        return self.queryset.model._meta.model_name

    def filter_list(self, queryset):
        params = self.request.query_params
        resource = self.list_resource()
        if resource == 'auditlog':
            queryset = queryset.annotate(audit_module=Case(*[
                When(reduce(or_, (Q(action__icontains=word) for word in words)), then=Value(label))
                for label, words in AUDIT_MODULES
            ], default=Value('System / Security'), output_field=CharField()))
        self.search_fields = SEARCH_FIELDS.get(resource, ())
        queryset = SearchFilter().filter_queryset(self.request, queryset, self)
        fields = {
            'employee': {'role': 'user__role', 'department': 'department'},
            'attendance': {'department': 'employee__department', 'employee_id': 'employee_id'},
            'payroll': {'cutoff_period': 'cutoff_period'},
            'performancereview': {'period': 'period'},
            'leaverequest': {'leave_type': 'leave_type'},
            'auditlog': {'module': 'audit_module'},
        }.get(resource, {})
        for param, field in fields.items():
            value = params.get(param)
            if value and value not in ('all', 'All', 'ALL'):
                if param == 'employee_id':
                    value = integer_param(params, param)
                queryset = queryset.filter(**{field: value})
        if resource in ('providentloan', 'applicant', 'leaverequest'):
            status = params.get('status')
            if status and status != 'all':
                statuses = PENDING_LEAVES if resource == 'leaverequest' and status == 'pending' else status.split(',')
                queryset = queryset.filter(status__in=statuses)
        if resource == 'employee' and params.get('exclude_self') == 'true':
            queryset = queryset.exclude(user=self.request.user)
        if resource == 'leaverequest':
            if params.get('scope') == 'mine':
                queryset = queryset.filter(employee__user=self.request.user)
            elif params.get('scope') == 'team':
                queryset = queryset.exclude(employee__user=self.request.user)
        if resource == 'attendance':
            for param, maximum in (('month', 12), ('year', 9999)):
                if params.get(param):
                    queryset = queryset.filter(**{f'date__{param}': integer_param(params, param, maximum=maximum)})
            if params.get('flagged') == 'true':
                queryset = queryset.filter(is_geo_flagged=True)
        if resource == 'auditlog':
            days = {'24H': 1, '7D': 7, '30D': 30}.get(params.get('date_range'))
            if days:
                queryset = queryset.filter(timestamp__gte=timezone.now() - timedelta(days=days))
        if resource == 'performancereview' and params.get('rating') not in (None, '', 'ALL'):
            queryset = queryset.annotate(rpms_score=F('quality_score') * 0.4 + F('behavior_score') * 0.3 + F('punctuality_score') * 0.3)
            ranges = {'O': (4.5, None), 'VS': (3.5, 4.5), 'S': (2.5, 3.5), 'US': (1.5, 2.5), 'P': (0, 1.5)}
            rating = params['rating']
            if rating == 'NE':
                queryset = queryset.filter(Q(quality_score__isnull=True) | Q(behavior_score__isnull=True) | Q(punctuality_score__isnull=True))
            elif rating in ranges:
                low, high = ranges[rating]
                queryset = queryset.filter(rpms_score__gte=low)
                if high is not None:
                    queryset = queryset.filter(rpms_score__lt=high)
        return queryset

    def paginated_list(self, queryset):
        if self.list_resource() == 'leaverequest':
            if self.request.query_params.get('scope') == 'mine':
                queryset = queryset.filter(employee__user=self.request.user)
            elif self.request.query_params.get('scope') == 'team':
                queryset = queryset.exclude(employee__user=self.request.user)
        filtered = self.filter_list(queryset)
        page = self.paginate_queryset(filtered)
        serializer = self.get_serializer(page if page is not None else filtered, many=True)
        if page is None:
            return Response(serializer.data)
        response = self.get_paginated_response(serializer.data)
        response.data['page_size'] = self.paginator.get_page_size(self.request)
        # Attendance totals describe the selected month/filters; portfolio totals span pages.
        summary_queryset = filtered if self.list_resource() == 'attendance' else queryset
        response.data['summary'] = list_summary(self.list_resource(), summary_queryset, self.request.user)
        return response

    def list(self, request, *args, **kwargs):
        return self.paginated_list(self.get_queryset())
