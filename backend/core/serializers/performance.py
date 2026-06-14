from rest_framework import serializers
from ..models import PerformanceReview, Employee

class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), required=False)

    class Meta:
        model = PerformanceReview
        fields = '__all__'
        read_only_fields = ('ai_summary', 'is_promotion_eligible', 'date_evaluated')
