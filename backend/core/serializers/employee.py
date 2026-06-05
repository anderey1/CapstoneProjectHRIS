from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Employee, School, Role, SalaryGrade
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

class SalaryGradeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryGrade
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    school_details = SchoolSerializer(source='school', read_only=True)
    salary_grade_details = SalaryGradeSerializer(source='salary_grade', read_only=True)
    
    # Nested PDS Data
    family = FamilyMemberSerializer(many=True, required=False)
    education = EducationSerializer(many=True, required=False)
    eligibilities = EligibilitySerializer(many=True, required=False)
    work_experience = WorkExperienceSerializer(many=True, required=False)
    
    # Handle FK IDs for input
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.all(), 
        required=False, 
        allow_null=True
    )
    salary_grade = serializers.PrimaryKeyRelatedField(
        queryset=SalaryGrade.objects.all(),
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
            'umid_id', 'pagibig_id', 'philhealth_no', 'philsys_id', 'tin_no', 'agency_employee_no',
            'mobile_no', 'residential_address', 'permanent_address',
            'position', 'department', 'school', 'school_details', 
            'salary_grade', 'salary_grade_details', 'salary', 'date_hired', 
            'leave_balance', 'vacation_leave_balance', 'sick_leave_balance',
            'face_descriptor',
            'family', 'education', 'eligibilities', 'work_experience',
            'username', 'email', 'password', 'role'
        )
        read_only_fields = ('user',)

    def to_internal_value(self, data):
        # Convert empty strings to None for nullable fields recursively
        data = data.copy()
        
        def clean_nested(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if value == '':
                        obj[key] = None
                    elif isinstance(obj[key], (dict, list)):
                        clean_nested(obj[key])
            elif isinstance(obj, list):
                for item in obj:
                    clean_nested(item)

        clean_nested(data)
        
        # Sanitize salary/numeric fields (strip currency, commas)
        def sanitize_decimal(val):
            if val is None: return None
            if isinstance(val, (int, float)): return val
            if isinstance(val, str):
                cleaned = ''.join(c for c in val if c.isdigit() or c == '.')
                return cleaned if cleaned else None
            return val

        if 'salary' in data:
            data['salary'] = sanitize_decimal(data['salary'])

        # Handle 'present' string for dates in work_experience
        if 'work_experience' in data and isinstance(data['work_experience'], list):
            for work in data['work_experience']:
                if work.get('date_to') == 'present':
                    work['date_to'] = None
                    work['is_present'] = True
                if 'monthly_salary' in work:
                    work['monthly_salary'] = sanitize_decimal(work['monthly_salary'])
        
        # Handle 'present' string for dates in education (though it's CharField now, good to be safe)
        if 'education' in data and isinstance(data['education'], list):
            for edu in data['education']:
                if edu.get('period_to') == 'present':
                    edu['period_to'] = 'present' # Education models use CharField for these

        return super().to_internal_value(data)

    def create(self, validated_data):
        """Creates Employee and its User account using the model manager."""
        from django.db import transaction
        import logging
        logger = logging.getLogger(__name__)
        
        # Extract nested data
        family_data = validated_data.pop('family', [])
        education_data = validated_data.pop('education', [])
        eligibility_data = validated_data.pop('eligibilities', [])
        work_data = validated_data.pop('work_experience', [])
        
        user_keys = ['username', 'email', 'password', 'role']
        user_data = {k: validated_data.pop(k, None) for k in user_keys}

        try:
            with transaction.atomic():
                # Create employee (and user if enough data provided)
                # Ensure username and password are present and not empty strings (already None via clean_nested)
                if user_data.get('username') and user_data.get('password'):
                    employee = Employee.objects.create_with_user(user_data, validated_data)
                else:
                    employee = Employee.objects.create(**validated_data)
                
                # Create related PDS records
                self._save_nested_data(employee, family_data, education_data, eligibility_data, work_data)
                
                return employee
        except Exception as e:
            logger.error(f"Error creating employee: {str(e)}")
            raise serializers.ValidationError({"detail": str(e)})

    def update(self, instance, validated_data):
        """Updates Employee and nested PDS sections."""
        from django.db import transaction
        import logging
        logger = logging.getLogger(__name__)

        # Extract nested data
        family_data = validated_data.pop('family', None)
        education_data = validated_data.pop('education', None)
        eligibility_data = validated_data.pop('eligibilities', None)
        work_data = validated_data.pop('work_experience', None)

        try:
            with transaction.atomic():
                # Update employee fields
                for attr, value in validated_data.items():
                    setattr(instance, attr, value)
                instance.save()

                # Update nested data if provided (replace strategy)
                if any(d is not None for d in [family_data, education_data, eligibility_data, work_data]):
                    if family_data is not None:
                        instance.family.all().delete()
                    if education_data is not None:
                        instance.education.all().delete()
                    if eligibility_data is not None:
                        instance.eligibilities.all().delete()
                    if work_data is not None:
                        instance.work_experience.all().delete()
                    
                    self._save_nested_data(
                        instance, 
                        family_data or [], 
                        education_data or [], 
                        eligibility_data or [], 
                        work_data or []
                    )

                return instance
        except Exception as e:
            logger.error(f"Error updating employee: {str(e)}")
            raise serializers.ValidationError({"detail": str(e)})

    def _save_nested_data(self, employee, family_data, education_data, eligibility_data, work_data):
        """Helper to create nested records."""
        from ..models.pds_details import FamilyMember, Education, Eligibility, WorkExperience
        
        # Helper to remove 'employee' and 'id' if they somehow got into validated data
        def clean_item(item):
            # Convert to dict if it's an OrderedDict
            if hasattr(item, 'items'):
                item = dict(item)
            item.pop('employee', None)
            item.pop('id', None)
            return item
        
        for item in family_data:
            FamilyMember.objects.create(employee=employee, **clean_item(item))
        for item in education_data:
            Education.objects.create(employee=employee, **clean_item(item))
        for item in eligibility_data:
            Eligibility.objects.create(employee=employee, **clean_item(item))
        for item in work_data:
            WorkExperience.objects.create(employee=employee, **clean_item(item))
