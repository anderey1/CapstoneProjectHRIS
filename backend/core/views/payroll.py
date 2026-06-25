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

class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all().order_by('-date_generated')
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]:
            return Payroll.objects.all().order_by('-date_generated')
        return Payroll.objects.filter(employee__user=user).order_by('-date_generated')

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user, 
            action=f"Deleted payroll: {instance.employee} ({instance.cutoff_period})"
        )
        instance.delete()

    @action(detail=False, methods=['POST'], permission_classes=[IsAccountant])
    def generate(self, request):
        """Generates a payroll record for a specific employee."""
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

        # 2. Calculate Days Worked from Attendance
        days_worked = Decimal('11.0') # Default for semi-monthly if no attendance data found
        
        if start_date and end_date:
            # Count distinct days present/late in the range
            present_days = Attendance.objects.filter(
                employee=employee,
                date__range=(start_date, end_date),
                status__in=['present', 'late']
            ).values('date').distinct().count()
            
            # If we found attendance records, use that count. 
            # Otherwise, assume full attendance (standard for many gov roles unless flagged)
            if present_days > 0:
                days_worked = Decimal(str(present_days))

        # Get employee's basic monthly salary to calculate dynamic deductions
        monthly_salary = employee.salary
        
        # Calculate semi-monthly basic salary based on attendance
        # Formula: (Monthly Salary / 22 standard working days) * days_worked
        daily_rate = monthly_salary / Decimal('22.0')
        calculated_salary = (daily_rate * days_worked).quantize(Decimal('0.01'))

        # 1. SSS Deduction: 4.5% of monthly salary, split per cutoff (capped at 675.00 per cutoff)
        sss_deduction = (monthly_salary * Decimal('0.045')) / Decimal('2.0')
        if sss_deduction > Decimal('675.00'):
            sss_deduction = Decimal('675.00')
        elif sss_deduction < Decimal('0.00'):
            sss_deduction = Decimal('0.00')

        # 2. PhilHealth Deduction: 2.5% of monthly salary, split per cutoff (capped at 500.00 per cutoff)
        philhealth_deduction = (monthly_salary * Decimal('0.025')) / Decimal('2.0')
        if philhealth_deduction > Decimal('500.00'):
            philhealth_deduction = Decimal('500.00')
        elif philhealth_deduction < Decimal('0.00'):
            philhealth_deduction = Decimal('0.00')

        # 3. Pag-IBIG Deduction: 100.00 flat deduction per semi-monthly cutoff
        pagibig_deduction = Decimal('100.00')
        # If monthly salary is extremely small, ensure Pag-IBIG does not exceed 2% of the basic monthly salary
        if monthly_salary < Decimal('5000.00'):
            pagibig_deduction = (monthly_salary * Decimal('0.02')) / Decimal('2.0')

        # 4. Withholding Tax: If basic monthly salary is above 20,833.33 (approx. 250k/year, tax-exempt under TRAIN Law)
        # Apply 15% on the excess amount, divided by 2 for semi-monthly.
        if monthly_salary > Decimal('20833.33'):
            monthly_tax = (monthly_salary - Decimal('20833.33')) * Decimal('0.15')
            tax_deduction = monthly_tax / Decimal('2.0')
        else:
            tax_deduction = Decimal('0.00')

        # Compile deductions (rounded to 2 decimal places for currency accuracy)
        DEDUCTIONS = {
            'sss': sss_deduction.quantize(Decimal('0.01')),
            'philhealth': philhealth_deduction.quantize(Decimal('0.01')),
            'pagibig': pagibig_deduction.quantize(Decimal('0.01')),
            'tax': tax_deduction.quantize(Decimal('0.01'))
        }

        # Fetch active released provident loan to deduct payment
        active_loan = ProvidentLoan.objects.filter(employee=employee, status='released').first()
        loan_deduction = Decimal('0.00')
        
        if active_loan:
            standard_deduction = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
            remaining = active_loan.current_balance
            
            # Cap the deduction at the actual remaining balance
            loan_deduction = min(standard_deduction, remaining)

        # Check if payroll record already exists for the employee for this cutoff.
        # If it exists, update it to reflect the new generation; otherwise, create a new record.
        existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()

        if existing_payroll:
            # Only allow re-generating if in draft
            if existing_payroll.status != 'draft':
                return Response({"detail": f"Cannot re-generate payroll in {existing_payroll.status} status."}, status=400)
            
            payroll = existing_payroll
            payroll.days_worked = days_worked
            payroll.basic_salary = calculated_salary
            payroll.loans = loan_deduction
            payroll.sss = DEDUCTIONS['sss']
            payroll.philhealth = DEDUCTIONS['philhealth']
            payroll.pagibig = DEDUCTIONS['pagibig']
            payroll.tax = DEDUCTIONS['tax']
            payroll.save()
        else:
            payroll = Payroll.objects.create(
                employee=employee,
                cutoff_period=cutoff,
                days_worked=days_worked,
                basic_salary=calculated_salary,
                loans=loan_deduction,
                **DEDUCTIONS
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
                # Important: We only deduct from 'released' loans (funds already disbursed)
                active_loan = ProvidentLoan.objects.filter(employee=payroll.employee, status='released').first()
                if active_loan:
                    LoanPayment.objects.create(loan=active_loan, amount_paid=payroll.loans)
                    AuditLog.objects.create(
                        user=request.user, 
                        action=f"Released payroll loan deduction: {payroll.employee} (₱{payroll.loans})"
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
                
                # 3. Calculate Days Worked
                days_worked = Decimal('11.0')
                if start_date and end_date:
                    present_days = Attendance.objects.filter(
                        employee=employee,
                        date__range=(start_date, end_date),
                        status__in=['present', 'late']
                    ).values('date').distinct().count()
                    if present_days > 0:
                        days_worked = Decimal(str(present_days))
                
                # Calculations
                monthly_salary = employee.salary
                daily_rate = monthly_salary / Decimal('22.0')
                calculated_salary = (daily_rate * days_worked).quantize(Decimal('0.01'))
                
                # SSS
                sss_deduction = (monthly_salary * Decimal('0.045')) / Decimal('2.0')
                if sss_deduction > Decimal('675.00'):
                    sss_deduction = Decimal('675.00')
                elif sss_deduction < Decimal('0.00'):
                    sss_deduction = Decimal('0.00')
                    
                # PhilHealth
                philhealth_deduction = (monthly_salary * Decimal('0.025')) / Decimal('2.0')
                if philhealth_deduction > Decimal('500.00'):
                    philhealth_deduction = Decimal('500.00')
                elif philhealth_deduction < Decimal('0.00'):
                    philhealth_deduction = Decimal('0.00')
                    
                # Pag-IBIG
                pagibig_deduction = Decimal('100.00')
                if monthly_salary < Decimal('5000.00'):
                    pagibig_deduction = (monthly_salary * Decimal('0.02')) / Decimal('2.0')
                    
                # Tax
                if monthly_salary > Decimal('20833.33'):
                    monthly_tax = (monthly_salary - Decimal('20833.33')) * Decimal('0.15')
                    tax_deduction = monthly_tax / Decimal('2.0')
                else:
                    tax_deduction = Decimal('0.00')
                    
                DEDUCTIONS = {
                    'sss': sss_deduction.quantize(Decimal('0.01')),
                    'philhealth': philhealth_deduction.quantize(Decimal('0.01')),
                    'pagibig': pagibig_deduction.quantize(Decimal('0.01')),
                    'tax': tax_deduction.quantize(Decimal('0.01'))
                }
                
                # Fetch active provident loan
                active_loan = ProvidentLoan.objects.filter(employee=employee, status='released').first()
                loan_deduction = Decimal('0.00')
                if active_loan:
                    standard_deduction = (active_loan.monthly_payment / Decimal('2.0')).quantize(Decimal('0.01'))
                    remaining = active_loan.current_balance
                    loan_deduction = min(standard_deduction, remaining)
                    
                existing_payroll = Payroll.objects.filter(employee=employee, cutoff_period=cutoff).first()
                
                if existing_payroll:
                    if existing_payroll.status != 'draft':
                        skipped.append({
                            "employee": str(employee),
                            "reason": f"Payroll already processed ({existing_payroll.status} status)"
                        })
                        continue
                    
                    existing_payroll.days_worked = days_worked
                    existing_payroll.basic_salary = calculated_salary
                    existing_payroll.loans = loan_deduction
                    existing_payroll.sss = DEDUCTIONS['sss']
                    existing_payroll.philhealth = DEDUCTIONS['philhealth']
                    existing_payroll.pagibig = DEDUCTIONS['pagibig']
                    existing_payroll.tax = DEDUCTIONS['tax']
                    existing_payroll.save()
                    updated_count += 1
                else:
                    Payroll.objects.create(
                        employee=employee,
                        cutoff_period=cutoff,
                        days_worked=days_worked,
                        basic_salary=calculated_salary,
                        loans=loan_deduction,
                        **DEDUCTIONS
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
