from rest_framework import serializers
from ..models import Employee, ProvidentLoan, LoanPayment, LoanDocument


class LoanDocumentSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.ReadOnlyField(source='get_doc_type_display')

    class Meta:
        model = LoanDocument
        fields = ['id', 'loan', 'doc_type', 'doc_type_display', 'file', 'uploaded_at']
        read_only_fields = ['uploaded_at']


class LoanPaymentSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.ReadOnlyField(source='posted_by.username')

    class Meta:
        model = LoanPayment
        fields = [
            'id', 'loan', 'sequence', 'amount_paid', 
            'principal_paid', 'interest_paid', 'payment_date', 
            'remaining_balance', 'posted_by', 'posted_by_name'
        ]
        read_only_fields = ['payment_date', 'sequence', 'principal_paid', 'interest_paid', 'remaining_balance']


class LoanSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), required=False)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    employee_number = serializers.ReadOnlyField(source='employee.agency_employee_no')
    co_maker_name_display = serializers.SerializerMethodField()
    purpose_display = serializers.ReadOnlyField(source='get_purpose_display')
    reviewed_by_name = serializers.ReadOnlyField(source='reviewed_by.username')
    documents = LoanDocumentSerializer(many=True, read_only=True)
    payments = LoanPaymentSerializer(source='loanpayment_set', many=True, read_only=True)
    interest_receivable = serializers.SerializerMethodField()

    class Meta:
        model = ProvidentLoan
        fields = [
            'id', 'employee', 'employee_name', 'employee_number',
            'loan_amount', 'interest_rate', 'term_months',
            'monthly_payment', 'total_amount', 'interest_receivable',
            'status', 'station_code', 'date_granted', 'date_applied',
            # Application fields
            'purpose', 'purpose_display', 'letter_request',
            'co_maker', 'co_maker_name', 'co_maker_name_display',
            # Review fields
            'remarks', 'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            # Nested items
            'documents', 'payments',
        ]
        read_only_fields = [
            'monthly_payment', 'total_amount', 'date_applied',
            'reviewed_by', 'reviewed_at', 'interest_receivable',
        ]

    def get_co_maker_name_display(self, obj):
        """Return co-maker's name from FK or fallback to co_maker_name field."""
        if obj.co_maker:
            return str(obj.co_maker)
        return obj.co_maker_name or None

    def get_interest_receivable(self, obj):
        """Calculate interest receivable (total amount - principal)."""
        if obj.total_amount and obj.loan_amount:
            return obj.total_amount - obj.loan_amount
        return 0.00
