from rest_framework import serializers
from ..models import Employee, ProvidentLoan, LoanPayment

class LoanSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), required=False)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')

    class Meta:
        model = ProvidentLoan
        fields = [
            'id', 'employee', 'employee_name', 'loan_amount', 'interest_rate', 
            'term_months', 'monthly_payment', 'total_amount', 'status', 'date_applied'
        ]
        read_only_fields = ['monthly_payment', 'total_amount', 'date_applied']


class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = '__all__'
