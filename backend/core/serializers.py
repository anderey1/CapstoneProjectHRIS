from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Employee, School, ProvidentLoan, Payroll, LoanPayment, AuditLog, Attendance, Role, LeaveRequest, PerformanceReview, Applicant

User = get_user_model()

# -------------------------
# USER
# -------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']


# -------------------------
# SCHOOL / WORKSTATION
# -------------------------
class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

# -------------------------
# EMPLOYEE
# -------------------------
class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    school_details = SchoolSerializer(source='school', read_only=True)
    username = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True)
    role = serializers.ChoiceField(choices=Role.choices, default=Role.EMPLOYEE, write_only=True)

    class Meta:
        model = Employee
        fields = (
            'id', 'user', 'user_details', 'first_name', 'last_name', 'position', 
            'department', 'school', 'school_details', 'salary', 'date_hired', 
            'sick_leave_balance', 'vacation_leave_balance',
            'username', 'email', 'password', 'role' # Include user fields for creation
        )
        read_only_fields = ('user',)

    def create(self, validated_data):
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        role = validated_data.pop('role')

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=validated_data.get('first_name', ''), # Use employee's first/last for user
            last_name=validated_data.get('last_name', '')
        )

        employee = Employee.objects.create(user=user, **validated_data)
        return employee


# -------------------------
# LOAN
# -------------------------
class LoanSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), required=False)
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = ProvidentLoan
        fields = [
            'id',
            'employee',
            'employee_name',
            'loan_amount',
            'interest_rate',
            'term_months',
            'monthly_payment',
            'total_amount',
            'status',
            'date_applied'
        ]
        read_only_fields = ['monthly_payment', 'total_amount', 'date_applied']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


# -------------------------
# PAYROLL
# -------------------------
class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = Payroll
        fields = '__all__'

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


# -------------------------
# LOAN PAYMENT
# -------------------------
class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = '__all__'


# -------------------------
# AUDIT LOG
# -------------------------
class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

# -------------------------
# ATTENDANCE
# -------------------------
class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('date', 'status', 'is_geo_flagged')

# -------------------------
# LEAVE REQUEST
# -------------------------
class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('employee', 'status', 'date_applied')
# -------------------------
# PERFORMANCE REVIEW
# -------------------------
class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = PerformanceReview
        fields = '__all__'
        read_only_fields = ('ai_summary', 'is_promotion_eligible', 'date_evaluated')

# -------------------------
# APPLICANT
# -------------------------
class ApplicantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Applicant
        fields = '__all__'
        read_only_fields = ('date_applied',)