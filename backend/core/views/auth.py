from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['user_id'] = user.id
        token['role'] = user.role
        token['username'] = user.username
        if hasattr(user, 'employee_profile'):
            token['employee_id'] = user.employee_profile.id
        return token

    def validate(self, attrs):
        username = attrs.get('username')
        if username and '@' in username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(email__iexact=username)
                attrs['username'] = user.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        data['id'] = self.user.id
        data['role'] = self.user.role
        data['username'] = self.user.username
        if hasattr(self.user, 'employee_profile'):
            data['employee_id'] = self.user.employee_profile.id
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
