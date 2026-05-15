from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import MyTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core app API endpoints
    path('api/', include('core.urls')),

    # JWT Authentication with custom role claims
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]