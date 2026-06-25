from rest_framework import serializers
from ..models import Applicant, ApplicantDocument

class ApplicantDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicantDocument
        fields = ('id', 'document_type', 'file', 'filename', 'uploaded_at')

class ApplicantSerializer(serializers.ModelSerializer):
    is_rqa_eligible = serializers.ReadOnlyField()
    documents = ApplicantDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = Applicant
        fields = '__all__'
        read_only_fields = ('date_applied', 'total_score', 'last_status_update', 'is_notified')

