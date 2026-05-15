from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ..models import Applicant
from ..serializers import ApplicantSerializer
from ..permissions import IsAdminOrHR

class ApplicantViewSet(viewsets.ModelViewSet):
    queryset = Applicant.objects.all().order_by('-date_applied')
    serializer_class = ApplicantSerializer
    permission_classes = [IsAuthenticated, IsAdminOrHR]
