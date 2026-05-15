from rest_framework import serializers
from ..models import Payroll

class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')

    class Meta:
        model = Payroll
        fields = '__all__'
