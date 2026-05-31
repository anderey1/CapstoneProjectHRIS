from rest_framework import serializers
from ..models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(read_only=True)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')
    vacation_balance = serializers.ReadOnlyField(source='employee.vacation_leave_balance')
    sick_balance = serializers.ReadOnlyField(source='employee.sick_leave_balance')

    # Detail fields should be optional at the serializer level
    location_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    illness_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    other_type_details = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    study_type = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    is_within_philippines = serializers.BooleanField(required=False, default=True)
    is_in_hospital = serializers.BooleanField(required=False, allow_null=True)
    commutation = serializers.CharField(required=False, default='not_requested')
    supporting_document = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = (
            'employee', 'status', 'date_applied', 
            'working_days_applied',
            'disapproval_reason', 'approved_days_with_pay', 
            'approved_days_without_pay', 'approved_others'
        )
