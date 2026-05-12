from django.contrib import admin
from .models import Employee, ProvidentLoan, Payroll, LoanPayment, AuditLog, User


admin.site.register(User)
admin.site.register(Employee)
admin.site.register(ProvidentLoan)
admin.site.register(Payroll)
admin.site.register(LoanPayment)
admin.site.register(AuditLog)