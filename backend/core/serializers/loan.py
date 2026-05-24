from rest_framework import serializers
from ..models import Employee, ProvidentLoan, LoanPayment, LoanDocument


class LoanDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.ReadOnlyField(source='get_doc_type_display')

    class Meta:
        model = LoanDocument
        fields = ['id', 'loan', 'doc_type', 'doc_type_display', 'file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class LoanSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), required=False)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    co_maker_name_display = serializers.SerializerMethodField()
    purpose_display = serializers.ReadOnlyField(source='get_purpose_display')
    reviewed_by_name = serializers.ReadOnlyField(source='reviewed_by.username')
    documents = LoanDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = ProvidentLoan
        fields = [
            'id', 'employee', 'employee_name',
            'loan_amount', 'interest_rate', 'term_months',
            'monthly_payment', 'total_amount',
            'status', 'date_applied',
            # Application fields
            'purpose', 'purpose_display', 'letter_request',
            'co_maker', 'co_maker_name', 'co_maker_name_display',
            # Review fields
            'remarks', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            # Nested documents
            'documents',
        ]
        read_only_fields = [
            'monthly_payment', 'total_amount', 'date_applied',
            'reviewed_by', 'reviewed_at',
        ]

    def get_co_maker_name_display(self, obj):
        """Return co-maker's name from FK or fallback to co_maker_name field."""
        if obj.co_maker:
            return str(obj.co_maker)
        return obj.co_maker_name or None


class LoanPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanPayment
        fields = '__all__'
