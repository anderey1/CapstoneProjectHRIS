from rest_framework import serializers
from ..models import Attendance, LeaveRequest

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('date', 'status', 'is_geo_flagged')

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')

    class Meta:
        model = LeaveRequest
        fields = '__all__'
        read_only_fields = ('employee', 'status', 'date_applied')
