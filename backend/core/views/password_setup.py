from django.core import signing
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from ..models import Employee, User
from ..services.employee_accounts import SETUP_SALT

class PasswordSetupView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = serializers.CharField().run_validation(request.data.get('token'))
        password = serializers.CharField(trim_whitespace=False).run_validation(request.data.get('password'))
        try:
            data = signing.loads(token, salt=SETUP_SALT, max_age=86400)
            with transaction.atomic():
                employee = Employee.objects.select_for_update().get(pk=data['id'])
                user = User.objects.select_for_update().get(pk=employee.user_id)
                if not user.is_active or user.has_usable_password() or not employee.setup_nonce or str(employee.setup_nonce) != data['nonce']:
                    raise signing.BadSignature()
                validate_password(password, user)
                user.set_password(password)
                user.save(update_fields=['password'])
                employee.setup_nonce = None
                employee.save(update_fields=['setup_nonce'])
        except ValidationError as error:
            return Response({'error': error.messages}, status=400)
        except (signing.BadSignature, Employee.DoesNotExist, User.DoesNotExist, KeyError, ValueError, TypeError):
            return Response({'error': 'This setup link is invalid or expired. Contact HR for a new link.'}, status=400)
        return Response({'message': 'Password set. You can now log in.'})
