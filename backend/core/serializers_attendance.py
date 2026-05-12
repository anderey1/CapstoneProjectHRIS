from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')

    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ('date', 'status', 'is_geo_flagged')
