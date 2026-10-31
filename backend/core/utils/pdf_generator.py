"""
PDF Generation Facade
Exports all generators from the modular pdf package.
"""
from .pdf.dtr_pdf import generate_form_48
from .pdf.payroll_pdf import (
    generate_general_payroll_pdf,
    generate_disbursement_voucher_pdf,
    generate_payslip_pdf,
)

__all__ = [
    'generate_form_48',
    'generate_general_payroll_pdf',
    'generate_disbursement_voucher_pdf',
    'generate_payslip_pdf',
]
