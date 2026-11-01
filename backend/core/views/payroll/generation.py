from rest_framework import status as http_status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from ...models import Employee, Payroll, AuditLog, Attendance
from ...permissions import IsAccountant
from ...utils import parse_cutoff_dates
from ...services.payroll import PayrollCalculator


class PayrollGenerationActions:
    @action(detail=False, methods=['POST'], permission_classes=[IsAccountant])
    def generate(self, request):
        """Generates a payroll record for a specific employee using PayrollCalculator."""
        employee_id = request.data.get('employee_id')
        if not employee_id:
            return Response({"detail": "employee_id is required."}, status=400)

        employee = get_object_or_404(Employee, id=employee_id)

        # Validation: Employee must have a salary set
        if employee.salary is None:
            return Response({
                "detail": f"Employee {employee} has no salary set. Please set a salary in their profile before generating payroll."
            }, status=400)

        cutoff = request.data.get('cutoff', request.data.get('cutoff_period', 'Unknown Cutoff'))
        start_date, end_date = parse_cutoff_dates(cutoff)

        # 1. Verification: Ensure all DTR records in cutoff are approved
        if start_date and end_date:
            unapproved_count = Attendance.objects.filter(
                employee=employee,
                date__range=(start_date, end_date),
                is_dtr_approved=False
            ).count()

            if unapproved_count > 0:
                return Response({
                    "detail": f"Cannot generate payroll. {unapproved_count} attendance records in this cutoff are not yet approved by HR."
                }, status=400)

        # 2. Compute via PayrollCalculator service
        calc = PayrollCalculator.compute(employee, cutoff, start_date, end_date)

        # Check if payroll record already exists for the employee for this cutoff.
        existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()

        if existing_payroll:
            # Only allow re-generating if in draft
            if existing_payroll.status != 'draft':
                return Response({"detail": f"Cannot re-generate payroll in {existing_payroll.status} status."}, status=400)

            payroll = existing_payroll
            for field, val in calc.items():
                setattr(payroll, field, val)
            payroll.save()
        else:
            payroll = Payroll.objects.create(
                employee=employee,
                cutoff_period=cutoff,
                **calc
            )

        serializer = self.get_serializer(payroll)
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)

    @action(detail=False, methods=['POST'], permission_classes=[IsAccountant])
    def bulk_generate(self, request):
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period'))
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)

        start_date, end_date = parse_cutoff_dates(cutoff)

        employees = Employee.objects.filter(user__is_active=True)
        generated_count = 0
        updated_count = 0
        skipped = []

        with transaction.atomic():
            for employee in employees:
                # 1. Salary check
                if employee.salary is None:
                    skipped.append({
                        "employee": str(employee),
                        "reason": "No salary set on profile"
                    })
                    continue

                # 2. Check for unapproved DTR records
                if start_date and end_date:
                    unapproved_count = Attendance.objects.filter(
                        employee=employee,
                        date__range=(start_date, end_date),
                        is_dtr_approved=False
                    ).count()

                    if unapproved_count > 0:
                        skipped.append({
                            "employee": str(employee),
                            "reason": f"{unapproved_count} unapproved DTR record(s)"
                        })
                        continue

                # 3. Compute via PayrollCalculator service
                calc = PayrollCalculator.compute(employee, cutoff, start_date, end_date)

                existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()

                if existing_payroll:
                    if existing_payroll.status != 'draft':
                        skipped.append({
                            "employee": str(employee),
                            "reason": f"Payroll already processed ({existing_payroll.status} status)"
                        })
                        continue

                    for field, val in calc.items():
                        setattr(existing_payroll, field, val)
                    existing_payroll.save()
                    updated_count += 1
                else:
                    Payroll.objects.create(
                        employee=employee,
                        cutoff_period=cutoff,
                        **calc
                    )
                    generated_count += 1

        AuditLog.objects.create(
            user=request.user,
            action=f"Bulk generated payroll for cutoff {cutoff}: generated {generated_count}, updated {updated_count}, skipped {len(skipped)}"
        )

        return Response({
            "message": "Bulk payroll generation complete.",
            "generated": generated_count,
            "updated": updated_count,
            "skipped": skipped
        }, status=200)
