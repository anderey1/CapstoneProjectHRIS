from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from django.http import HttpResponse
from django.conf import settings
from io import BytesIO
from datetime import date
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
        
        # Form always has 31 rows (Civil Service standard)
        for day in range(1, 32):
            if day >= start_day and day <= end_day and day <= num_days:
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
        t.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 7),
            ('GRID', (0,0), (-1,-2), 0.5, colors.black),
            ('SPAN', (1,0), (2,0)),
            ('SPAN', (3,0), (4,0)),
            ('SPAN', (5,0), (6,0)),
            ('BOTTOMPADDING', (0,0), (-1,-1), 1),
            ('TOPPADDING', (0,0), (-1,-1), 1),
        ]))
        
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
