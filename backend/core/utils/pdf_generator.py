from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from django.http import HttpResponse
from django.conf import settings
from io import BytesIO
from datetime import date, timedelta
import calendar
from reportlab.lib import colors
import os


def generate_form_48(employee, month_str, attendance_records, cutoff=None):
    """
    Generates a Civil Service Form 48 (DTR) PDF.
    Two cards per A4 page.
    If cutoff is 1, both show 1-15.
    If cutoff is 2, both show 16-end.
    If cutoff is 'split', card 1 shows 1-15, card 2 shows 16-end.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=10, alignment=1, spaceAfter=2)
    header_style = ParagraphStyle('HeaderStyle', parent=styles['Normal'], fontSize=8, alignment=1)
    
    # Parse month
    year, month_num = map(int, month_str.split('-'))
    month_name = calendar.month_name[month_num]
    num_days = calendar.monthrange(year, month_num)[1]

    # Query approved leave requests that overlap with the target month
    from ..models import LeaveRequest
    approved_leaves = LeaveRequest.objects.filter(
        employee=employee,
        status='approved',
        start_date__lte=date(year, month_num, num_days),
        end_date__gte=date(year, month_num, 1)
    )
    
    # Build a set of leave days for easy lookup
    leave_days = set()
    for lv in approved_leaves:
        current = max(lv.start_date, date(year, month_num, 1))
        limit = min(lv.end_date, date(year, month_num, num_days))
        while current <= limit:
            leave_days.add(current.day)
            current += timedelta(days=1)
    
    def create_dtr_card(start_day=1, end_day=31):
        card_elements = []
        card_elements.append(Paragraph("Civil Service Form 48", styles['Normal']))
        card_elements.append(Paragraph("<b>DAILY TIME RECORD</b>", title_style))
        card_elements.append(Spacer(1, 10))
        
        card_elements.append(Paragraph(f"<u>{employee.first_name} {employee.last_name}</u>", title_style))
        card_elements.append(Paragraph("(Name)", header_style))
        card_elements.append(Spacer(1, 5))
        
        cutoff_text = ""
        if start_day == 1 and end_day == 15: cutoff_text = " (1st Cutoff)"
        elif start_day == 16: cutoff_text = " (2nd Cutoff)"
        
        card_elements.append(Paragraph(f"For the month of {month_name} {year}{cutoff_text}", header_style))
        card_elements.append(Spacer(1, 10))
        
        # Table Header
        data = [
            ['Day', 'AM', '', 'PM', '', 'Overtime', ''],
            ['', 'Arrival', 'Departure', 'Arrival', 'Departure', 'Arrival', 'Departure']
        ]
        
        # Map attendance records to days
        record_map = {r.date.day: r for r in attendance_records}
        
        span_commands = [
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7),
            ('GRID', (0,0), (-1,-2), 0.5, colors.black),
            ('SPAN', (1,0), (2,0)),
            ('SPAN', (3,0), (4,0)),
            ('SPAN', (5,0), (6,0)),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]
        
        # Form always has 31 rows (Civil Service standard)
        for day in range(1, 32):
            row_idx = len(data)
            if day >= start_day and day <= end_day and day <= num_days:
                if day in leave_days:
                    data.append([str(day), 'ON LEAVE', '', '', '', '', ''])
                    span_commands.append(('SPAN', (1, row_idx), (6, row_idx)))
                    span_commands.append(('FONTNAME', (1, row_idx), (1, row_idx), 'Helvetica-Bold'))
                else:
                    rec = record_map.get(day)
                    data.append([
                        str(day),
                        rec.am_in.strftime("%I:%M %p") if rec and rec.am_in else '',
                        rec.am_out.strftime("%I:%M %p") if rec and rec.am_out else '',
                        rec.pm_in.strftime("%I:%M %p") if rec and rec.pm_in else '',
                        rec.pm_out.strftime("%I:%M %p") if rec and rec.pm_out else '',
                        rec.ot_in.strftime("%I:%M %p") if rec and rec.ot_in else '',
                        rec.ot_out.strftime("%I:%M %p") if rec and rec.ot_out else ''
                    ])
            else:
                data.append([str(day), '', '', '', '', '', ''])
                
        data.append(['TOTAL', '', '', '', '', '', ''])
        
        t = Table(data, colWidths=[0.4*inch, 0.55*inch, 0.55*inch, 0.55*inch, 0.55*inch, 0.55*inch, 0.55*inch])
        t.setStyle(TableStyle(span_commands))
        
        # Check for approval info (from first record in range as proxy)
        is_approved = any(r.is_dtr_approved for r in attendance_records if start_day <= r.date.day <= end_day)
        approver = next((r.dtr_approved_by for r in attendance_records if r.is_dtr_approved), None)
        approval_date = next((r.dtr_approved_at for r in attendance_records if r.is_dtr_approved), None)

        card_elements.append(t)
        card_elements.append(Spacer(1, 10))
        card_elements.append(Paragraph("I certify on my honor that the above is true and correct report of the hours of work performed...", header_style))
        card_elements.append(Spacer(1, 10))
        
        if is_approved:
            sig_elements = []
            # Try to use e-signature image if it exists
            if employee.e_signature:
                try:
                    sig_path = employee.e_signature.path
                    if os.path.exists(sig_path):
                        img = Image(sig_path, width=1.2*inch, height=0.4*inch)
                        sig_elements.append([img])
                    else:
                        sig_elements.append([Paragraph("<b>ELECTRONICALLY SIGNED</b>", title_style)])
                except Exception:
                    sig_elements.append([Paragraph("<b>ELECTRONICALLY SIGNED</b>", title_style)])
            else:
                sig_elements.append([Paragraph("<b>ELECTRONICALLY SIGNED</b>", title_style)])
                
            # Add underlined name below signature/stamp
            sig_elements.append([Paragraph(f"<u><b>{employee.first_name} {employee.last_name}</b></u>", title_style)])
            sig_elements.append([Paragraph("Official or Employee", header_style)])
            
            # Create a nested table for the signature area covering FULL card width
            sig_table = Table(sig_elements, colWidths=[3.7*inch])
            sig_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            card_elements.append(sig_table)
            
            card_elements.append(Spacer(1, 15))
            
            # Centered Verification Section covering FULL card width
            approver_name = f"{approver.first_name} {approver.last_name}" if approver else "System Administrator"
            approval_ts = approval_date.strftime("%Y-%m-%d %H:%M") if approval_date else "N/A"
            
            verify_elements = [
                [Paragraph("<b>VERIFIED BY:</b>", header_style)],
                [Paragraph(f"<u><b>{approver_name}</b></u>", title_style)],
                [Paragraph(f"Approved on {approval_ts}", header_style)]
            ]
            
            verify_table = Table(verify_elements, colWidths=[3.7*inch])
            verify_table.setStyle(TableStyle([
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                ('LEFTPADDING', (0,0), (-1,-1), 0),
                ('RIGHTPADDING', (0,0), (-1,-1), 0),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            card_elements.append(verify_table)
        else:
            card_elements.append(Paragraph("__________________________", title_style))
            card_elements.append(Paragraph("Official or Employee", header_style))
            card_elements.append(Spacer(1, 10))
            card_elements.append(Paragraph("__________________________", title_style))
            card_elements.append(Paragraph("Verified as to prescribed hours", header_style))
        
        return card_elements

    # Determine Card ranges
    if cutoff == '1':
        card1_range = (1, 15)
        card2_range = (1, 15)
    elif cutoff == '2':
        card1_range = (16, 31)
        card2_range = (16, 31)
    elif cutoff == 'split':
        card1_range = (1, 15)
        card2_range = (16, 31)
    else: # Default: Both show full month
        card1_range = (1, 31)
        card2_range = (1, 31)

    card1 = create_dtr_card(*card1_range)
    card2 = create_dtr_card(*card2_range)
    
    main_table_data = [[card1, card2]]
    main_table = Table(main_table_data, colWidths=[3.7*inch, 3.7*inch])
    elements.append(main_table)
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_general_payroll_pdf(cutoff_period, payrolls):
    from reportlab.lib.pagesizes import A4, landscape
    from decimal import Decimal
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=20, leftMargin=20, topMargin=20, bottomMargin=20)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold', alignment=1, spaceAfter=2)
    subtitle_style = ParagraphStyle('SubtitleStyle', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold', alignment=1, spaceAfter=15)
    cell_style = ParagraphStyle('CellStyle', parent=styles['Normal'], fontSize=7, alignment=1)
    cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=7, fontName='Helvetica-Bold', alignment=1)
    
    elements.append(Paragraph("DEPARTMENT OF EDUCATION - DIVISION OF LUCENA CITY", title_style))
    elements.append(Paragraph(f"GENERAL PAYROLL SHEET - FOR PERIOD: {cutoff_period.upper()}", subtitle_style))
    
    # Table Header
    headers = [
        'No.', 'Employee Name', 'Position / Station', 'Gross Pay', 
        'SSS/GSIS', 'PhilHealth', 'Pag-IBIG', 'Tax', 'Loans', 
        'Total Deduct.', 'Net Pay', 'Signature / Remarks'
    ]
    
    data = [headers]
    total_gross = Decimal('0.00')
    total_sss = Decimal('0.00')
    total_philhealth = Decimal('0.00')
    total_pagibig = Decimal('0.00')
    total_tax = Decimal('0.00')
    total_loans = Decimal('0.00')
    total_deductions = Decimal('0.00')
    total_net = Decimal('0.00')
    
    for idx, p in enumerate(payrolls, 1):
        total_gross += p.basic_salary
        total_sss += p.sss
        total_philhealth += p.philhealth
        total_pagibig += p.pagibig
        total_tax += p.tax
        total_loans += p.loans
        total_deductions += p.total_deductions
        total_net += p.net_salary
        
        sig_text = "ELECTRONICALLY SIGNED" if p.status in ['approved', 'released'] else "__________________"
        
        data.append([
            str(idx),
            f"{p.employee.first_name} {p.employee.last_name}",
            f"{p.employee.position or 'Staff'}\n({p.employee.school.name if p.employee.school else 'Main Office'})",
            f"Php {p.basic_salary:,.2f}",
            f"Php {p.sss:,.2f}",
            f"Php {p.philhealth:,.2f}",
            f"Php {p.pagibig:,.2f}",
            f"Php {p.tax:,.2f}",
            f"Php {p.loans:,.2f}",
            f"Php {p.total_deductions:,.2f}",
            f"Php {p.net_salary:,.2f}",
            sig_text
        ])
        
    # Totals Row
    data.append([
        'TOTAL', '', '',
        f"Php {total_gross:,.2f}",
        f"Php {total_sss:,.2f}",
        f"Php {total_philhealth:,.2f}",
        f"Php {total_pagibig:,.2f}",
        f"Php {total_tax:,.2f}",
        f"Php {total_loans:,.2f}",
        f"Php {total_deductions:,.2f}",
        f"Php {total_net:,.2f}",
        ''
    ])
    
    # Col widths
    col_widths = [0.35*inch, 1.35*inch, 1.25*inch, 0.9*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.9*inch, 0.9*inch, 1.25*inch]
    
    formatted_data = []
    for r_idx, row in enumerate(data):
        formatted_row = []
        for c_idx, val in enumerate(row):
            if r_idx == 0:
                formatted_row.append(Paragraph(f"<b>{val}</b>", cell_bold))
            elif r_idx == len(data) - 1:
                formatted_row.append(Paragraph(f"<b>{val}</b>", cell_bold))
            else:
                if c_idx == 1: # Name Left-aligned
                    formatted_row.append(Paragraph(val, ParagraphStyle('LeftCell', parent=cell_style, alignment=0)))
                elif c_idx == 11 and val != "ELECTRONICALLY SIGNED": # Signature line
                    formatted_row.append(Paragraph(val, ParagraphStyle('SigCell', parent=cell_style, alignment=1, fontSize=6)))
                elif c_idx == 11:
                    formatted_row.append(Paragraph(f"<b>{val}</b>", ParagraphStyle('SigCellBold', parent=cell_bold, alignment=1, fontSize=6, textColor=colors.HexColor('#0038A8'))))
                else:
                    formatted_row.append(Paragraph(val, cell_style))
        formatted_data.append(formatted_row)
        
    t = Table(formatted_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F5F5F5')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#EAEAEA')),
        ('SPAN', (0,-1), (2,-1)),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    
    elements.append(t)
    elements.append(Spacer(1, 20))
    
    sig_data = [
        [
            Paragraph("<b>PREPARED BY:</b>", cell_bold),
            Paragraph("<b>CHECKED BY:</b>", cell_bold),
            Paragraph("<b>CERTIFIED CORRECT BY:</b>", cell_bold),
            Paragraph("<b>APPROVED BY:</b>", cell_bold)
        ],
        [
            Spacer(1, 20),
            Spacer(1, 20),
            Spacer(1, 20),
            Spacer(1, 20)
        ],
        [
            Paragraph("<u><b>ACCOUNTANT / PAYROLL OFFICER</b></u>", cell_bold),
            Paragraph("<u><b>BUDGET OFFICER</b></u>", cell_bold),
            Paragraph("<u><b>ADMINISTRATIVE OFFICER</b></u>", cell_bold),
            Paragraph("<u><b>SCHOOLS DIVISION SUPERINTENDENT</b></u>", cell_bold)
        ],
        [
            Paragraph("Accounting Unit", cell_style),
            Paragraph("Budget Office", cell_style),
            Paragraph("Administrative Unit", cell_style),
            Paragraph("Office of the Superintendent", cell_style)
        ]
    ]
    
    sig_table = Table(sig_data, colWidths=[2.0*inch, 2.0*inch, 2.0*inch, 2.0*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    
    elements.append(sig_table)
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_disbursement_voucher_pdf(cutoff_period, payrolls):
    from reportlab.lib.pagesizes import A4
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold', alignment=1, spaceAfter=2)
    body_style = ParagraphStyle('BodyStyle', parent=styles['Normal'], fontSize=9, spaceBefore=4, spaceAfter=4)
    body_bold = ParagraphStyle('BodyBold', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold')
    
    elements.append(Paragraph("<b>DEPARTMENT OF EDUCATION - DIVISION OF LUCENA CITY</b>", title_style))
    elements.append(Paragraph("<b>DISBURSEMENT VOUCHER</b>", ParagraphStyle('DVTitle', parent=title_style, fontSize=14, spaceBefore=5)))
    elements.append(Spacer(1, 10))
    
    total_net = sum(p.net_salary for p in payrolls)
    
    dv_info = [
        [Paragraph("<b>Mode of Payment:</b>", body_bold), Paragraph("[X] LBP-ATM  [ ] Check  [ ] Others", body_style)],
        [Paragraph("<b>Payee:</b>", body_bold), Paragraph(f"DepEd Lucena Division Employees (General Payroll - {cutoff_period})", body_style)],
        [Paragraph("<b>Station/Office:</b>", body_bold), Paragraph("Division of Lucena City", body_style)]
    ]
    
    t_info = Table(dv_info, colWidths=[1.5*inch, 5.0*inch])
    t_info.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    
    elements.append(t_info)
    elements.append(Spacer(1, 10))
    
    particulars_data = [
        [Paragraph("<b>Particulars</b>", body_bold), Paragraph("<b>Amount (Php)</b>", body_bold)],
        [
            Paragraph(f"To payment of semi-monthly salaries of teaching and non-teaching personnel for the period of <b>{cutoff_period}</b> per attached approved General Payroll Sheet.", body_style),
            Paragraph(f"<b>Php {total_net:,.2f}</b>", ParagraphStyle('AmtStyle', parent=body_bold, alignment=1))
        ]
    ]
    
    t_part = Table(particulars_data, colWidths=[5.0*inch, 1.5*inch])
    t_part.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F9F9F9')),
    ]))
    
    elements.append(t_part)
    elements.append(Spacer(1, 20))
    
    sig_data = [
        [
            Paragraph("<b>A. Certified:</b><br/><br/>Supporting documents complete and proper; cash available for salary disbursement.", body_style),
            Paragraph("<b>B. Approved for Payment:</b><br/><br/>Disbursement of funds for general payroll approved.", body_style)
        ],
        [
            Spacer(1, 40),
            Spacer(1, 40)
        ],
        [
            Paragraph("<u><b>ACCOUNTANT / PAYROLL OFFICER</b></u>", ParagraphStyle('SigBold', parent=body_bold, alignment=1)),
            Paragraph("<u><b>SCHOOLS DIVISION SUPERINTENDENT</b></u>", ParagraphStyle('SigBold', parent=body_bold, alignment=1))
        ],
        [
            Paragraph("Date signed: ___________________", ParagraphStyle('SigDate', parent=body_style, alignment=1)),
            Paragraph("Date signed: ___________________", ParagraphStyle('SigDate', parent=body_style, alignment=1))
        ]
    ]
    
    t_sig = Table(sig_data, colWidths=[3.25*inch, 3.25*inch])
    t_sig.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.black),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    
    elements.append(t_sig)
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf

def generate_payslip_pdf(payroll):
    from reportlab.lib.pagesizes import A4
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Normal'], fontSize=14, fontName='Helvetica-Bold', alignment=1, spaceAfter=2)
    subtitle_style = ParagraphStyle('SubtitleStyle', parent=styles['Normal'], fontSize=10, fontName='Helvetica', alignment=1, spaceAfter=15)
    section_style = ParagraphStyle('SectionStyle', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=5)
    item_label = ParagraphStyle('ItemLabel', parent=styles['Normal'], fontSize=9, fontName='Helvetica')
    item_val = ParagraphStyle('ItemVal', parent=styles['Normal'], fontSize=9, fontName='Helvetica', alignment=2)
    item_val_bold = ParagraphStyle('ItemValBold', parent=styles['Normal'], fontSize=9, fontName='Helvetica-Bold', alignment=2)
    
    # Header
    elements.append(Paragraph("<b>DEPARTMENT OF EDUCATION - DIVISION OF LUCENA CITY</b>", title_style))
    elements.append(Paragraph(f"OFFICIAL SALARY PAYSLIP - {payroll.cutoff_period.upper()}", subtitle_style))
    
    # Employee Info Table
    emp = payroll.employee
    info_data = [
        [Paragraph("<b>Employee Name:</b>", item_label), Paragraph(f"{emp.first_name} {emp.last_name}", item_label),
         Paragraph("<b>Employee No:</b>", item_label), Paragraph(str(emp.id), item_label)],
        [Paragraph("<b>Position:</b>", item_label), Paragraph(emp.position or 'Teacher', item_label),
         Paragraph("<b>School/Station:</b>", item_label), Paragraph(emp.school.name if emp.school else 'Main Office', item_label)],
        [Paragraph("<b>Pay Period:</b>", item_label), Paragraph(payroll.cutoff_period, item_label),
         Paragraph("<b>Status:</b>", item_label), Paragraph(payroll.status.upper(), item_label)]
    ]
    t_info = Table(info_data, colWidths=[1.2*inch, 2.2*inch, 1.2*inch, 2.2*inch])
    t_info.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_info)
    elements.append(Spacer(1, 15))
    
    # Financial Breakdown Table
    financial_data = [
        [Paragraph("<b>Earnings / Basic Pay</b>", section_style), "", Paragraph("<b>Deductions</b>", section_style), ""],
        [Paragraph("Basic Monthly Salary", item_label), Paragraph(f"Php {emp.salary:,.2f}", item_val),
         Paragraph("SSS Contribution", item_label), Paragraph(f"Php {payroll.sss:,.2f}", item_val)],
        [Paragraph("Days Worked (Standard: 11)", item_label), Paragraph(f"{payroll.days_worked}", item_val),
         Paragraph("PhilHealth", item_label), Paragraph(f"Php {payroll.philhealth:,.2f}", item_val)],
        [Paragraph("Calculated Basic Salary", item_label), Paragraph(f"Php {payroll.basic_salary:,.2f}", item_val),
         Paragraph("Pag-IBIG", item_label), Paragraph(f"Php {payroll.pagibig:,.2f}", item_val)],
        ["", "", Paragraph("Withholding Tax", item_label), Paragraph(f"Php {payroll.tax:,.2f}", item_val)],
        ["", "", Paragraph("Provident Loan Payment", item_label), Paragraph(f"Php {payroll.loans:,.2f}", item_val)],
        [Paragraph("<b>Gross Earnings</b>", ParagraphStyle('EB', parent=item_label, fontName='Helvetica-Bold')), 
         Paragraph(f"<b>Php {payroll.basic_salary:,.2f}</b>", item_val_bold),
         Paragraph("<b>Total Deductions</b>", ParagraphStyle('DB', parent=item_label, fontName='Helvetica-Bold')), 
         Paragraph(f"<b>Php {payroll.total_deductions:,.2f}</b>", item_val_bold)]
    ]
    
    t_financial = Table(financial_data, colWidths=[2.2*inch, 1.2*inch, 2.2*inch, 1.2*inch])
    t_financial.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#0038A8')),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor('#0038A8')),
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F9F9F9')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F0F4F8')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_financial)
    elements.append(Spacer(1, 20))
    
    # Net Pay Callout
    net_data = [
        [Paragraph("<b>NET TAKE-HOME PAY:</b>", ParagraphStyle('NL', parent=styles['Normal'], fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#0038A8'))),
         Paragraph(f"<b>Php {payroll.net_salary:,.2f}</b>", ParagraphStyle('NV', parent=styles['Normal'], fontSize=14, fontName='Helvetica-Bold', alignment=2, textColor=colors.HexColor('#0038A8')))]
    ]
    t_net = Table(net_data, colWidths=[3.4*inch, 3.4*inch])
    t_net.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EBF3FC')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#A3C1AD')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(t_net)
    elements.append(Spacer(1, 30))
    
    # Footer Certification
    elements.append(Paragraph("<i>This is a computer-generated official document. No signature is required.</i>", ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=1, textColor=colors.grey)))
    
    doc.build(elements)
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
