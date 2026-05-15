from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Employee, School, Role

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
            'id', 'user', 'user_details', 'first_name', 'last_name', 'position', 
            'department', 'school', 'school_details', 'salary', 'date_hired', 
            'sick_leave_balance', 'vacation_leave_balance',
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
        user_keys = ['username', 'email', 'password', 'role']
        user_data = {k: validated_data.pop(k, None) for k in user_keys}

        # Only create a user if at least username and password are provided
        if user_data.get('username') and user_data.get('password'):
            return Employee.objects.create_with_user(user_data, validated_data)
        
        return super().create(validated_data)
