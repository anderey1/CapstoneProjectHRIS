from rest_framework import serializers
from ..models import LeaveRequest, Role

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(read_only=True)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')
    vacation_balance = serializers.ReadOnlyField(source='employee.vacation_leave_balance')
    sick_balance = serializers.ReadOnlyField(source='employee.sick_leave_balance')
    can_approve = serializers.SerializerMethodField()

    def get_can_approve(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return False
        user = request.user
        status = obj.status
        if status == 'pending_supervisor':
            employee_profile = getattr(user, 'employee_profile', None)
            is_supervisor = employee_profile and obj.employee.supervisor_id == employee_profile.id
            is_admin = user.role == Role.ADMINISTRATIVE or user.is_superuser
            return bool(is_supervisor or is_admin)
        elif status == 'pending_superintendent':
            return user.role == Role.SUPERINTENDENT
        elif status == 'pending_hr':
            return user.role == Role.HR
        return False

    # Detail fields should be optional at the serializer level
    location_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    illness_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    other_type_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    study_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_within_philippines = serializers.BooleanField(required=False, default=True)
    is_in_hospital = serializers.BooleanField(required=False, allow_null=True)
    commutation = serializers.CharField(required=False, default='not_requested')
    supporting_document = serializers.FileField(required=False, allow_null=True)
    travel_authority_document = serializers.FileField(required=False, allow_null=True)
    clearance_document = serializers.FileField(required=False, allow_null=True)
    maternity_notice_allocation = serializers.FileField(required=False, allow_null=True)
    paternity_marriage_contract = serializers.FileField(required=False, allow_null=True)
    vawc_medical_cert = serializers.FileField(required=False, allow_null=True)
    rehab_letter_request = serializers.FileField(required=False, allow_null=True)
    rehab_police_report = serializers.FileField(required=False, allow_null=True)
    rehab_concurrence = serializers.FileField(required=False, allow_null=True)
    women_special_histopath = serializers.FileField(required=False, allow_null=True)
    women_special_operative_technique = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = (
            'employee', 'status', 'date_applied', 
            'working_days_applied',
            'disapproval_reason', 'approved_days_with_pay', 
            'approved_days_without_pay', 'approved_others',
            'rejection_stage'
        )
