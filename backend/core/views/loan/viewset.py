from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from ...models import ProvidentLoan
from ...serializers import LoanSerializer
from ..listing import PaginatedListMixin

from .applications import LoanApplicationActions
from .processing import LoanProcessingActions
from .payments import LoanPaymentActions
from .documents import LoanDocumentActions


class LoanViewSet(
    PaginatedListMixin,
    LoanApplicationActions,
    LoanProcessingActions,
    LoanPaymentActions,
    LoanDocumentActions,
    viewsets.ModelViewSet,
):
    queryset = ProvidentLoan.objects.all().order_by('-date_applied', '-pk')

    serializer_class = LoanSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_qs = ProvidentLoan.objects.select_related(
            'employee',
            'employee__user',
            'co_maker',
            'co_maker__user',
            'reviewed_by'
        ).order_by('-date_applied', '-pk')

        if user.is_management:
            return base_qs.all()
        return base_qs.filter(employee__user=user)
