from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from ...services.leave_calendar import calendar_response
from ...models import LeaveRequest, Role
from ...serializers import LeaveRequestSerializer
from ..listing import PaginatedListMixin

from .applications import LeaveApplicationActions
from .processing import LeaveProcessingActions


class LeaveViewSet(
    PaginatedListMixin,
    LeaveApplicationActions,
    LeaveProcessingActions,
    viewsets.ModelViewSet,
):
    queryset = LeaveRequest.objects.all().order_by('-date_applied', '-pk')

    serializer_class = LeaveRequestSerializer

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        try:
            year = int(request.query_params.get('year', ''))
        except (TypeError, ValueError):
            raise ValidationError('Enter a valid calendar year.')
        return Response(calendar_response(year))

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        base_qs = LeaveRequest.objects.select_related(
            'employee',
            'employee__user',
            'employee__school', 'assigned_checker', 'assigned_principal', 'principal_signed_by'
        ).prefetch_related('actions').order_by('-date_applied', '-pk')

        if user.is_superuser:
            return base_qs.all()

        role = user.role
        employee_profile = getattr(user, 'employee_profile', None)

        if role == Role.HR:
            # HR sees all leaves to validate and manage the queue
            return base_qs.all()

        elif role == Role.SUPERINTENDENT:
            # Superintendent only sees leaves forwarded to them, or already approved,
            # or rejected at the Superintendent stage.
            return base_qs.filter(
                Q(status='pending_superintendent') |
                Q(status='approved') |
                Q(status='rejected', rejection_stage='pending_superintendent')
            )

        # For other roles (TEACHING, NON_TEACHING, ADMINISTRATIVE, ACCOUNTANT):
        # They can see their own leaves.
        # If they are a supervisor (Principal/Head Teacher), they can also see leaves of their subordinates.
        if employee_profile:
            scope = (
                Q(employee__user=user) |
                Q(employee__supervisor=employee_profile, workflow='standard') |
                Q(assigned_principal=employee_profile) |
                Q(actions__actor=user)
            )
            return base_qs.filter(scope).distinct()

        return base_qs.filter(employee__user=user)
