from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import Employee, ProvidentLoan, LoanDocument, Role, AuditLog
from ..serializers import LoanSerializer, LoanDocumentSerializer
from ..permissions import IsAdminOrHR, IsHR, IsSupervisor

# Required documents for every loan application
BASE_REQUIRED_DOCS = ['laf', 'letter_request', 'auth_deduct', 'payslip', 'deped_id', 'comaker_payslip']

# Additional docs based on loan purpose
PURPOSE_DOCS = {
    'medical': ['medical_abstract'],
    'calamity': ['calamity_cert'],
}

# Optional docs (for first-time / co-terminus employees — HR decides)
OPTIONAL_DOCS = ['appointment', 'service_record', 'contract']


class LoanViewSet(viewsets.ModelViewSet):
    queryset = ProvidentLoan.objects.all().order_by('-date_applied')
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in [Role.ADMIN, Role.HR]:
            return ProvidentLoan.objects.all().order_by('-date_applied')
        return ProvidentLoan.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        user = self.request.user
        employee_id = self.request.data.get('employee')
        # 1. Target Employee Identification
        if user.role in [Role.ADMIN, Role.HR] and employee_id:
            employee = get_object_or_404(Employee, id=employee_id)
        else:
            employee = Employee.objects.filter(user=user).first()
            if not employee:
                raise ValidationError({"detail": "You must have an employee profile."})

        # 2. Validation — no duplicate active loans
        if ProvidentLoan.objects.filter(employee=employee, status__in=['pending', 'approved']).exists():
            raise ValidationError({"detail": "A pending or active loan already exists."})

        if serializer.validated_data.get('loan_amount', 0) <= 0:
            raise ValidationError({"detail": "Loan amount must be greater than zero."})

        instance = serializer.save(employee=employee)
        AuditLog.objects.create(
            user=user,
            action=f"Loan Applied for {employee}: ₱{instance.loan_amount} ({instance.get_purpose_display()})"
        )

    # ---------------------------
    # APPROVE / REJECT
    # ---------------------------
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR | IsSupervisor])
    def approve(self, request, pk=None):
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Already processed."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'approved'
        loan.remarks = request.data.get('remarks', '')
        loan.reviewed_by = request.user
        loan.reviewed_at = timezone.now()
        loan.save()

        AuditLog.objects.create(user=request.user, action=f"Approved Loan: {loan.employee}")
        return Response({"message": "Loan approved.", "status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrHR | IsSupervisor])
    def reject(self, request, pk=None):
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Already processed."}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '')
        if not remarks:
            return Response(
                {"detail": "Remarks are required when rejecting a loan."},
                status=status.HTTP_400_BAD_REQUEST
            )

        loan.status = 'rejected'
        loan.remarks = remarks
        loan.reviewed_by = request.user
        loan.reviewed_at = timezone.now()
        loan.save()

        AuditLog.objects.create(user=request.user, action=f"Rejected Loan: {loan.employee}")
        return Response({"message": "Loan rejected.", "status": "rejected"})

    # ---------------------------
    # DOCUMENT UPLOAD
    # ---------------------------
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

    # ---------------------------
    # DOCUMENTS LIST
    # ---------------------------
    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """List all uploaded documents for a loan."""
        loan = self.get_object()
        docs = LoanDocument.objects.filter(loan=loan)
        serializer = LoanDocumentSerializer(docs, many=True)
        return Response(serializer.data)

    # ---------------------------
    # DOCUMENT CHECKLIST
    # ---------------------------
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

    # ---------------------------
    # AMORTIZATION SCHEDULE
    # ---------------------------
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

    # ---------------------------
    # MARK AS PAID
    # ---------------------------
    @action(detail=True, methods=['post'], permission_classes=[IsHR])
    def pay(self, request, pk=None):
        loan = self.get_object()
        loan.status = 'paid'
        loan.save()
        AuditLog.objects.create(user=request.user, action=f"Paid Loan: {loan.employee}")
        return Response({"message": "Marked as paid."})
