from rest_framework import viewsets, status as http_status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from datetime import datetime
from decimal import Decimal
from .models import Employee, ProvidentLoan, LoanPayment, Payroll, Role, Attendance, School, LeaveRequest, PerformanceReview, Applicant, AuditLog
from rest_framework import serializers

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class SchoolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]

from .serializers import EmployeeSerializer, LoanSerializer, AttendanceSerializer, LeaveRequestSerializer, PerformanceReviewSerializer, ApplicantSerializer, PayrollSerializer, AuditLogSerializer
from .permissions import IsAdmin, IsHR, IsSupervisor, IsEmployee, IsAdminOrHR, IsEmployeeOrAdminOrHR
from .utils import validate_attendance_geo, get_attendance_status, generate_hr_summary, generate_performance_summary, generate_daily_qr_token


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrHR]
        return [permission() for permission in permission_classes]

    def get_queryset(self): 
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Employee.objects.all()
        return Employee.objects.filter(user=user)

    def perform_create(self, serializer):
        try:
            instance = serializer.save()
            AuditLog.objects.create(user=self.request.user, action=f"Created employee record for {instance}")
        except Exception as e:
            print(f"ERROR creating employee: {e}")
            raise ValidationError(f"Failed to create employee: {str(e)}")

    def perform_update(self, serializer):
        try:
            instance = serializer.save()
            AuditLog.objects.create(user=self.request.user, action=f"Updated employee record for {instance}")
        except Exception as e:
            print(f"ERROR updating employee: {e}")
            raise ValidationError(f"Failed to update employee: {str(e)}")

    def perform_destroy(self, instance):
        try:
            AuditLog.objects.create(user=self.request.user, action=f"Deleted employee record for {instance}")
            instance.delete()
        except Exception as e:
            print(f"ERROR deleting employee: {e}")
            raise ValidationError(f"Failed to delete employee: {str(e)}")

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def me(self, request):
        if not hasattr(request.user, 'employee_profile'):
            return Response({"detail": "No profile found"}, status=404)
        serializer = self.get_serializer(request.user.employee_profile)
        return Response(serializer.data)

# -------------------------
# ATTENDANCE
# -------------------------
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Attendance.objects.all()
        return Attendance.objects.filter(employee__user=user)

    @action(detail=False, methods=['GET'], permission_classes=[IsAuthenticated])
    def get_daily_qr(self, request):
        try:
            token = generate_daily_qr_token()
            return Response({"token": token, "date": timezone.now().date()})
        except Exception as e:
            print(f"ERROR generating QR: {e}")
            return Response({"detail": "Failed to generate QR code."}, status=400)

    @action(detail=False, methods=['POST'], permission_classes=[IsAuthenticated])
    def scan(self, request):
        try:
            try:
                employee = request.user.employee_profile
            except Exception:
                print("SCAN ERROR: User has no employee profile")
                return Response({"detail": "This user account is not registered as an employee. Attendance features are only available for personnel accounts."}, status=400)

            token = request.data.get('qr_token')
            lat = request.data.get('lat')
            lng = request.data.get('lng')

            if lat is None or lng is None:
                print("SCAN ERROR: Coordinates missing")
                return Response({"detail": "GPS coordinates are required. Please enable location services."}, status=400)

            # Validate QR Token
            expected_token = generate_daily_qr_token()
            if token != expected_token:
                print(f"SCAN ERROR: Token mismatch. Received: {token}, Expected: {expected_token}")
                return Response({"detail": "Invalid or expired QR code."}, status=400)

            if not employee.school:
                print(f"SCAN ERROR: No school for employee {employee}")
                return Response({"detail": "Your profile has no assigned school/office. Please contact HR to set your workstation location for geo-validation."}, status=400)

            is_valid, distance = validate_attendance_geo(
                lat, lng, employee.school.latitude, employee.school.longitude, employee.school.radius_meters
            )
            print(f"DEBUG: Distance={distance}m, Radius={employee.school.radius_meters}m, Valid={is_valid}")

            if not is_valid:
                print(f"SCAN ERROR: Outside perimeter {distance}m")
                return Response({
                    "detail": f"Workstation check-in failed. You are {round(distance, 1)}m away from your assigned workstation. Please scan within the authorized perimeter.",
                    "distance": round(distance, 2)
                }, status=400)

            today = timezone.now().date()
            attendance = Attendance.objects.filter(employee=employee, date=today).first()

            if attendance:
                if attendance.time_out:
                    print(f"SCAN ERROR: Already completed for today {employee}")
                    return Response({"detail": "You have already completed your Time In and Time Out for today."}, status=400)
                
                # Prevent short-interval duplicates (cooldown)
                now = timezone.now()
                time_in_dt = datetime.combine(today, attendance.time_in)
                time_in_dt = timezone.make_aware(time_in_dt)
                
                if (now - time_in_dt).total_seconds() < 10: # 10 seconds for testing/demo
                    print(f"SCAN ERROR: Cooldown active for {employee}")
                    return Response({
                        "detail": "Short-interval scan detected. Please wait at least 10 seconds after Time In before recording Time Out."
                    }, status=400)

                # Perform Time Out
                attendance.time_out = now.time()
                attendance.is_geo_flagged = False # Always valid if reached here
                attendance.save()
                
                return Response({
                    "message": "Time Out recorded successfully.",
                    "status": attendance.status,
                    "is_geo_flagged": False,
                    "time_out": attendance.time_out,
                    "distance": round(distance, 2)
                })

            # Perform Time In
            attendance = Attendance.objects.create(
                employee=employee,
                time_in=timezone.now().time(),
                status=get_attendance_status(timezone.now()),
                latitude=lat,
                longitude=lng,
                is_geo_flagged=False # Always valid if reached here
            )

            return Response({
                "message": "Time In recorded successfully.",
                "status": attendance.status,
                "is_geo_flagged": False,
                "time_in": attendance.time_in,
                "distance": round(distance, 2)
            })
        except Exception as e:
            print(f"CRITICAL SCAN ERROR: {e}")
            return Response({"detail": f"An unexpected error occurred during check-in: {str(e)}"}, status=400)


# -------------------------
# DASHBOARD STATS
# -------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated]) # Allow all authenticated users to see aggregate stats
def dashboard_stats(request):
    return Response({
        "total_employees": Employee.objects.count(),
        "total_loans": ProvidentLoan.objects.count(),
        "approved_loans": ProvidentLoan.objects.filter(status='approved').count(),
    })


# -------------------------
# CHARTS
# -------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def loan_status_chart(request):
    data = ProvidentLoan.objects.values('status').annotate(count=Count('status'))
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_department_chart(request):
    data = Employee.objects.values('department').annotate(count=Count('department'))
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_trends_chart(request):
    data = Attendance.objects.values('status').annotate(count=Count('status'))
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def leave_rate_chart(request):
    data = LeaveRequest.objects.values('leave_type').annotate(count=Count('leave_type'))
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payroll_summary_chart(request):
    from django.db.models import Sum
    data = Payroll.objects.values('cutoff_period').annotate(
        total_net=Sum('net_salary'),
        total_deductions=Sum('total_deductions')
    ).order_by('-cutoff_period')[:6]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def performance_dist_chart(request):
    data = PerformanceReview.objects.values('is_promotion_eligible').annotate(count=Count('id'))
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_ai_summary(request):
    """
    Returns a descriptive summary of system data (non-AI).
    """
    total_employees = Employee.objects.count()
    total_loans = ProvidentLoan.objects.count()
    
    summary = f"Currently managing {total_employees} personnel records and {total_loans} provident loan applications across the division office. Attendance monitoring is active with geo-validation."
    
    return Response({
        "ai_summary": summary
    })




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_detail(request, metric):
    """
    Generic analytics endpoint that routes to specific chart data.
    """
    if metric == 'attendance':
        data = Attendance.objects.values('status').annotate(count=Count('status'))
    elif metric == 'leave':
        data = LeaveRequest.objects.values('leave_type').annotate(count=Count('leave_type'))
    elif metric == 'payroll':
        from django.db.models import Sum
        data = Payroll.objects.values('cutoff_period').annotate(
            total_net=Sum('net_salary'),
            total_deductions=Sum('total_deductions')
        ).order_by('-cutoff_period')[:6]
    elif metric == 'performance':
        data = PerformanceReview.objects.values('is_promotion_eligible').annotate(count=Count('id'))
    elif metric == 'loans':
        data = ProvidentLoan.objects.values('status').annotate(count=Count('status'))
    elif metric == 'departments':
        data = Employee.objects.values('department').annotate(count=Count('department'))
    else:
        return Response({"detail": "Metric not found. Available: attendance, leave, payroll, performance, loans, departments"}, status=404)
    
    return Response(data)

# -------------------------
# LOANS
# -------------------------

class LoanViewSet(viewsets.ModelViewSet):
    queryset = ProvidentLoan.objects.all().order_by('-date_applied')
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return ProvidentLoan.objects.all().order_by('-date_applied')
        return ProvidentLoan.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        try:
            user = self.request.user
            employee_id = self.request.data.get('employee')
            
            # 1. Determine Target Employee
            if user.role in [Role.ADMIN, Role.HR] and employee_id:
                try:
                    employee = Employee.objects.get(id=employee_id)
                except (Employee.DoesNotExist, ValueError):
                    raise ValidationError({"employee": "Selected employee does not exist."})
            else:
                if not hasattr(user, 'employee_profile'):
                    raise ValidationError("You must have an employee profile to apply for a loan.")
                employee = user.employee_profile
            
            # 2. Check for active or pending loans for the target employee
            active_loan = ProvidentLoan.objects.filter(
                employee=employee, 
                status__in=['pending', 'approved']
            ).exists()
            
            if active_loan:
                error_msg = "You already have a pending or active loan." if employee == getattr(user, 'employee_profile', None) else f"Employee {employee} already has a pending or active loan."
                raise ValidationError(error_msg)

            amount = serializer.validated_data.get('loan_amount', 0)
            if amount <= 0:
                raise ValidationError("Loan amount must be greater than zero.")

            instance = serializer.save(employee=employee)
            AuditLog.objects.create(user=user, action=f"Applied for Provident Loan (for {employee}): Amount {instance.loan_amount}")
        except ValidationError as e:
            raise e
        except Exception as e:
            print(f"ERROR applying for loan: {e}")
            raise ValidationError(f"Failed to submit loan application: {str(e)}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        try:
            loan = self.get_object()
            if loan.status != 'pending':
                return Response({"detail": "This loan request has already been processed."}, status=400)
                
            loan.status = 'approved'
            loan.save()
            AuditLog.objects.create(user=request.user, action=f"Approved Provident Loan for {loan.employee} (₱{loan.loan_amount})")
            return Response({"message": "Loan application approved."})
        except Exception as e:
            print(f"ERROR approving loan: {e}")
            return Response({"detail": f"Failed to approve loan: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        try:
            loan = self.get_object()
            if loan.status != 'pending':
                return Response({"detail": "Cannot reject a loan that is already processed."}, status=400)
                
            loan.status = 'rejected'
            loan.save()
            AuditLog.objects.create(user=request.user, action=f"Rejected loan application for {loan.employee}")
            return Response({"message": "Loan application rejected."})
        except Exception as e:
            print(f"ERROR rejecting loan: {e}")
            return Response({"detail": f"Failed to reject loan: {str(e)}"}, status=400)

    @action(detail=True, methods=['get'])
    def amortization(self, request, pk=None):
        try:
            loan = self.get_object()
            schedule = []
            monthly = float(loan.monthly_payment)
            
            for i in range(1, loan.term_months + 1):
                schedule.append({
                    "installment_no": i,
                    "amount": monthly,
                    "status": "upcoming" if loan.status == 'approved' else "projected"
                })
                
            return Response({
                "loan_amount": loan.loan_amount,
                "total_repayable": loan.total_amount,
                "monthly_amortization": loan.monthly_payment,
                "schedule": schedule
            })
        except Exception as e:
            print(f"ERROR calculating amortization: {e}")
            return Response({"detail": "Failed to calculate amortization schedule."}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def pay(self, request, pk=None):
        try:
            loan = self.get_object()
            loan.status = 'paid'
            loan.save()
            AuditLog.objects.create(user=request.user, action=f"Marked loan as paid for {loan.employee}")
            return Response({"message": "Loan marked as paid"})
        except Exception as e:
            print(f"ERROR processing payment: {e}")
            return Response({"detail": "Failed to process payment."}, status=400)

# -------------------------
# LEAVE MANAGEMENT
# -------------------------
class LeaveViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-date_applied')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.ADMIN, Role.HR]:
            return LeaveRequest.objects.all().order_by('-date_applied')
        return LeaveRequest.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        try:
            if not hasattr(self.request.user, 'employee_profile'):
                raise ValidationError("You must have an employee profile to file a leave.")
                
            employee = self.request.user.employee_profile
            start_date = serializer.validated_data['start_date']
            end_date = serializer.validated_data['end_date']
            leave_type = serializer.validated_data['leave_type']
            
            # 1. Date Validation
            if start_date > end_date:
                raise ValidationError("Start date cannot be after end date.")

            # 2. Logic: Vacation must be future
            if leave_type == 'vacation' and start_date < timezone.now().date():
                raise ValidationError("Vacation leave must be applied for in advance. For past absences, file Sick/Emergency leave.")

            # 3. Overlap Check
            overlapping = LeaveRequest.objects.filter(
                employee=employee,
                status__in=['pending', 'approved']
            ).filter(
                Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
            ).exists()
            
            if overlapping:
                raise ValidationError("An overlapping leave request (Pending/Approved) already exists for these dates.")

            # 4. Preliminary Balance Check
            duration = (end_date - start_date).days + 1
            if leave_type == 'sick' and employee.sick_leave_balance < duration:
                raise ValidationError(f"Insufficient Sick Leave. Need: {duration}, Have: {employee.sick_leave_balance}")
            elif leave_type == 'vacation' and employee.vacation_leave_balance < duration:
                raise ValidationError(f"Insufficient Vacation Leave. Need: {duration}, Have: {employee.vacation_leave_balance}")

            instance = serializer.save(employee=employee)
            AuditLog.objects.create(user=self.request.user, action=f"Filed {instance.leave_type} leave: {start_date} to {end_date}")
        except ValidationError as e:
            raise e
        except Exception as e:
            print(f"ERROR filing leave: {e}")
            raise ValidationError(f"Failed to file leave: {str(e)}")

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def approve(self, request, pk=None):
        try:
            leave = self.get_object()
            if leave.status != 'pending':
                return Response({"detail": "This request has already been processed."}, status=400)
                
            employee = leave.employee
            duration = (leave.end_date - leave.start_date).days + 1
            
            if leave.leave_type == 'sick':
                if employee.sick_leave_balance < duration:
                    return Response({"detail": "Insufficient sick leave balance."}, status=400)
                employee.sick_leave_balance -= duration
            elif leave.leave_type == 'vacation':
                if employee.vacation_leave_balance < duration:
                    return Response({"detail": "Insufficient vacation leave balance."}, status=400)
                employee.vacation_leave_balance -= duration
                
            employee.save()
            leave.status = 'approved'
            leave.save()
            AuditLog.objects.create(user=request.user, action=f"Approved leave for {leave.employee} ({duration} days)")
            return Response({"message": "Leave request approved", "days_deducted": duration})
        except Exception as e:
            print(f"ERROR approving leave: {e}")
            return Response({"detail": f"Failed to approve leave: {str(e)}"}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR])
    def reject(self, request, pk=None):
        try:
            leave = self.get_object()
            leave.status = 'rejected'
            leave.save()
            AuditLog.objects.create(user=request.user, action=f"Rejected leave for {leave.employee}")
            return Response({"message": "Leave request rejected"})
        except Exception as e:
            print(f"ERROR rejecting leave: {e}")
            return Response({"detail": f"Failed to reject leave: {str(e)}"}, status=400)

# -------------------------
# PAYROLL
# -------------------------
class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.all().order_by('-date_generated')
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return Payroll.objects.all().order_by('-date_generated')
        return Payroll.objects.filter(employee__user=user).order_by('-date_generated')

    def perform_destroy(self, instance):
        try:
            AuditLog.objects.create(user=self.request.user, action=f"Deleted payroll record for {instance.employee} - Cutoff: {instance.cutoff_period}")
            instance.delete()
        except Exception as e:
            print(f"ERROR deleting payroll: {e}")
            raise ValidationError(f"Failed to delete payroll record: {str(e)}")


# -------------------------
# PAYROLL GENERATION (Manual FBV)
# -------------------------
@api_view(['POST'])
@permission_classes([IsAdminOrHR])
def generate_payroll(request, employee_id):
    try:
        employee = get_object_or_404(Employee, id=employee_id)
        # Frontend sends 'cutoff', not 'cutoff_period'
        cutoff = request.data.get('cutoff', request.data.get('cutoff_period', 'Unknown Cutoff'))

        # Fixed statutory deductions for prototype (per cutoff)
        SSS_DEDUCTION = Decimal('675.00')
        PHILHEALTH_DEDUCTION = Decimal('500.00')
        PAGIBIG_DEDUCTION = Decimal('100.00')
        TAX_DEDUCTION = Decimal('1500.00')

        # Semi-monthly basic salary
        semi_monthly_salary = employee.salary / Decimal('2.0')

        # Check for active loans
        loan = ProvidentLoan.objects.filter(
            employee=employee,
            status='approved'
        ).first()

        loan_deduction = (loan.monthly_payment / Decimal('2.0')) if loan else Decimal('0.00')

        payroll = Payroll.objects.create(
            employee=employee,
            cutoff_period=cutoff,
            basic_salary=semi_monthly_salary,
            sss=SSS_DEDUCTION,
            philhealth=PHILHEALTH_DEDUCTION,
            pagibig=PAGIBIG_DEDUCTION,
            tax=TAX_DEDUCTION,
            loans=loan_deduction
        )

        # 1. Track Loan Payment if deduction exists
        if loan and loan_deduction > 0:
            LoanPayment.objects.create(
                loan=loan,
                amount_paid=loan_deduction
            )
            AuditLog.objects.create(
                user=request.user, 
                action=f"Automatic loan deduction for {employee}: {loan_deduction} (Cutoff: {cutoff})"
            )

        return Response({
            "employee": str(employee),
            "cutoff_period": cutoff,
            "basic_salary": payroll.basic_salary,
            "deductions": {
                "sss": payroll.sss,
                "philhealth": payroll.philhealth,
                "pagibig": payroll.pagibig,
                "tax": payroll.tax,
                "loans": payroll.loans
            },
            "total_deductions": payroll.total_deductions,
            "net_salary": payroll.net_salary
        })
    except Exception as e:
        print(f"ERROR generating payroll: {e}")
        return Response({"detail": f"Failed to generate payroll: {str(e)}"}, status=400)

# -------------------------
# IPCRF (PERFORMANCE REVIEW)
# -------------------------
class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.all().order_by('-date_evaluated')
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role in [Role.ADMIN, Role.HR, Role.SUPERVISOR]:
            return PerformanceReview.objects.all().order_by('-date_evaluated')
        return PerformanceReview.objects.filter(employee__user=user).order_by('-date_evaluated')

    def perform_create(self, serializer):
        try:
            punctuality = serializer.validated_data['punctuality_score']
            quality = serializer.validated_data['quality_score']
            behavior = serializer.validated_data['behavior_score']
            
            # Simple non-AI logic for summary and promotion
            avg_score = (punctuality + quality + behavior) / 3
            
            summary = "Standard performance evaluation based on scoring criteria."
            if avg_score >= 4.5:
                summary = "Excellent performance. Consistently exceeds expectations."
                eligible = True
            elif avg_score >= 3.0:
                summary = "Satisfactory performance. Meets division standards."
                eligible = avg_score >= 4.0 # Simple threshold
            else:
                summary = "Needs improvement. Performance plan recommended."
                eligible = False

            instance = serializer.save(
                ai_summary=summary,
                is_promotion_eligible=eligible
            )
            AuditLog.objects.create(user=self.request.user, action=f"Created IPCRF rating for {instance.employee} - Period: {instance.period}")
        except Exception as e:
            print(f"ERROR creating performance review: {e}")
            raise ValidationError(f"Failed to create performance review: {str(e)}")

    def perform_destroy(self, instance):
        try:
            AuditLog.objects.create(user=self.request.user, action=f"Deleted IPCRF record for {instance.employee} - Period: {instance.period}")
            instance.delete()
        except Exception as e:
            print(f"ERROR deleting performance review: {e}")
            raise ValidationError(f"Failed to delete performance review: {str(e)}")

# -------------------------
# APPLICANT TRACKING
# -------------------------
class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-date_applied')
    serializer_class = ApplicantSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

# -------------------------
# AUDIT LOGS
# -------------------------
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]

    def get_queryset(self):
        # Admins and HR can see everything
        return AuditLog.objects.all().order_by('-timestamp')

