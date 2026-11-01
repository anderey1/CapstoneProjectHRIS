from rest_framework import serializers
from uuid import uuid4
from ..models import LeaveRequest, LeaveAction


class LeaveApprovalSerializer(serializers.Serializer):
    signature = serializers.ImageField(required=False)
    signature_confirmed = serializers.BooleanField(required=False, default=False)
    records_reference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    expected_status = serializers.ChoiceField(choices=LeaveRequest.STATUS_CHOICES, required=False)

    def validate_signature(self, image):
        if image.size > 2 * 1024 * 1024:
            raise serializers.ValidationError('Signature image must be 2 MB or smaller.')
        if image.image.format not in ('PNG', 'JPEG'):
            raise serializers.ValidationError('Upload a PNG or JPEG signature image.')
        if image.image.width * image.image.height > 4_000_000:
            raise serializers.ValidationError('Signature image is too large. Use at most 4 million pixels.')
        extension = 'png' if image.image.format == 'PNG' else 'jpg'
        image.name = f'{uuid4().hex}.{extension}'
        return image


class LeaveActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveAction
        fields = ['id', 'actor_name', 'from_status', 'to_status', 'note', 'created_at', 'signature']

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = serializers.PrimaryKeyRelatedField(read_only=True)
    employee_name = serializers.ReadOnlyField(source='employee.__str__')
    department = serializers.ReadOnlyField(source='employee.department')
    vacation_balance = serializers.ReadOnlyField(source='employee.vacation_leave_balance')
    sick_balance = serializers.ReadOnlyField(source='employee.sick_leave_balance')
    can_approve = serializers.SerializerMethodField()
    actions = LeaveActionSerializer(many=True, read_only=True)
    principal_signer_name = serializers.SerializerMethodField()
    assigned_checker_name = serializers.StringRelatedField(source='assigned_checker', read_only=True)
    assigned_principal_name = serializers.StringRelatedField(source='assigned_principal', read_only=True)

    def get_principal_signer_name(self, obj):
        signer = obj.principal_signed_by
        return (signer.get_full_name() or signer.username) if signer else None

    def get_can_approve(self, obj):
        request = self.context.get('request')
        return bool(request and obj.can_process(request.user))

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
            'rejection_stage',
            'workflow', 'assigned_checker', 'assigned_principal',
            'principal_signature', 'principal_signed_by', 'principal_signed_at',
            'records_reference', 'correction_reason',
        )
