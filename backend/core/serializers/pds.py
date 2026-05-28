from rest_framework import serializers
from ..models.pds import PDSUpload

class PDSUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDSUpload
        fields = '__all__'

class PDSExtractedDataSerializer(serializers.Serializer):
    last_name = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    middle_name = serializers.CharField(required=False, allow_blank=True)
    name_extension = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.CharField(required=False, allow_blank=True)
    place_of_birth = serializers.CharField(required=False, allow_blank=True)
    sex = serializers.CharField(required=False, allow_blank=True)
    civil_status = serializers.CharField(required=False, allow_blank=True)
    height = serializers.CharField(required=False, allow_blank=True)
    weight = serializers.CharField(required=False, allow_blank=True)
    blood_type = serializers.CharField(required=False, allow_blank=True)
    gsis_id = serializers.CharField(required=False, allow_blank=True)
    pagibig_id = serializers.CharField(required=False, allow_blank=True)
    philhealth_no = serializers.CharField(required=False, allow_blank=True)
    sss_no = serializers.CharField(required=False, allow_blank=True)
    tin_no = serializers.CharField(required=False, allow_blank=True)
    agency_employee_no = serializers.CharField(required=False, allow_blank=True)
    citizenship = serializers.CharField(required=False, allow_blank=True)
    residential_address = serializers.CharField(required=False, allow_blank=True)
    permanent_address = serializers.CharField(required=False, allow_blank=True)
    zip_code = serializers.CharField(required=False, allow_blank=True)
    telephone_no = serializers.CharField(required=False, allow_blank=True)
    mobile_no = serializers.CharField(required=False, allow_blank=True)
    email = serializers.CharField(required=False, allow_blank=True)
    spouse_surname = serializers.CharField(required=False, allow_blank=True)
    father_surname = serializers.CharField(required=False, allow_blank=True)
    mother_maiden_name = serializers.CharField(required=False, allow_blank=True)
