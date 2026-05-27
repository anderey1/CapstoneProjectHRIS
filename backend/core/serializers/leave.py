from rest_framework import serializers
from ..models import LeaveRequest

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(read_only=True)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('employee', 'status', 'date_applied')
