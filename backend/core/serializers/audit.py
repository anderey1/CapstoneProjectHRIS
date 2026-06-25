from rest_framework import serializers
from ..models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = '__all__'

    def get_user_name(self, obj):
        if obj.user:
            if hasattr(obj.user, 'employee'):
                emp = obj.user.employee
                if emp.first_name or emp.last_name:
                    return f"{emp.first_name} {emp.last_name}"
            return obj.user.username
        return "System"

    def get_user_role(self, obj):
        if obj.user:
            return obj.user.get_role_display()
        return None

