from rest_framework.decorators import action
from rest_framework.response import Response
from ...models import Employee, Role, AuditLog
from ...permissions import IsAdminOrHRorSuperintendent


class EmployeeLeaveCreditActions:
    @action(detail=False, methods=['POST'], permission_classes=[IsAdminOrHRorSuperintendent])
    def award_yearly_credits(self, request):
        from decimal import Decimal
        from django.db.models import F

        # In DepEd, only non-teaching/administrative personnel accrue 15/15 VL/SL
        # Teaching personnel earn Service Credits/PVP during summer vacation
        non_teaching = Employee.objects.filter(
            user__role__in=[Role.NON_TEACHING, Role.ADMINISTRATIVE, Role.PRINCIPAL, Role.HR, Role.ACCOUNTANT]
        )
        count = non_teaching.count()
        non_teaching.update(
            vacation_leave_balance=F('vacation_leave_balance') + Decimal('15.0'),
            sick_leave_balance=F('sick_leave_balance') + Decimal('15.0')
        )
        AuditLog.objects.create(
            user=request.user,
            action=f"Awarded yearly leave credits (+15 VL/SL) to {count} non-teaching personnel via bulk update."
        )
        return Response({"message": f"Successfully awarded 15 leave credits to {count} non-teaching personnel."})
