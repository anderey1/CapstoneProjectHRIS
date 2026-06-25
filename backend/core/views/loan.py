from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import Employee, ProvidentLoan, LoanDocument, LoanPayment, Role, AuditLog
from ..serializers import LoanSerializer, LoanDocumentSerializer, LoanPaymentSerializer
from ..permissions import IsAdminOrHR, IsHR, IsSuperintendent, IsAccountant

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
        if user.is_superuser or user.role in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT, Role.ADMINISTRATIVE]:
            return ProvidentLoan.objects.all().order_by('-date_applied')
        return ProvidentLoan.objects.filter(employee__user=user).order_by('-date_applied')

    def perform_create(self, serializer):
        user = self.request.user
        employee_id = self.request.data.get('employee')
        # 1. Target Employee Identification
        if user.role in [Role.ADMINISTRATIVE, Role.HR] and employee_id:
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
    @action(detail=True, methods=['post'], permission_classes=[IsAccountant])
    def verify(self, request, pk=None):
        """Accountant action to verify documents and mark as ready for superintendent."""
        loan = self.get_object()
        if loan.status != 'pending':
            return Response({"detail": "Only pending loans can be verified."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'verified'
        loan.save()

        AuditLog.objects.create(
            user=request.user, 
            action=f"Verified loan documents for Loan #{loan.id} ({loan.employee})"
        )
        return Response({"message": "Loan documents verified. Sent to superintendent for approval.", "status": "verified"})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperintendent])
    def approve(self, request, pk=None):
        """Superintendent action to approve a verified loan."""
        loan = self.get_object()
        if loan.status != 'verified':
            return Response({"detail": "Only verified loans can be approved by the superintendent."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'approved'
        loan.remarks = request.data.get('remarks', '')
        loan.reviewed_by = request.user
        loan.reviewed_at = timezone.now()
        loan.save()

        AuditLog.objects.create(user=request.user, action=f"Approved Loan: {loan.employee}")
        return Response({"message": "Loan approved.", "status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperintendent | IsAccountant])
    def reject(self, request, pk=None):
        """Rejects a loan. Accountant can reject pending loans, Superintendent can reject verified ones."""
        loan = self.get_object()
        user_role = request.user.role

        if loan.status == 'pending' and user_role != Role.ACCOUNTANT and not request.user.is_superuser:
            return Response({"detail": "Only accountants can reject loans during verification."}, status=status.HTTP_403_FORBIDDEN)
        elif loan.status == 'verified' and user_role != Role.SUPERINTENDENT and not request.user.is_superuser:
            return Response({"detail": "Only superintendents can reject loans during approval."}, status=status.HTTP_403_FORBIDDEN)
        elif loan.status not in ['pending', 'verified']:
            return Response({"detail": "Only pending or verified loans can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

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

        AuditLog.objects.create(user=request.user, action=f"Rejected Loan #{loan.id}: {loan.employee}")
        return Response({"message": "Loan rejected.", "status": "rejected"})

    @action(detail=True, methods=['post'])
    def resubmit(self, request, pk=None):
        """Allows employee to update and resubmit a rejected loan."""
        loan = self.get_object()
        if loan.status != 'rejected':
            return Response({"detail": "Only rejected loans can be resubmitted."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Reset status and clear old remarks
        serializer = self.get_serializer(loan, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(status='pending', remarks='')
        
        AuditLog.objects.create(user=request.user, action=f"Resubmitted Loan #{loan.id}")
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAccountant], url_path='release-funds')
    def release_funds(self, request, pk=None):
        """Accountant action to release money after superintendent approval."""
        loan = self.get_object()
        if loan.status != 'approved':
            return Response({"detail": "Only approved loans can be released."}, status=status.HTTP_400_BAD_REQUEST)

        loan.status = 'released'
        loan.date_granted = timezone.now().date()
        
        # Pull station code from employee school if blank
        if not loan.station_code and loan.employee.school:
            loan.station_code = loan.employee.school.name

        loan.save()

        AuditLog.objects.create(user=request.user, action=f"Released Funds for Loan #{loan.id} ({loan.employee})")
        return Response({"message": "Loan funds released successfully.", "status": "released"})

    @action(detail=True, methods=['post'], permission_classes=[IsAccountant | IsAdminOrHR], url_path='post-payment')
    def post_payment(self, request, pk=None):
        """Allows manual posting of a loan deduction/payment by Accountant or Admin/HR."""
        loan = self.get_object()
        if loan.status not in ['released', 'paid']:
            return Response({"detail": "Payments can only be posted for released/active loans."}, status=status.HTTP_400_BAD_REQUEST)

        amount_paid = request.data.get('amount_paid')
        if not amount_paid:
            return Response({"detail": "amount_paid is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from decimal import Decimal
            amount_paid = Decimal(str(amount_paid))
        except ValueError:
            return Response({"detail": "Invalid amount format."}, status=status.HTTP_400_BAD_REQUEST)

        if amount_paid <= 0:
            return Response({"detail": "Amount paid must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        payment = LoanPayment.objects.create(
            loan=loan,
            amount_paid=amount_paid,
            posted_by=request.user
        )

        AuditLog.objects.create(
            user=request.user,
            action=f"Manually posted payment of ₱{amount_paid} for Loan #{loan.id} ({loan.employee})"
        )

        serializer = LoanSerializer(loan, context={'request': request})
        return Response({
            "message": "Payment posted successfully.",
            "payment": LoanPaymentSerializer(payment).data,
            "loan": serializer.data
        }, status=status.HTTP_201_CREATED)

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
        serializer = LoanDocumentSerializer(docs, many=True, context={'request': request})
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
