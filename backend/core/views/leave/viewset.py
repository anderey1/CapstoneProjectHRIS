from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ...models import LeaveRequest, Role
from ...serializers import LeaveRequestSerializer

from .applications import LeaveApplicationActions
from .processing import LeaveProcessingActions


class LeaveViewSet(
    LeaveApplicationActions,
    LeaveProcessingActions,
    viewsets.ModelViewSet,
):
    queryset = LeaveRequest.objects.all().order_by('-date_applied')

    serializer_class = LeaveRequestSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        base_qs = LeaveRequest.objects.select_related(
            'employee',
            'employee__user',
            'employee__school', 'assigned_checker', 'assigned_principal', 'principal_signed_by'
        ).prefetch_related('actions').order_by('-date_applied')

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
                Q(assigned_checker=employee_profile) |
                Q(assigned_principal=employee_profile) |
                Q(actions__actor=user)
            )
            if employee_profile.leave_duty == 'records':
                scope |= Q(workflow='teaching', status='pending_records')
            if employee_profile.leave_duty == 'checker' and employee_profile.school_id:
                scope |= Q(workflow='teaching', status='pending_checking', assigned_checker__isnull=True,
                           employee__school_id=employee_profile.school_id)
            return base_qs.filter(scope).distinct()

        return base_qs.filter(employee__user=user)
