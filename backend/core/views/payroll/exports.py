from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from ...models import Payroll, Role
from ...permissions import IsAdminOrHR, IsAccountant, IsSuperintendent
from ...utils.pdf_generator import generate_general_payroll_pdf, generate_disbursement_voucher_pdf


class PayrollExportActions:
    @action(detail=False, methods=['GET'], permission_classes=[IsAccountant | IsSuperintendent | IsAdminOrHR], url_path='export_payroll_sheet')
    def export_payroll_sheet(self, request):
        cutoff = request.query_params.get('cutoff_period') or request.query_params.get('cutoff')
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)

        payrolls = Payroll.objects.filter(cutoff_period=cutoff).order_by('employee__last_name')
        if not payrolls.exists():
            return Response({"detail": f"No payroll records found for cutoff: {cutoff}."}, status=404)

        from django.http import HttpResponse
        pdf_content = generate_general_payroll_pdf(cutoff, payrolls)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"General_Payroll_{cutoff.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['GET'], permission_classes=[IsAccountant | IsSuperintendent | IsAdminOrHR], url_path='export_disbursement_voucher')
    def export_disbursement_voucher(self, request):
        cutoff = request.query_params.get('cutoff_period') or request.query_params.get('cutoff')
        if not cutoff:
            return Response({"detail": "cutoff_period is required."}, status=400)

        payrolls = Payroll.objects.filter(cutoff_period=cutoff).order_by('employee__last_name')
        if not payrolls.exists():
            return Response({"detail": f"No payroll records found for cutoff: {cutoff}."}, status=404)

        from django.http import HttpResponse
        pdf_content = generate_disbursement_voucher_pdf(cutoff, payrolls)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"Disbursement_Voucher_{cutoff.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['GET'], permission_classes=[IsAuthenticated], url_path='export_payslip')
    def export_payslip(self, request, pk=None):
        payroll = self.get_object()
        if not request.user.is_superuser and request.user.role not in [Role.HR, Role.ACCOUNTANT, Role.SUPERINTENDENT]:
            if payroll.employee.user != request.user:
                return Response({"detail": "You do not have permission to view this payslip."}, status=403)

        if payroll.status != 'released':
            return Response({"detail": "Payslip is not yet released."}, status=400)

        from django.http import HttpResponse
        from ...utils.pdf_generator import generate_payslip_pdf

        pdf_content = generate_payslip_pdf(payroll)
        response = HttpResponse(pdf_content, content_type='application/pdf')
        filename = f"Payslip_{payroll.employee.last_name}_{payroll.cutoff_period.replace(' ', '_').replace(',', '')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
