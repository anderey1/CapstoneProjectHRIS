from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ...models import LoanDocument, AuditLog
from ...serializers import LoanDocumentSerializer


BASE_REQUIRED_DOCS = ['laf', 'letter_request', 'auth_deduct', 'payslip', 'deped_id', 'comaker_payslip']


PURPOSE_DOCS = {
    'medical': ['medical_abstract'],
    'calamity': ['calamity_cert'],
}


OPTIONAL_DOCS = ['appointment', 'service_record', 'contract']


class LoanDocumentActions:
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_document(self, request, pk=None):
        """Upload a required document for a loan application."""
        loan = self.get_object()

        # Only allow uploads for pending loans
        if loan.status != 'pending':
            return Response(
                {"detail": "Documents can only be uploaded for pending loans."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doc_type = request.data.get('doc_type')
        file = request.FILES.get('file')

        if not doc_type:
            return Response({"detail": "doc_type is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not file:
            return Response({"detail": "file is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate doc_type is a valid choice
        valid_types = [choice[0] for choice in LoanDocument.DOC_TYPE_CHOICES]
        if doc_type not in valid_types:
            return Response(
                {"detail": f"Invalid doc_type. Must be one of: {', '.join(valid_types)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = LoanDocumentSerializer(data={
            'loan': loan.id,
            'doc_type': doc_type,
            'file': file,
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            user=request.user,
            action=f"Uploaded {doc_type} for Loan #{loan.id} ({loan.employee})"
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """List all uploaded documents for a loan."""
        loan = self.get_object()
        docs = LoanDocument.objects.filter(loan=loan)
        page = self.paginate_queryset(docs.order_by('doc_type', '-uploaded_at', '-pk'))
        serializer = LoanDocumentSerializer(page, many=True, context={'request': request})
        return self.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def checklist(self, request, pk=None):
        """Return which required documents have been submitted vs. missing."""
        loan = self.get_object()

        # Build required docs list based on purpose
        required = list(BASE_REQUIRED_DOCS)
        purpose_extra = PURPOSE_DOCS.get(loan.purpose, [])
        required.extend(purpose_extra)

        # Get submitted doc types
        submitted_types = set(
            LoanDocument.objects.filter(loan=loan).values_list('doc_type', flat=True)
        )

        # Build checklist
        doc_labels = dict(LoanDocument.DOC_TYPE_CHOICES)
        checklist = []
        for doc_type in required:
            checklist.append({
                'doc_type': doc_type,
                'label': doc_labels.get(doc_type, doc_type),
                'submitted': doc_type in submitted_types,
                'required': True,
            })

        # Add optional docs
        for doc_type in OPTIONAL_DOCS:
            checklist.append({
                'doc_type': doc_type,
                'label': doc_labels.get(doc_type, doc_type),
                'submitted': doc_type in submitted_types,
                'required': False,
            })

        all_required_submitted = all(item['submitted'] for item in checklist if item['required'])

        return Response({
            'loan_id': loan.id,
            'purpose': loan.purpose,
            'all_required_submitted': all_required_submitted,
            'checklist': checklist,
        })

    @action(detail=True, methods=['get'])
    def amortization(self, request, pk=None):
        loan = self.get_object()
        monthly = float(loan.monthly_payment)
        schedule = [
            {"installment_no": i, "amount": monthly, "status": "upcoming" if loan.status == 'approved' else "projected"}
            for i in range(1, loan.term_months + 1)
        ]
        return Response({
            "loan_amount": loan.loan_amount,
            "total_repayable": loan.total_amount,
            "monthly_amortization": loan.monthly_payment,
            "schedule": schedule
        })
