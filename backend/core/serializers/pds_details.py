from rest_framework import serializers
from ..models.pds_details import FamilyMember, Education, Eligibility, WorkExperience

class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = '__all__'
        extra_kwargs = {'employee': {'required': False}}

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        extra_kwargs = {'employee': {'required': False}}

class EligibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Eligibility
        fields = '__all__'
        extra_kwargs = {'employee': {'required': False}}

class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = '__all__'
        extra_kwargs = {'employee': {'required': False}}
