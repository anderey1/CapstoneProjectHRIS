from rest_framework import viewsets, status as http_status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from ..models import Employee, ProvidentLoan, LoanPayment, Payroll, Role, AuditLog, Attendance
from ..serializers import PayrollSerializer
from ..permissions import IsAdminOrHR, IsAccountant, IsSuperintendent
from ..utils import parse_cutoff_dates
from ..utils.pdf_generator import generate_general_payroll_pdf, generate_disbursement_voucher_pdf
from ..services.payroll import PayrollCalculator

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all().order_by('-date_generated')
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = Payroll.objects.select_related(
            'employee',
            'employee__user',
            'employee__school'
        ).order_by('-date_generated')

        if user.is_superuser or user.role in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]:
            return base_qs.all()
        return base_qs.filter(employee__user=user)

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Deleted payroll: {instance.employee} ({instance.cutoff_period})"
        )
        instance.delete()

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

    @action(detail=True, methods=['POST'], permission_classes=[IsSuperintendent])
    def approve(self, request, pk=None):
        """Approves a draft payroll record."""
        payroll = self.get_object()
        if payroll.status != 'draft':
            return Response({"detail": f"Cannot approve payroll in {payroll.status} status."}, status=400)
            
        payroll.status = 'approved'
        payroll.save()
        
        AuditLog.objects.create(user=request.user, action=f"Approved payroll: {payroll.employee} ({payroll.cutoff_period})")
        return Response({"message": "Payroll approved.", "status": "approved"})

    @action(detail=True, methods=['POST'], permission_classes=[IsAccountant], url_path='release')
    def release(self, request, pk=None):
        """Finalizes and releases payroll, recording loan deductions if any."""
        payroll = self.get_object()
        if payroll.status != 'approved':
            return Response({"detail": f"Cannot release payroll in {payroll.status} status. It must be approved first."}, status=400)
            
        with transaction.atomic():
            payroll.status = 'released'
            payroll.date_released = timezone.now()
            payroll.save()

            # Record Loan Repayment if deduction was part of this payroll
            if payroll.loans > 0:
                active_loans = ProvidentLoan.objects.filter(employee=payroll.employee, status='released')
                for active_loan in active_loans:
                    standard_payment = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
                    ded_amount = min(standard_payment, active_loan.current_balance)
                    if ded_amount > 0:
                        LoanPayment.objects.create(loan=active_loan, amount_paid=ded_amount)
                        AuditLog.objects.create(
                            user=request.user, 
                            action=f"Released payroll loan deduction: {payroll.employee} (₱{ded_amount})"
                        )
            
            AuditLog.objects.create(user=request.user, action=f"Released payroll: {payroll.employee} ({payroll.cutoff_period})")
            
        return Response({"message": "Payroll released successfully.", "status": "released"})

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

    @action(detail=False, methods=['POST'], permission_classes=[IsSuperintendent])
    def bulk_approve(self, request):
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period'))
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)
        
        draft_payrolls = Payroll.objects.filter(cutoff_period=cutoff, status='draft')
        if not draft_payrolls.exists():
            return Response({"detail": f"No draft payroll records found for cutoff: {cutoff}."}, status=400)
        
        count = draft_payrolls.count()
        with transaction.atomic():
            draft_payrolls.update(status='approved')
            AuditLog.objects.create(
                user=request.user, 
                action=f"Bulk approved {count} payroll records for cutoff: {cutoff}"
            )
            
        return Response({
            "message": f"Successfully approved {count} payroll records.",
            "count": count
        }, status=200)

    @action(detail=False, methods=['POST'], permission_classes=[IsAccountant])
    def bulk_release(self, request):
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period'))
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)
        
        approved_payrolls = Payroll.objects.filter(cutoff_period=cutoff, status='approved')
        if not approved_payrolls.exists():
            return Response({"detail": f"No approved payroll records found for cutoff: {cutoff}."}, status=400)
        
        count = approved_payrolls.count()
        with transaction.atomic():
            for payroll in approved_payrolls:
                payroll.status = 'released'
                payroll.date_released = timezone.now()
                payroll.save()
                
                # Record Loan Repayment if deduction was part of this payroll
                if payroll.loans > 0:
                    active_loan = ProvidentLoan.objects.filter(employee=payroll.employee, status='released').first()
                    if active_loan:
                        LoanPayment.objects.create(loan=active_loan, amount_paid=payroll.loans)
                        AuditLog.objects.create(
                            user=request.user, 
                            action=f"Released payroll loan deduction: {payroll.employee} (₱{payroll.loans})"
                        )
                        
            AuditLog.objects.create(
                user=request.user, 
                action=f"Bulk released {count} payroll records for cutoff: {cutoff}"
            )
            
        return Response({
            "message": f"Successfully released {count} payroll records.",
            "count": count
        }, status=200)

    @action(detail=False, methods=['GET'], permission_classes=[IsAccountant | IsSuperintendent | IsAdminOrHR], url_path='export_payroll_sheet')
    def export_payroll_sheet(self, request):
        cutoff = request.query_params.get('cutoff_period') or request.query_params.get('cutoff')
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)
            
        payrolls = Payroll.objects.filter(cutoff_period=cutoff).order_by('employee__last_name')
        if not payrolls.exists():
            return Response({"detail": f"No payroll records found for cutoff: {cutoff}."}, status=404)
            
        from django.http import HttpResponse
        pdf_content = generate_general_payroll_pdf(cutoff, payrolls)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"General_Payroll_{cutoff.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['GET'], permission_classes=[IsAccountant | IsSuperintendent | IsAdminOrHR], url_path='export_disbursement_voucher')
    def export_disbursement_voucher(self, request):
        cutoff = request.query_params.get('cutoff_period') or request.query_params.get('cutoff')
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)
            
        payrolls = Payroll.objects.filter(cutoff_period=cutoff).order_by('employee__last_name')
        if not payrolls.exists():
            return Response({"detail": f"No payroll records found for cutoff: {cutoff}."}, status=404)
            
        from django.http import HttpResponse
        pdf_content = generate_disbursement_voucher_pdf(cutoff, payrolls)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"Disbursement_Voucher_{cutoff.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['GET'], permission_classes=[IsAuthenticated], url_path='export_payslip')
    def export_payslip(self, request, pk=None):
        payroll = self.get_object()
        if not request.user.is_superuser and request.user.role not in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT]:
            if payroll.employee.user != request.user:
                return Response({"detail": "You do not have permission to view this payslip."}, status=403)
                
        if payroll.status != 'released':
            return Response({"detail": "Payslip is not yet released."}, status=400)
            
        from django.http import HttpResponse
        from ..utils.pdf_generator import generate_payslip_pdf
        
        pdf_content = generate_payslip_pdf(payroll)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"Payslip_{payroll.employee.last_name}_{payroll.cutoff_period.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
