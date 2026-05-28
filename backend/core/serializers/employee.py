from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Employee, School, Role
from .pds_details import (
    FamilyMemberSerializer, EducationSerializer, 
    EligibilitySerializer, WorkExperienceSerializer
)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    school_details = SchoolSerializer(source='school', read_only=True)
    
    # Nested PDS Data
    family = FamilyMemberSerializer(many=True, required=False)
    education = EducationSerializer(many=True, required=False)
    eligibilities = EligibilitySerializer(many=True, required=False)
    work_experience = WorkExperienceSerializer(many=True, required=False)
    
    # Handle school ID for input, details for output
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), 
        required=False, 
        allow_null=True
    )
    
    # Write-only fields for user creation
    username = serializers.CharField(write_only=True, required=False, allow_blank=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=Role.choices, default=Role.EMPLOYEE, write_only=True, required=False)

    class Meta:
        model = Employee
        fields = (
            'id', 'user', 'user_details', 'first_name', 'last_name', 'middle_name', 'name_extension',
            'date_of_birth', 'place_of_birth', 'sex', 'civil_status',
            'gsis_id', 'pagibig_id', 'philhealth_no', 'sss_no', 'tin_no', 'agency_employee_no',
            'mobile_no', 'residential_address', 'permanent_address',
            'position', 'department', 'school', 'school_details', 'salary', 'date_hired', 
            'leave_balance',
            'family', 'education', 'eligibilities', 'work_experience',
            'username', 'email', 'password', 'role'
        )
        read_only_fields = ('user',)

    def to_internal_value(self, data):
        # Convert empty strings to None for nullable fields
        data = data.copy()
        if 'school' in data and data['school'] == '':
            data['school'] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        """Creates Employee and its User account using the model manager."""
        from django.db import transaction
        
        # Extract nested data
        family_data = validated_data.pop('family', [])
        education_data = validated_data.pop('education', [])
        eligibility_data = validated_data.pop('eligibilities', [])
        work_data = validated_data.pop('work_experience', [])
        
        user_keys = ['username', 'email', 'password', 'role']
        user_data = {k: validated_data.pop(k, None) for k in user_keys}

        with transaction.atomic():
            # Create employee (and user if data provided)
            if user_data.get('username') and user_data.get('password'):
                employee = Employee.objects.create_with_user(user_data, validated_data)
            else:
                employee = Employee.objects.create(**validated_data)
            
            # Create related PDS records
            from ..models.pds_details import FamilyMember, Education, Eligibility, WorkExperience
            for item in family_data:
                FamilyMember.objects.create(employee=employee, **item)
            for item in education_data:
                Education.objects.create(employee=employee, **item)
            for item in eligibility_data:
                Eligibility.objects.create(employee=employee, **item)
            for item in work_data:
                WorkExperience.objects.create(employee=employee, **item)
            
            return employee
