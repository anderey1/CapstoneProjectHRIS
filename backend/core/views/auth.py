from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['username'] = user.username
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
        data['role'] = self.user.role
        data['username'] = self.user.username
        return data

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
