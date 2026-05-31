from rest_framework import serializers
from ..models import Applicant

class ApplicantSerializer(serializers.ModelSerializer):
    is_rqa_eligible = serializers.ReadOnlyField()

    class Meta:
        model = Applicant
        fields = '__all__'
        read_only_fields = ('date_applied', 'total_score', 'last_status_update', 'is_notified')
